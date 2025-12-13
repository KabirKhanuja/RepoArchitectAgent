#!/usr/bin/env python3
"""
Repository analysis script for RepoArchitectAgent.
Performs shallow clone, language detection, dependency parsing, and API endpoint discovery.
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Set


def cleanup_repo(path: str = 'temp_repo', retries: int = 5) -> None:
    """Clean up temporary repository with retry logic for Windows file locking."""
    if not os.path.exists(path):
        return
    
    for attempt in range(retries):
        try:
            # On Windows, git may lock files; be more aggressive
            if sys.platform == 'win32':
                # Kill any git processes
                subprocess.run(['taskkill', '/F', '/IM', 'git.exe'], 
                              capture_output=True, timeout=5)
                # Kill any python processes that might hold locks
                subprocess.run(['taskkill', '/F', '/IM', 'python.exe'], 
                              capture_output=True, timeout=5)
                time.sleep(1)  # Wait longer for handles to release
            
            # Remove read-only flag on Windows
            if sys.platform == 'win32':
                subprocess.run(
                    ['attrib', '-R', '/S', '/D', path],
                    capture_output=True,
                    timeout=10
                )
            
            shutil.rmtree(path)
            print(f"[+] Cleaned up temporary repository")
            return
        except (OSError, PermissionError) as e:
            if attempt < retries - 1:
                time.sleep(2)  # Wait before retry
                continue
            else:
                print(f"[!] Warning: Could not clean up {path}: {e}")
                # Non-fatal error - don't fail the script
                return


def shallow_clone(repo_url: str, dest: str = 'temp_repo') -> str:
    """Perform shallow clone of the repository."""
    # Clean up any existing temp directory first
    if os.path.exists(dest):
        cleanup_repo(dest)
    
    print(f"[*] Shallow cloning {repo_url}...")
    try:
        subprocess.run(
            ['git', 'clone', '--depth', '1', repo_url, dest],
            check=True,
            capture_output=True,
            timeout=60
        )
        print(f"[+] Repository cloned to {dest}")
        return dest
    except subprocess.CalledProcessError as e:
        print(f"[-] Clone failed: {e.stderr.decode()}", file=sys.stderr)
        raise
    except Exception as e:
        print(f"[-] Error cloning repository: {e}", file=sys.stderr)
        raise



def detect_languages(repo_path: str) -> Set[str]:
    """Detect programming languages used in the repository."""
    languages = set()
    language_patterns = {
        'javascript': {'.js', '.jsx', '.mjs'},
        'typescript': {'.ts', '.tsx'},
        'python': {'.py'},
        'java': {'.java'},
        'go': {'.go'},
        'rust': {'.rs'},
        'ruby': {'.rb'},
        'php': {'.php'},
        'csharp': {'.cs'},
        'cpp': {'.cpp', '.cc', '.cxx', '.h', '.hpp'},
        'c': {'.c'},
    }
    
    for root, dirs, files in os.walk(repo_path):
        # Skip common directories
        dirs[:] = [d for d in dirs if d not in {'.git', 'node_modules', '.venv', 'venv', 'dist', 'build', '__pycache__'}]
        
        for file in files:
            ext = Path(file).suffix.lower()
            for lang, exts in language_patterns.items():
                if ext in exts:
                    languages.add(lang)
    
    return languages


def detect_frameworks(repo_path: str, languages: Set[str]) -> Set[str]:
    """Detect frameworks and key technologies."""
    frameworks = set()
    
    # Check for key files
    key_files = {
        'package.json': ['nodejs', 'npm'],
        'yarn.lock': ['yarn'],
        'requirements.txt': ['python', 'pip'],
        'setup.py': ['python'],
        'Dockerfile': ['docker'],
        'docker-compose.yml': ['docker-compose'],
        '.github/workflows': ['github-actions'],
        'tsconfig.json': ['typescript'],
        'next.config.js': ['nextjs'],
        'nuxt.config.js': ['nuxt'],
        'vite.config.js': ['vite'],
        'webpack.config.js': ['webpack'],
        'babel.config.js': ['babel'],
        'Gemfile': ['ruby'],
        'go.mod': ['go'],
        'Cargo.toml': ['rust'],
        'pom.xml': ['maven'],
        'build.gradle': ['gradle'],
        '.gitlab-ci.yml': ['gitlab-ci'],
    }
    
    for file_path, framework_list in key_files.items():
        full_path = Path(repo_path) / file_path
        if full_path.exists():
            frameworks.update(framework_list)
    
    # Check package.json for dependencies
    pkg_json_path = Path(repo_path) / 'package.json'
    if pkg_json_path.exists():
        try:
            with open(pkg_json_path) as f:
                pkg_data = json.load(f)
                deps = list(pkg_data.get('dependencies', {}).keys()) + \
                       list(pkg_data.get('devDependencies', {}).keys())
                
                if 'react' in deps:
                    frameworks.add('react')
                if 'vue' in deps:
                    frameworks.add('vue')
                if 'angular' in deps:
                    frameworks.add('angular')
                if 'express' in deps:
                    frameworks.add('express')
                if 'fastify' in deps:
                    frameworks.add('fastify')
                if 'django' in deps:
                    frameworks.add('django')
        except Exception as e:
            print(f"[!] Error parsing package.json: {e}")
    
    return frameworks


def parse_dependencies(repo_path: str) -> Dict[str, List[str]]:
    """Parse dependencies from various package managers."""
    dependencies = {}
    
    # Node/npm dependencies
    pkg_json_path = Path(repo_path) / 'package.json'
    if pkg_json_path.exists():
        try:
            with open(pkg_json_path) as f:
                pkg_data = json.load(f)
                deps = list(pkg_data.get('dependencies', {}).keys())
                if deps:
                    dependencies['npm'] = sorted(deps)[:20]  # Top 20
        except Exception as e:
            print(f"[!] Error parsing package.json: {e}")
    
    # Python dependencies
    req_txt_path = Path(repo_path) / 'requirements.txt'
    if req_txt_path.exists():
        try:
            with open(req_txt_path) as f:
                reqs = [line.strip() for line in f if line.strip() and not line.startswith('#')]
                if reqs:
                    dependencies['pip'] = reqs[:20]  # Top 20
        except Exception as e:
            print(f"[!] Error parsing requirements.txt: {e}")
    
    # Gemfile (Ruby)
    gemfile_path = Path(repo_path) / 'Gemfile'
    if gemfile_path.exists():
        try:
            with open(gemfile_path) as f:
                gems = [line.strip() for line in f if 'gem ' in line]
                if gems:
                    dependencies['bundler'] = gems[:20]
        except Exception as e:
            print(f"[!] Error parsing Gemfile: {e}")
    
    return dependencies


def find_api_endpoints(repo_path: str) -> Dict[str, List[str]]:
    """Discover API endpoints (Express routes, Next.js pages/api, FastAPI routes, etc.)."""
    endpoints = {}
    
    # Next.js API routes (pages/api/*)
    nextjs_api_dir = Path(repo_path) / 'pages' / 'api'
    if nextjs_api_dir.exists():
        api_files = []
        for file in nextjs_api_dir.rglob('*.ts'):
            api_files.append(f'/api/{file.stem}')
        for file in nextjs_api_dir.rglob('*.js'):
            if not file.name.endswith('.test.js'):
                api_files.append(f'/api/{file.stem}')
        if api_files:
            endpoints['nextjs'] = sorted(set(api_files))[:15]
    
    # Express routes (check for app.get, app.post, etc.)
    for root, dirs, files in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d not in {'.git', 'node_modules', 'dist', 'build', '.next'}]
        
        for file in files:
            if file.endswith('.js') or file.endswith('.ts'):
                file_path = Path(root) / file
                try:
                    with open(file_path, 'r', errors='ignore') as f:
                        content = f.read()
                        
                        # Find Express-like routes
                        express_routes = re.findall(
                            r"app\.(get|post|put|delete|patch)\(['\"]([^'\"]+)['\"]",
                            content
                        )
                        if express_routes and 'express' not in endpoints:
                            endpoints['express'] = []
                        for method, route in express_routes[:10]:
                            endpoints.setdefault('express', []).append(f'{method.upper()} {route}')
                        
                        # Find FastAPI routes (Python)
                        fastapi_routes = re.findall(
                            r"@app\.(get|post|put|delete|patch)\(['\"]([^'\"]+)['\"]",
                            content
                        )
                        if fastapi_routes and 'fastapi' not in endpoints:
                            endpoints['fastapi'] = []
                        for method, route in fastapi_routes[:10]:
                            endpoints.setdefault('fastapi', []).append(f'{method.upper()} {route}')
                
                except Exception as e:
                    pass
    
    return endpoints


def get_top_level_dirs(repo_path: str) -> List[str]:
    """Get list of top-level directories."""
    try:
        items = os.listdir(repo_path)
        dirs = [d for d in items if os.path.isdir(os.path.join(repo_path, d)) 
                and not d.startswith('.') and d != 'node_modules']
        return sorted(dirs)
    except Exception as e:
        print(f"[!] Error listing directories: {e}")
        return []


def detect_dockerfile(repo_path: str) -> bool:
    """Check if Dockerfile exists."""
    return (Path(repo_path) / 'Dockerfile').exists()


def analyze_repo(repo_url: str, repo_path: str = 'temp_repo') -> Dict[str, Any]:
    """Main analysis function."""
    print(f"\n[*] Starting repository analysis for {repo_url}")
    
    # Check if it's a local path (repo or directory) or remote URL
    is_local_path = os.path.isdir(repo_url)
    
    if is_local_path:
        # Use local path directly (works for both repos and regular directories)
        repo_path = os.path.abspath(repo_url)
        print(f"[*] Analyzing local path: {repo_path}")
    else:
        # Clone the repo if it's a remote URL
        repo_path = shallow_clone(repo_url, repo_path)
    
    print("[*] Detecting languages...")
    languages = detect_languages(repo_path)
    
    print("[*] Detecting frameworks...")
    frameworks = detect_frameworks(repo_path, languages)
    
    print("[*] Parsing dependencies...")
    dependencies = parse_dependencies(repo_path)
    
    print("[*] Finding API endpoints...")
    api_endpoints = find_api_endpoints(repo_path)
    
    print("[*] Analyzing structure...")
    top_level_dirs = get_top_level_dirs(repo_path)
    has_dockerfile = detect_dockerfile(repo_path)
    
    # Count files
    file_count = sum(len(files) for _, _, files in os.walk(repo_path))
    
    repo_shape = {
        'url': repo_url,
        'languages': sorted(list(languages)),
        'frameworks': sorted(list(frameworks)),
        'dependencies': dependencies,
        'api_endpoints': api_endpoints,
        'top_level_directories': top_level_dirs,
        'has_dockerfile': has_dockerfile,
        'file_count': file_count,
    }
    
    print(f"[+] Analysis complete: {len(languages)} languages, {len(frameworks)} frameworks")
    return repo_shape


def main():
    parser = argparse.ArgumentParser(
        description='Analyze GitHub repository structure and dependencies'
    )
    parser.add_argument('repo_url', help='GitHub repository URL')
    parser.add_argument(
        'output_dir',
        nargs='?',
        default='runs/latest',
        help='Output directory for results (default: runs/latest)'
    )
    
    args = parser.parse_args()
    
    try:
        # Create output directory
        output_dir = Path(args.output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Analyze repo
        repo_shape = analyze_repo(args.repo_url)
        
        # Save to JSON
        output_file = output_dir / 'repo_shape.json'
        with open(output_file, 'w') as f:
            json.dump(repo_shape, f, indent=2)
        
        print(f"\n[+] Results saved to {output_file}")
        print(json.dumps(repo_shape, indent=2))
        
        # Cleanup temp repo (with retry logic for Windows)
        cleanup_repo('temp_repo')
        
        return 0
    
    except Exception as e:
        print(f"\n[-] Error: {e}", file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())

