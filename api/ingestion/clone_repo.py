import os
import subprocess
from urllib.parse import urlparse


def clone_repository(repository_url: str, workspace: str) -> str:
    """
    Clones a public GitHub repository into the workspace using a shallow clone.
    Returns the local path to the cloned repo.
    """

    # --------------------
    # 1. Basic URL validation
    # --------------------
    parsed = urlparse(repository_url)

    if parsed.netloc != "github.com":
        raise ValueError("Only github.com repositories are supported.")

    path_parts = parsed.path.strip("/").split("/")
    if len(path_parts) < 2:
        raise ValueError("Invalid GitHub repository URL.")

    owner, repo = path_parts[0], path_parts[1]
    repo_name = repo.replace(".git", "")

    clone_path = os.path.join(workspace, repo_name)

    # --------------------
    # 2. Git clone (shallow)
    # --------------------
    try:
        subprocess.run(
            [
                "git",
                "clone",
                "--depth=1",
                "--no-tags",
                repository_url,
                clone_path,
            ],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
    except subprocess.CalledProcessError as e:
        raise ValueError("Failed to clone repository. Ensure it is public and accessible.")

    # --------------------
    # 3. Sanity check
    # --------------------
    if not os.path.exists(clone_path):
        raise ValueError("Repository clone failed unexpectedly.")

    return clone_path