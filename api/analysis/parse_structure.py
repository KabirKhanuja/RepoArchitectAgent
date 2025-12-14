import os
from typing import Dict, List, Any


IGNORED_DIRS = {
    ".git",
    "node_modules",
    "__pycache__",
    ".next",
    "dist",
    "build",
    "venv",
    ".venv",
}


def parse_structure(repo_path: str) -> Dict[str, Any]:
    """
    Parses repository structure to extract:
    - total file count
    - folder tree (string)
    - module list
    """

    total_files = 0
    tree_lines: List[str] = []
    modules: List[Dict[str, Any]] = []

    # --------------------
    # Helper: build tree
    # --------------------
    def walk(dir_path: str, prefix: str = ""):
        nonlocal total_files

        try:
            entries = sorted(os.listdir(dir_path))
        except Exception:
            return

        for idx, entry in enumerate(entries):
            full_path = os.path.join(dir_path, entry)

            if entry in IGNORED_DIRS:
                continue

            connector = "└── " if idx == len(entries) - 1 else "├── "
            tree_lines.append(prefix + connector + entry)

            if os.path.isdir(full_path):
                walk(full_path, prefix + ("    " if idx == len(entries) - 1 else "│   "))
            else:
                total_files += 1

    # --------------------
    # Build folder tree
    # --------------------
    tree_lines.append(os.path.basename(repo_path))
    walk(repo_path)

    # --------------------
    # Infer modules (top-level folders)
    # --------------------
    try:
        top_level = [
            d for d in os.listdir(repo_path)
            if os.path.isdir(os.path.join(repo_path, d)) and d not in IGNORED_DIRS
        ]
    except Exception:
        top_level = []

    for folder in top_level:
        folder_path = os.path.join(repo_path, folder)
        key_files: List[str] = []

        for root, _, files in os.walk(folder_path):
            for f in files:
                if f in ("index.ts", "index.tsx", "index.js", "main.py", "app.py"):
                    rel = os.path.relpath(os.path.join(root, f), repo_path)
                    key_files.append(rel)

            if len(key_files) >= 3:
                break

        modules.append({
            "name": folder,
            "key_files": key_files,
        })

    return {
        "total_files": total_files,
        "folder_structure": "\n".join(tree_lines),
        "modules": modules,
    }