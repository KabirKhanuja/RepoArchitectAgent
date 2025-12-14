#!/usr/bin/env python3
import argparse
import json
import os
from pathlib import Path

def analyze_repo(repo_path: str) -> dict:
    structure = []
    for root, dirs, files in os.walk(repo_path):
        # skip node_modules and .git
        parts = Path(root).parts
        if any(p in {"node_modules", ".git"} for p in parts):
            continue
        for f in files:
            structure.append(str(Path(root) / f))
    return {"files": structure}

def main():
    parser = argparse.ArgumentParser(description="Analyze repository structure")
    parser.add_argument("--repo", default=".", help="Path to repo root")
    parser.add_argument("--out", required=True, help="Output JSON path")
    args = parser.parse_args()

    data = analyze_repo(args.repo)
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"Wrote {out_path}")

if __name__ == "__main__":
    main()
