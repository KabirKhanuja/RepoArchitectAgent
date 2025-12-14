import os
import shutil
import tempfile
from typing import Dict, Any

from api.ingestion.clone_repo import clone_repository
from api.analysis.detect_stack import detect_stack
from api.analysis.parse_structure import parse_structure
from api.analysis.dependencies import extract_dependencies
from api.analysis.risks import detect_risks
from api.ir.builder import build_ir
from api.llm.summarize import generate_overview
from api.llm.generate_mermaid import generate_architecture
from api.llm.generate_ci import generate_recommendations


def analyze_repository(repository_url: str) -> Dict[str, Any]:
    """
    Orchestrates the full repository analysis pipeline.
    Returns a dict that matches AnalysisResponse expected by frontend.
    """

    # --------------------
    # 1. Create temp workspace
    # --------------------
    workspace = tempfile.mkdtemp(prefix="repoarchitect_")

    try:
        # --------------------
        # 2. Clone repository
        # --------------------
        repo_path = clone_repository(repository_url, workspace)

        # --------------------
        # 3. Deterministic analysis (NO LLM)
        # --------------------
        stack_info = detect_stack(repo_path)
        structure_info = parse_structure(repo_path)
        dependency_info = extract_dependencies(repo_path)
        risk_info = detect_risks(repo_path)

        # --------------------
        # 4. Build Intermediate Representation (IR)
        # --------------------
        ir = build_ir(
            repository_url=repository_url,
            repo_path=repo_path,
            stack=stack_info,
            structure=structure_info,
            dependencies=dependency_info,
            risks=risk_info,
        )

        # --------------------
        # 5. LLM-powered reasoning
        # --------------------
        overview = generate_overview(ir)
        architecture = generate_architecture(ir)
        recommendations = generate_recommendations(ir)

        # --------------------
        # 6. Assemble final response (AnalysisResponse)
        # --------------------
        response: Dict[str, Any] = {
            "overview": overview,
            "architecture": architecture,
            "modules": ir.get("modules"),
            "dependencies": ir.get("dependencies"),
            "recommendations": recommendations,
        }

        return response

    finally:
        # --------------------
        # 7. Cleanup temp files
        # --------------------
        shutil.rmtree(workspace, ignore_errors=True)