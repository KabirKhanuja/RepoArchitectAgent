from typing import Dict, Any, List


def generate_overview(ir: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generates repository overview content.
    This is v1-safe: rule-based with LLM-ready structure.
    """

    overview = ir.get("overview", {})
    architecture = ir.get("architecture", {})
    modules = ir.get("modules", [])
    dependencies = ir.get("dependencies", {})

    # --------------------
    # Description (rule-based)
    # --------------------
    description_parts: List[str] = []

    if overview.get("primary_languages"):
        langs = ", ".join(overview["primary_languages"])
        description_parts.append(f"This repository is primarily written in {langs}.")

    if architecture.get("structure_type"):
        description_parts.append(
            f"It follows a {architecture['structure_type']} architecture."
        )

    if modules:
        description_parts.append(
            f"The codebase is organized into {len(modules)} main modules."
        )

    description = " ".join(description_parts) if description_parts else None

    # --------------------
    # Key features (heuristic)
    # --------------------
    key_features: List[str] = []

    ext_deps = dependencies.get("external_dependencies", [])
    if ext_deps:
        key_features.append("Uses modern third-party dependencies")

    if architecture.get("structure_type") == "fullstack":
        key_features.append("Full-stack application with frontend and backend components")

    if architecture.get("folder_structure"):
        key_features.append("Clearly defined project structure")

    if not key_features:
        key_features = None

    # --------------------
    # Return updated overview
    # --------------------
    return {
        **overview,
        "description": description,
        "key_features": key_features,
    }