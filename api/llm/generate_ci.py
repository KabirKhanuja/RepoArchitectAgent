from typing import Dict, Any, List


def generate_recommendations(ir: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Generates actionable recommendations based on detected risks.
    v1: rule-based, deterministic, frontend-aligned.
    """

    risks = ir.get("risks", {})
    recommendations: List[Dict[str, Any]] = []

    # --------------------
    # Missing README
    # --------------------
    if risks.get("missing_readme"):
        recommendations.append({
            "title": "Add a README file",
            "description": (
                "The repository does not contain a README. "
                "Adding one will help new contributors understand the purpose, "
                "setup steps, and usage of the project."
            ),
            "priority": "high",
            "impact": "Improves onboarding and contributor experience",
        })

    # --------------------
    # Missing CI
    # --------------------
    if risks.get("missing_ci"):
        recommendations.append({
            "title": "Set up Continuous Integration (CI)",
            "description": (
                "No CI workflow was detected. "
                "Adding a CI pipeline can automatically run tests and checks "
                "on every pull request to prevent regressions."
            ),
            "priority": "high",
            "impact": "Improves code reliability and development velocity",
        })

    # --------------------
    # Missing tests
    # --------------------
    if risks.get("missing_tests"):
        recommendations.append({
            "title": "Introduce automated tests",
            "description": (
                "The repository does not appear to include automated tests. "
                "Adding unit or integration tests will help ensure correctness "
                "as the codebase evolves."
            ),
            "priority": "medium",
            "impact": "Reduces bugs and increases confidence in changes",
        })

    # --------------------
    # Missing env example
    # --------------------
    if risks.get("missing_env_example"):
        recommendations.append({
            "title": "Provide an environment variable example file",
            "description": (
                "No example environment configuration file was found. "
                "Including a `.env.example` file helps contributors configure "
                "the project correctly."
            ),
            "priority": "low",
            "impact": "Simplifies local setup and reduces configuration errors",
        })

    return recommendations