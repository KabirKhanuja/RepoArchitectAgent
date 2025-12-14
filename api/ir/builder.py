from typing import Dict, Any, List


def build_ir(
    repository_url: str,
    repo_path: str,
    stack: Dict[str, Any],
    structure: Dict[str, Any],
    dependencies: Dict[str, Any],
    risks: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Builds a normalized Intermediate Representation (IR)
    that matches frontend expectations.
    """

    # --------------------
    # Overview
    # --------------------
    repo_name = repository_url.rstrip("/").split("/")[-1]

    overview = {
        "repository_name": repo_name,
        "total_files": structure.get("total_files"),
        "primary_languages": stack.get("primary_languages"),
        "description": None,       # LLM can fill
        "key_features": None,      # LLM can fill
    }

    # --------------------
    # Architecture
    # --------------------
    architecture = {
        "structure_type": stack.get("structure_type"),
        "folder_structure": structure.get("folder_structure"),
        "patterns": None,          # LLM can infer
    }

    # --------------------
    # Modules
    # --------------------
    modules: List[Dict[str, Any]] = []

    for module in structure.get("modules", []):
        modules.append({
            "name": module.get("name"),
            "purpose": None,        # LLM can fill
            "key_files": module.get("key_files", []),
            "dependencies": None,   # LLM can fill
        })

    # --------------------
    # Dependencies
    # --------------------
    deps = {
        "external_dependencies": dependencies.get("external_dependencies", []),
        "internal_dependencies": dependencies.get("internal_dependencies", []),
    }

    # --------------------
    # Risks (kept internal for now)
    # --------------------
    ir = {
        "overview": overview,
        "architecture": architecture,
        "modules": modules,
        "dependencies": deps,
        "risks": risks,
    }

    return ir