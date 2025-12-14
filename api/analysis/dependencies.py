import os
import json
from typing import Dict, List, Any


def extract_dependencies(repo_path: str) -> Dict[str, Any]:
    """
    Extracts external and internal dependencies from the repository.
    """

    external_dependencies: List[Dict[str, str]] = []
    internal_dependencies: List[str] = []

    # --------------------
    # JavaScript / TypeScript (package.json)
    # --------------------
    package_json_path = os.path.join(repo_path, "package.json")
    if os.path.exists(package_json_path):
        try:
            with open(package_json_path, "r", encoding="utf-8") as f:
                package_data = json.load(f)

            deps = package_data.get("dependencies", {})
            dev_deps = package_data.get("devDependencies", {})

            for name, version in {**deps, **dev_deps}.items():
                external_dependencies.append({
                    "name": name,
                    "version": version,
                })
        except Exception:
            pass  # fail silently for v1

    # --------------------
    # Python (requirements.txt)
    # --------------------
    requirements_path = os.path.join(repo_path, "requirements.txt")
    if os.path.exists(requirements_path):
        try:
            with open(requirements_path, "r", encoding="utf-8") as f:
                for line in f.readlines():
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue

                    if "==" in line:
                        name, version = line.split("==", 1)
                        external_dependencies.append({
                            "name": name,
                            "version": version,
                        })
                    else:
                        external_dependencies.append({
                            "name": line,
                        })
        except Exception:
            pass

    # --------------------
    # Python (pyproject.toml) – very basic support
    # --------------------
    pyproject_path = os.path.join(repo_path, "pyproject.toml")
    if os.path.exists(pyproject_path):
        try:
            with open(pyproject_path, "r", encoding="utf-8") as f:
                for line in f.readlines():
                    line = line.strip()
                    if line.startswith(("dependencies", "[")):
                        continue
                    if "=" in line and not line.startswith("["):
                        name = line.split("=")[0].strip()
                        if name and name.isidentifier():
                            external_dependencies.append({"name": name})
        except Exception:
            pass

    # --------------------
    # Internal dependencies (very shallow heuristic)
    # --------------------
    try:
        for entry in os.listdir(repo_path):
            full_path = os.path.join(repo_path, entry)
            if os.path.isdir(full_path) and not entry.startswith("."):
                internal_dependencies.append(entry)
    except Exception:
        pass

    return {
        "external_dependencies": external_dependencies,
        "internal_dependencies": internal_dependencies,
    }