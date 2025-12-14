from typing import Dict, Any, List


def generate_architecture(ir: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generates architecture-level insights from IR.
    v1: heuristic-based, Mermaid-ready.
    """

    architecture = ir.get("architecture", {})
    structure_type = architecture.get("structure_type")
    modules = ir.get("modules", [])
    dependencies = ir.get("dependencies", {})

    patterns: List[str] = []

    # --------------------
    # Heuristic pattern detection
    # --------------------
    if structure_type == "fullstack":
        patterns.append("Client-Server Architecture")

    if modules and len(modules) > 3:
        patterns.append("Modular Architecture")

    if dependencies.get("external_dependencies"):
        patterns.append("Dependency-based Composition")

    if not patterns:
        patterns = None

    # --------------------
    # Return architecture object
    # --------------------
    return {
        **architecture,
        "patterns": patterns,
    }