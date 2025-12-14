import os
from collections import Counter
from typing import Dict, List


# Common file extensions mapped to languages
EXTENSION_LANGUAGE_MAP = {
    ".js": "JavaScript",
    ".ts": "TypeScript",
    ".jsx": "JavaScript",
    ".tsx": "TypeScript",
    ".py": "Python",
    ".java": "Java",
    ".go": "Go",
    ".rs": "Rust",
    ".cpp": "C++",
    ".c": "C",
    ".cs": "C#",
    ".php": "PHP",
}


def detect_stack(repo_path: str) -> Dict[str, any]:
    """
    Detects primary languages and frameworks used in the repository.
    """

    language_counter = Counter()
    frameworks: List[str] = []

    for root, _, files in os.walk(repo_path):
        # skip git internals
        if ".git" in root:
            continue

        for file in files:
            _, ext = os.path.splitext(file)
            if ext in EXTENSION_LANGUAGE_MAP:
                language_counter[EXTENSION_LANGUAGE_MAP[ext]] += 1

    # --------------------
    # Detect frameworks via config files
    # --------------------
    files_at_root = set(os.listdir(repo_path))

    if "package.json" in files_at_root:
        frameworks.append("Node.js")

        if "next.config.js" in files_at_root or "next.config.mjs" in files_at_root:
            frameworks.append("Next.js")

        if os.path.exists(os.path.join(repo_path, "vite.config.js")):
            frameworks.append("Vite")

    if "requirements.txt" in files_at_root or "pyproject.toml" in files_at_root:
        frameworks.append("Python")

        if os.path.exists(os.path.join(repo_path, "app.py")):
            frameworks.append("Flask")

        if os.path.exists(os.path.join(repo_path, "main.py")):
            frameworks.append("FastAPI")

        if "manage.py" in files_at_root:
            frameworks.append("Django")

    # --------------------
    # Infer structure type (very high-level)
    # --------------------
    structure_type = "unknown"

    if "Next.js" in frameworks and "Python" in frameworks:
        structure_type = "fullstack"
    elif "Next.js" in frameworks:
        structure_type = "frontend"
    elif "Python" in frameworks:
        structure_type = "backend"

    primary_languages = [
        lang for lang, _ in language_counter.most_common(3)
    ]

    return {
        "primary_languages": primary_languages,
        "frameworks": frameworks,
        "structure_type": structure_type,
    }