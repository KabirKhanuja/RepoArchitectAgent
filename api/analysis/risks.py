import os
from typing import Dict, Any


def detect_risks(repo_path: str) -> Dict[str, Any]:
    """
    Detects basic repository risks and missing best practices.
    Returns signals, not human text.
    """

    risks = {
        "missing_readme": True,
        "missing_ci": True,
        "missing_tests": True,
        "missing_env_example": True,
    }

    # --------------------
    # README
    # --------------------
    for name in ("README.md", "README.MD", "readme.md", "Readme.md"):
        if os.path.exists(os.path.join(repo_path, name)):
            risks["missing_readme"] = False
            break

    # --------------------
    # CI (GitHub Actions)
    # --------------------
    github_dir = os.path.join(repo_path, ".github", "workflows")
    if os.path.exists(github_dir) and os.listdir(github_dir):
        risks["missing_ci"] = False

    # --------------------
    # Tests
    # --------------------
    for root, dirs, files in os.walk(repo_path):
        for d in dirs:
            if d.lower() in ("tests", "__tests__", "test"):
                risks["missing_tests"] = False
                break
        if not risks["missing_tests"]:
            break

    # --------------------
    # Env example
    # --------------------
    for name in (".env.example", ".env.sample", ".env.template"):
        if os.path.exists(os.path.join(repo_path, name)):
            risks["missing_env_example"] = False
            break

    return risks