from pathlib import Path
from typing import List

def list_js_files(root: Path) -> List[Path]:
    return [p for p in root.rglob("*.js") if "node_modules" not in p.parts]

def list_py_files(root: Path) -> List[Path]:
    return [p for p in root.rglob("*.py") if ".venv" not in p.parts]
