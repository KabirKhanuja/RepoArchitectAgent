from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import Optional, Any, Dict
import os
from groq import Groq
import subprocess
import json
import anthropic
from typing import List
import requests
import base64

from dotenv import load_dotenv
load_dotenv("web/.env.local")

from api.orchestration.analyze_repo import analyze_repository

# FastAPI App
app = FastAPI(
    title="RepoArchitectAgent API",
    version="0.1.0",
    description="Analyze GitHub repositories and generate architectural insights",
)

# Allow frontend (Vercel) to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Replace with specific domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request / Response Models
class AnalyzeRequest(BaseModel):
    repository_url: HttpUrl

class RepoSummaryRequest(BaseModel):
    repo_path: str
    repo_url: Optional[str] = None

class DescriptionRequest(BaseModel):
    repository_name: str
    primary_languages: list
    total_files: int
    folder_structure: Optional[str] = None

class MermaidRequest(BaseModel):
    folder_structure: Any
    repository_name: str

class AnalyzeResponse(BaseModel):
    overview: Optional[Dict[str, Any]] = None
    architecture: Optional[Dict[str, Any]] = None
    visualization: Optional[Dict[str, Any]] = None
    modules: Optional[Any] = None
    dependencies: Optional[Dict[str, Any]] = None
    recommendations: Optional[Any] = None

class DirectoryDescriptionsRequest(BaseModel):
    directories: list[str]
    repository_name: str
    folder_structure: Optional[Any] = None

class RecommendationsRequest(BaseModel):
    repository_name: str
    primary_languages: List[str]
    folder_structure: Optional[Any] = None
    dependencies: Optional[Dict[str, Any]] = None
    total_files: Optional[int] = None
    architecture_type: Optional[str] = None

class Recommendation(BaseModel):
    title: str
    description: str
    priority: str  # "high", "medium", "low"
    impact: str
    category: str  # "security", "performance", "architecture", "best-practices", "documentation"

class GitHubAnalysisRequest(BaseModel):
    repository_url: str
    github_token: Optional[str] = None


# Helper function (defined before use)
def analyze_repository_structure(repo_path: str):
    """Analyze repository structure to extract key information"""
    repo_info = {
        "languages": [],
        "directories": [],
        "key_files": [],
        "technologies": []
    }
    
    try:
        # Get directory structure
        for root, dirs, files in os.walk(repo_path):
            # Skip hidden and common ignore directories
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['node_modules', '__pycache__', 'venv', 'dist', 'build']]
            
            level = root.replace(repo_path, '').count(os.sep)
            if level == 0:
                repo_info["directories"] = dirs[:8]  # Top-level directories
            
            # Detect key files
            for file in files:
                if file in ['package.json', 'requirements.txt', 'Dockerfile', 'docker-compose.yml',
                           'next.config.js', 'tsconfig.json', 'setup.py', 'pyproject.toml']:
                    repo_info["key_files"].append(file)
                
                # Detect languages
                ext = os.path.splitext(file)[1]
                lang_map = {
                    '.py': 'Python',
                    '.js': 'JavaScript',
                    '.ts': 'TypeScript',
                    '.tsx': 'TypeScript',
                    '.jsx': 'JavaScript',
                    '.java': 'Java',
                    '.go': 'Go',
                    '.rs': 'Rust',
                    '.cpp': 'C++',
                    '.c': 'C'
                }
                if ext in lang_map and lang_map[ext] not in repo_info["languages"]:
                    repo_info["languages"].append(lang_map[ext])
        
        # Detect technologies from key files
        if 'package.json' in repo_info["key_files"]:
            repo_info["technologies"].extend(['Node.js', 'npm'])
        if 'next.config.js' in repo_info["key_files"]:
            repo_info["technologies"].append('Next.js')
        if 'requirements.txt' in repo_info["key_files"] or 'setup.py' in repo_info["key_files"]:
            repo_info["technologies"].append('pip')
        if 'Dockerfile' in repo_info["key_files"]:
            repo_info["technologies"].append('Docker')
            
    except Exception as e:
        print(f"Error analyzing repository: {e}")
    
    return repo_info


# Routes
@app.get("/")
async def root():
    return {"message": "RepoArchitectAgent API", "status": "running"}

@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest):
    """
    Entry point used by the frontend.
    Accepts a public GitHub repo URL and returns analysis.
    """
    try:
        result = analyze_repository(str(request.repository_url))
        return result
    except ValueError as e:
        # Known validation / repo errors
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Unknown failure – never leak internals
        print(f"Internal error during analysis: {e}")  # Log for debugging
        raise HTTPException(
            status_code=500,
            detail="Failed to analyze repository. Please try again later.",
        )

@app.post("/api/generate-description")
async def generate_description(request: DescriptionRequest):
    """
    Generate AI-powered repository description using Groq API
    """
    try:
        # Initialize Groq client
        groq_api_key = os.environ.get("GROQ_API_KEY")
        if not groq_api_key:
            raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")
        
        groq_client = Groq(api_key=groq_api_key)
        
        # Prepare repository context for analysis
        folder_structure_str = ""
        if request.folder_structure:
            if isinstance(request.folder_structure, str):
                folder_structure_str = request.folder_structure[:3000]  # Limit to prevent token overflow
            else:
                folder_structure_str = json.dumps(request.folder_structure, indent=2)[:3000]
        
        # Create prompt for Groq
        prompt = f"""Analyze this GitHub repository and generate a comprehensive summary.

### REPOSITORY CONTEXT
Repository Name: {request.repository_name}
Primary Languages: {', '.join(request.primary_languages) if request.primary_languages else 'Unknown'}
Total Files: {request.total_files}
Folder Structure:
{folder_structure_str}

---

### YOUR TASK
You must analyze the COMPLETE repository structure above and produce:
1. A concise overview description (2-4 sentences)
2. A list of key features (3-6 concrete points)

---

### ANALYSIS GUIDELINES

**For overview.description:**
- Identify what the repository does based on folder names, file types, and structure
- Mention the primary technology stack (languages/frameworks evident from structure)
- Describe the architectural approach (monorepo, microservices, client-server, etc.)
- Keep it professional and accessible to new contributors

**For overview.key_features:**
- Look for concrete architectural choices:
  * Separation of concerns (api/, web/, src/, lib/)
  * Testing infrastructure (tests/, __tests__/, test/)
  * Configuration management (config/, .env files)
  * Documentation (docs/, README files)
  * Build/deployment setup (Dockerfile, CI/CD configs)
  * Module organization patterns
- Each feature should be SPECIFIC and observable from the structure
- Avoid generic terms like "well-organized" or "scalable"
- Use phrases like:
  * "Modular backend with separate route handlers"
  * "Comprehensive test coverage across components"
  * "Docker-based deployment configuration"
  * "Clear separation of frontend and backend code"

---

### STRICT REQUIREMENTS
âœ… Analyze ONLY what you see in the repository structure
âŒ Do NOT hallucinate frameworks, databases, or tools not evident in the structure
âŒ Do NOT mention CI/CD unless you see .github/workflows/, .gitlab-ci.yml, etc.
âŒ Do NOT use markdown formatting in your response
âŒ Do NOT add explanations outside the JSON structure
âœ… Output ONLY valid JSON

---

### OUTPUT FORMAT
{{
  "description": "Your 2-4 sentence analysis here",
  "key_features": [
    "Specific observable feature 1",
    "Specific observable feature 2",
    "Specific observable feature 3",
    "Specific observable feature 4"
  ]
}}"""

        # Call Groq API
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert repository analyst. Analyze repository structures and generate precise, factual summaries. Output ONLY valid JSON with no markdown or code blocks."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            max_tokens=400
        )
        
        response_content = chat_completion.choices[0].message.content.strip()
        
        # Clean up response - remove markdown code blocks if present
        if "```json" in response_content:
            response_content = response_content.split("```json")[1].split("```")[0].strip()
        elif "```" in response_content:
            response_content = response_content.replace("```", "").strip()
        
        # Parse JSON response
        try:
            parsed_response = json.loads(response_content)
            description = parsed_response.get("description", "")
            key_features = parsed_response.get("key_features", [])
        except json.JSONDecodeError as je:
            print(f"JSON parse error: {je}")
            print(f"Response content: {response_content}")
            # Fallback: treat as plain text description
            description = response_content
            key_features = []
        
        return {
            "success": True,
            "description": description,
            "key_features": key_features
        }
        
    except Exception as e:
        print(f"Error generating description: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate description. Please try again.")

@app.post("/api/generate-mermaid")
async def generate_mermaid(request: MermaidRequest):
    """
    Generate Mermaid diagram for repository structure using Groq API
    """
    try:
        # Initialize Groq client
        groq_api_key = os.environ.get("GROQ_API_KEY")
        if not groq_api_key:
            raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")
        
        groq_client = Groq(api_key=groq_api_key)
        
        # Convert folder structure to string
        structure_str = request.folder_structure if isinstance(request.folder_structure, str) else str(request.folder_structure)
        
        # Create prompt for Groq
        prompt = f"""Generate a comprehensive Mermaid flowchart diagram (graph TD) for this repository structure.

### REPOSITORY INFORMATION
Repository: {request.repository_name}
Structure: {structure_str[:2000]}

### YOUR TASK
Create a detailed Mermaid diagram that helps a NEW USER understand the COMPLETE repository organization.

### REQUIREMENTS
1. **Comprehensive Coverage**:
   - Show ALL major directories (not just top-level)
   - Include important subdirectories (e.g., api/routes/, web/components/, src/utils/)
   - Show key configuration files (package.json, requirements.txt, Dockerfile, etc.)
   - Display important source files that reveal functionality

2. **Structure Guidelines**:
   - Start with: graph TD
   - Use simple node IDs (A, B, C, D, E, etc.)
   - Use square brackets [] for directories/folders
   - Use parentheses () for files
   - Maximum 25-30 nodes (balance detail with readability)

3. **What to Include**:
   - Main application directories (src/, app/, lib/)
   - Configuration directories (config/, .github/)
   - Test directories (tests/, __tests__/)
   - Documentation directories (docs/)
   - Build/deployment files (Dockerfile, docker-compose.yml)
   - Entry points (index.js, main.py, app.py)
   - Important subdirectories that show architecture (routes/, models/, controllers/, components/, pages/)

4. **Visual Hierarchy**:
   - Repository root → Main directories → Subdirectories → Key files
   - Group related items logically

### EXAMPLE FORMAT
graph TD
    A["{request.repository_name}/"]
    A --> B["api/"]
    A --> C["web/"]
    A --> D["docs/"]
    A --> E("README.md")
    A --> F("docker-compose.yml")
    B --> G["routes/"]
    B --> H["models/"]
    B --> I("index.py")
    G --> J("analyze.py")
    G --> K("health.py")
    C --> L["components/"]
    C --> M["pages/"]
    L --> N("AnalysisResults.tsx")
    M --> O("index.tsx")

### CRITICAL RULES
- Generate ONLY the Mermaid syntax code
- Do NOT include markdown code blocks
- Do NOT add explanations or comments
- Do NOT add styling or themes
- Focus on structure that helps understanding, not exhaustive file listing"""

        # Call Groq API
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert at creating comprehensive Mermaid diagrams for repository visualization. Output ONLY valid Mermaid syntax. No markdown, no explanations, no code blocks."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.2,
            max_tokens=800
        )
        
        mermaid_diagram = chat_completion.choices[0].message.content.strip()
        
        # Clean up the response to extract only the diagram
        if "```mermaid" in mermaid_diagram:
            # Extract content between ```mermaid and closing ```
            parts = mermaid_diagram.split("```mermaid")
            if len(parts) > 1:
                mermaid_diagram = parts[1].split("```")[0].strip()
        elif "```" in mermaid_diagram:
            # Find content between code block markers
            parts = mermaid_diagram.split("```")
            if len(parts) >= 3:
                # Content is between first and second ```
                mermaid_diagram = parts[1].strip()
            else:
                # Just remove the markers
                mermaid_diagram = mermaid_diagram.replace("```", "").strip()
        
        # Remove any remaining markdown or extra text
        lines = mermaid_diagram.split('\n')
        clean_lines = []
        for line in lines:
            line = line.strip()
            # Keep lines that are valid Mermaid syntax
            if line and (
                line.startswith('graph') or 
                '-->' in line or 
                '---' in line or
                (len(line) > 0 and line[0].isalnum())
            ):
                clean_lines.append(line)
        
        mermaid_diagram = '\n'.join(clean_lines)
        
        # Ensure it starts with graph TD
        if not mermaid_diagram.startswith("graph"):
            mermaid_diagram = "graph TD\n" + mermaid_diagram
        
        print(f"Generated Mermaid diagram:\n{mermaid_diagram}\n")
        
        return {
            "success": True,
            "mermaid": mermaid_diagram
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error generating Mermaid diagram: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate Mermaid diagram. Please try again.")

@app.post("/api/generate-summary")
async def generate_summary(request: RepoSummaryRequest):
    """
    Legacy endpoint - analyze repository structure from file path
    """
    try:
        # Initialize Groq client
        groq_api_key = os.environ.get("GROQ_API_KEY")
        if not groq_api_key:
            raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")
            
        groq_client = Groq(api_key=groq_api_key)
        
        # Analyze repository structure
        repo_info = analyze_repository_structure(request.repo_path)
        
        # Create prompt for Groq
        prompt = f"""Analyze this repository and provide a concise 2-3 sentence summary describing its purpose, main technologies, and architecture:

Repository Structure:
- Primary Languages: {', '.join(repo_info.get('languages', []))}
- Main Directories: {', '.join(repo_info.get('directories', []))}
- Key Files: {', '.join(repo_info.get('key_files', []))}
- Technologies Detected: {', '.join(repo_info.get('technologies', []))}

Provide a professional, technical summary suitable for a repository overview."""

        # Call Groq API
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a technical documentation expert specializing in software architecture analysis."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.5,
            max_tokens=200
        )
        
        summary = chat_completion.choices[0].message.content
        
        return {
            "success": True,
            "summary": summary,
            "repo_info": repo_info
        }
        
    except Exception as e:
        print(f"Error in generate_summary: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate repository summary. Please try again.")
    
@app.post("/api/generate-directory-descriptions")
async def generate_directory_descriptions(request: DirectoryDescriptionsRequest):
    """
    Generate AI-powered descriptions for each directory using Groq API
    """
    try:
        # Initialize Groq client
        groq_api_key = os.environ.get("GROQ_API_KEY")
        if not groq_api_key:
            raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")
        
        groq_client = Groq(api_key=groq_api_key)
        
        # Prepare folder structure context
        folder_structure_str = ""
        if request.folder_structure:
            if isinstance(request.folder_structure, str):
                folder_structure_str = request.folder_structure[:1500]
            else:
                folder_structure_str = json.dumps(request.folder_structure, indent=2)[:1500]
        
        # Create prompt for Groq
        directories_list = "\n".join([f"- {dir}" for dir in request.directories])
        
        prompt = f"""Generate concise, technical descriptions for each directory in this repository.

### REPOSITORY CONTEXT
Repository: {request.repository_name}
Folder Structure Overview:
{folder_structure_str}

### DIRECTORIES TO DESCRIBE
{directories_list}

### YOUR TASK
For EACH directory listed above, provide a 1-2 sentence technical description that:
1. Explains the directory's primary purpose
2. Mentions the type of code/files it likely contains
3. Describes its role in the overall architecture

### GUIDELINES
✓ Be specific and technical (mention frameworks, patterns, file types)
✓ Base descriptions on common software development conventions
✓ Use phrases like "contains", "implements", "provides", "manages"
✓ Keep each description under 100 words
✗ Do NOT use generic phrases like "well-organized" or "modular"
✗ Do NOT add markdown formatting
✗ Do NOT include commentary outside the JSON structure

### OUTPUT FORMAT
{{
  "descriptions": [
    {{
      "directory": "api/",
      "description": "Backend API implementation containing FastAPI route handlers, request/response models, and business logic controllers."
    }},
    {{
      "directory": "web/",
      "description": "Frontend Next.js application with React components, pages, and client-side routing logic."
    }}
  ]
}}

Output ONLY valid JSON with no markdown code blocks or additional text."""

        # Call Groq API
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert software architect who analyzes repository structures. Provide precise, technical descriptions for directories. Output ONLY valid JSON with no markdown or explanations."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            max_tokens=800
        )
        
        response_content = chat_completion.choices[0].message.content.strip()
        
        # Clean up response - remove markdown code blocks if present
        if "```json" in response_content:
            response_content = response_content.split("```json")[1].split("```")[0].strip()
        elif "```" in response_content:
            response_content = response_content.replace("```", "").strip()
        
        # Parse JSON response
        try:
            parsed_response = json.loads(response_content)
            descriptions = parsed_response.get("descriptions", [])
        except json.JSONDecodeError as je:
            print(f"JSON parse error: {je}")
            print(f"Response content: {response_content}")
            # Fallback: return empty descriptions
            descriptions = []
        
        return {
            "success": True,
            "descriptions": descriptions
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error generating directory descriptions: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate directory descriptions. Please try again.")
    
@app.post("/api/generate-recommendations")
async def generate_recommendations(request: RecommendationsRequest):
    """
    Generate AI-powered repository recommendations using Claude API
    This analyzes the repository structure and provides actionable improvements
    """
    try:
        # Try Claude API first (if ANTHROPIC_API_KEY is available)
        anthropic_api_key = os.environ.get("ANTHROPIC_API_KEY")
        
        if anthropic_api_key:
            return await generate_recommendations_with_claude(request, anthropic_api_key)
        else:
            # Fallback to Groq if Claude API is not available
            return await generate_recommendations_with_groq(request)
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error generating recommendations: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate recommendations. Please try again.")


async def generate_recommendations_with_claude(request: RecommendationsRequest, api_key: str):
    """Generate recommendations using Claude API (Anthropic)"""
    try:
        client = anthropic.Anthropic(api_key=api_key)
        
        # Prepare context
        folder_structure_str = ""
        if request.folder_structure:
            if isinstance(request.folder_structure, str):
                folder_structure_str = request.folder_structure[:3000]
            else:
                folder_structure_str = json.dumps(request.folder_structure, indent=2)[:3000]
        
        dependencies_str = ""
        if request.dependencies:
            dependencies_str = json.dumps(request.dependencies, indent=2)[:1000]
        
        prompt = f"""You are an expert software architect and code reviewer. Analyze this repository and provide 5-8 actionable recommendations to improve it.

### REPOSITORY CONTEXT
Repository: {request.repository_name}
Primary Languages: {', '.join(request.primary_languages) if request.primary_languages else 'Unknown'}
Total Files: {request.total_files or 'Unknown'}
Architecture Type: {request.architecture_type or 'Unknown'}

Folder Structure:
{folder_structure_str}

Dependencies:
{dependencies_str}

---

### YOUR TASK
Analyze the repository structure, dependencies, and architecture. Provide 5-8 specific, actionable recommendations across these categories:
- **Security**: Authentication, authorization, secrets management, dependency vulnerabilities
- **Performance**: Caching, database optimization, API efficiency, bundle size
- **Architecture**: Code organization, separation of concerns, scalability patterns
- **Best Practices**: Testing, CI/CD, documentation, code quality
- **Documentation**: README quality, API docs, setup instructions, architecture diagrams

### ANALYSIS GUIDELINES
1. **Look for missing critical files**:
   - No tests/ or __tests__/ folder → recommend adding tests
   - No .github/workflows/ → recommend CI/CD
   - No Dockerfile → recommend containerization
   - No .env.example → recommend environment template
   - No LICENSE → recommend adding license
   - Missing documentation folders

2. **Identify security concerns**:
   - Dependencies without version pinning
   - Missing security headers configuration
   - No rate limiting setup
   - Environment variables in code
   - Missing authentication/authorization patterns

3. **Spot architecture improvements**:
   - Monolithic structure that could benefit from modularization
   - Missing service layers or proper separation
   - No error handling patterns
   - Missing logging/monitoring setup
   - API versioning concerns

4. **Performance optimizations**:
   - No caching strategy evident
   - Missing database indexing (if DB is used)
   - No CDN setup for static assets
   - Bundle optimization opportunities

5. **Developer experience**:
   - Missing pre-commit hooks
   - No linting/formatting setup
   - Incomplete README or setup docs
   - No contribution guidelines

### REQUIREMENTS
✓ Each recommendation MUST be specific to what you observe in the structure
✓ Prioritize based on impact: high (critical/security), medium (important), low (nice-to-have)
✓ Provide clear, actionable steps
✓ Explain the impact/benefit of each recommendation
✗ Do NOT suggest generic improvements without evidence
✗ Do NOT recommend tools unless absence is clear from structure
✗ Do NOT use markdown formatting in the JSON

### OUTPUT FORMAT
{{
  "recommendations": [
    {{
      "title": "Implement Automated Testing Framework",
      "description": "No test directory found. Add Jest/Pytest testing framework with unit and integration tests for critical paths. Start with API endpoint tests and component rendering tests.",
      "priority": "high",
      "impact": "Prevents regressions, improves code quality, and enables confident refactoring. Reduces production bugs by 60-80%.",
      "category": "best-practices"
    }},
    {{
      "title": "Add CI/CD Pipeline with GitHub Actions",
      "description": "No .github/workflows/ directory detected. Implement automated testing, linting, and deployment pipeline. Include build verification, security scanning, and automated deployments.",
      "priority": "medium",
      "impact": "Automates quality checks, reduces manual deployment errors, and speeds up delivery cycle by 3-5x.",
      "category": "best-practices"
    }}
  ]
}}

Output ONLY valid JSON. No markdown, no code blocks, no explanations outside JSON."""

        # Call Claude API
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            temperature=0.4,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        
        response_content = message.content[0].text.strip()
        
        # Clean up response
        if "```json" in response_content:
            response_content = response_content.split("```json")[1].split("```")[0].strip()
        elif "```" in response_content:
            response_content = response_content.replace("```", "").strip()
        
        # Parse JSON response
        try:
            parsed_response = json.loads(response_content)
            recommendations = parsed_response.get("recommendations", [])
        except json.JSONDecodeError as je:
            print(f"JSON parse error: {je}")
            print(f"Response content: {response_content}")
            recommendations = []
        
        return {
            "success": True,
            "recommendations": recommendations,
            "source": "claude"
        }
        
    except Exception as e:
        print(f"Error with Claude API: {e}")
        raise


async def generate_recommendations_with_groq(request: RecommendationsRequest):
    """Fallback: Generate recommendations using Groq API"""
    try:
        groq_api_key = os.environ.get("GROQ_API_KEY")
        if not groq_api_key:
            raise HTTPException(status_code=500, detail="Neither ANTHROPIC_API_KEY nor GROQ_API_KEY configured")
        
        groq_client = Groq(api_key=groq_api_key)
        
        # Prepare context (same as Claude version)
        folder_structure_str = ""
        if request.folder_structure:
            if isinstance(request.folder_structure, str):
                folder_structure_str = request.folder_structure[:2500]
            else:
                folder_structure_str = json.dumps(request.folder_structure, indent=2)[:2500]
        
        dependencies_str = ""
        if request.dependencies:
            dependencies_str = json.dumps(request.dependencies, indent=2)[:800]
        
        prompt = f"""Analyze this repository and provide 5-7 specific, actionable recommendations.

### REPOSITORY
Name: {request.repository_name}
Languages: {', '.join(request.primary_languages) if request.primary_languages else 'Unknown'}
Files: {request.total_files or 'Unknown'}
Type: {request.architecture_type or 'Unknown'}

Structure:
{folder_structure_str}

Dependencies:
{dependencies_str}

### ANALYZE FOR
1. Missing test directories → Recommend testing setup
2. No CI/CD config (.github/workflows/) → Recommend automation
3. Security issues → Auth, secrets, dependencies
4. Architecture → Modularity, separation, patterns
5. Documentation → README, API docs, setup guides
6. Performance → Caching, optimization opportunities

### REQUIREMENTS
- Be SPECIFIC to this repository structure
- Prioritize: high (critical), medium (important), low (enhancement)
- Explain clear impact and actionable steps
- Output ONLY valid JSON, no markdown

### FORMAT
{{
  "recommendations": [
    {{
      "title": "Add Automated Testing",
      "description": "No tests found. Implement Jest/Pytest for unit and integration testing.",
      "priority": "high",
      "impact": "Reduces bugs by 70%, enables confident refactoring.",
      "category": "best-practices"
    }}
  ]
}}"""

        # Call Groq API
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a senior software architect. Analyze repositories and provide specific, actionable recommendations. Output ONLY valid JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.4,
            max_tokens=1500
        )
        
        response_content = chat_completion.choices[0].message.content.strip()
        
        # Clean up response
        if "```json" in response_content:
            response_content = response_content.split("```json")[1].split("```")[0].strip()
        elif "```" in response_content:
            response_content = response_content.replace("```", "").strip()
        
        # Parse JSON
        try:
            parsed_response = json.loads(response_content)
            recommendations = parsed_response.get("recommendations", [])
        except json.JSONDecodeError:
            recommendations = []
        
        return {
            "success": True,
            "recommendations": recommendations,
            "source": "groq"
        }
        
    except Exception as e:
        print(f"Error with Groq API: {e}")
        raise

# Add this helper function to parse GitHub URLs
def parse_github_url(url: str) -> tuple:
    """Extract owner and repo name from GitHub URL"""
    # Handle different GitHub URL formats
    url = url.rstrip('/')
    if 'github.com' in url:
        parts = url.split('github.com/')[-1].split('/')
        if len(parts) >= 2:
            owner = parts[0]
            repo = parts[1].replace('.git', '')
            return owner, repo
    raise ValueError("Invalid GitHub URL format")

# Advanced GitHub Repository Analysis
async def analyze_github_repository(owner: str, repo: str, github_token: Optional[str] = None):
    """
    Analyze GitHub repository using GitHub API (CodeRabbit-style analysis)
    This mimics CodeRabbit's analysis approach without requiring the actual tool
    """
    headers = {
        'Accept': 'application/vnd.github.v3+json',
    }
    
    if github_token:
        headers['Authorization'] = f'token {github_token}'
    
    base_url = f'https://api.github.com/repos/{owner}/{repo}'
    
    analysis = {
        'security_issues': [],
        'code_quality_issues': [],
        'best_practices': [],
        'performance_issues': [],
        'documentation_gaps': []
    }
    
    try:
        # 1. Get repository info
        repo_response = requests.get(base_url, headers=headers)
        if repo_response.status_code != 200:
            raise Exception(f"Failed to fetch repository: {repo_response.status_code}")
        
        repo_data = repo_response.json()
        
        # 2. Check for LICENSE
        license_response = requests.get(f'{base_url}/license', headers=headers)
        if license_response.status_code == 404:
            analysis['best_practices'].append({
                'title': 'Add Open Source License',
                'description': 'No license file detected. Add a LICENSE file to clarify how others can use, modify, and distribute your code. Recommended: MIT, Apache 2.0, or GPL depending on your needs.',
                'priority': 'medium',
                'category': 'best-practices'
            })
        
        # 3. Check for README quality
        readme_response = requests.get(f'{base_url}/readme', headers=headers)
        if readme_response.status_code == 404:
            analysis['documentation_gaps'].append({
                'title': 'Create Comprehensive README',
                'description': 'No README.md found. Create one with: project description, installation instructions, usage examples, contributing guidelines, and license information.',
                'priority': 'high',
                'category': 'documentation'
            })
        elif readme_response.status_code == 200:
            readme_data = readme_response.json()
            readme_content = base64.b64decode(readme_data['content']).decode('utf-8')
            
            # Check README completeness
            required_sections = ['installation', 'usage', 'contributing', 'license']
            missing_sections = [s for s in required_sections if s not in readme_content.lower()]
            
            if missing_sections:
                analysis['documentation_gaps'].append({
                    'title': 'Enhance README Documentation',
                    'description': f'README is missing important sections: {", ".join(missing_sections)}. Add these sections to help contributors and users understand your project better.',
                    'priority': 'medium',
                    'category': 'documentation'
                })
            
            if len(readme_content) < 500:
                analysis['documentation_gaps'].append({
                    'title': 'Expand README Content',
                    'description': 'README is quite brief. Add detailed setup instructions, usage examples, API documentation, and troubleshooting guides to improve developer experience.',
                    'priority': 'low',
                    'category': 'documentation'
                })
        
        # 4. Check for CI/CD
        workflows_response = requests.get(f'{base_url}/contents/.github/workflows', headers=headers)
        if workflows_response.status_code == 404:
            analysis['best_practices'].append({
                'title': 'Implement CI/CD Pipeline',
                'description': 'No GitHub Actions workflows detected. Set up automated testing, linting, and deployment pipelines to catch issues early and streamline releases. Recommended: test.yml for automated testing and deploy.yml for deployments.',
                'priority': 'high',
                'category': 'best-practices'
            })
        
        # 5. Check for security policy
        security_response = requests.get(f'{base_url}/contents/SECURITY.md', headers=headers)
        if security_response.status_code == 404:
            analysis['security_issues'].append({
                'title': 'Add Security Policy',
                'description': 'No SECURITY.md file found. Create a security policy explaining how to report vulnerabilities, your response process, and supported versions. This builds trust with security researchers.',
                'priority': 'medium',
                'category': 'security'
            })
        
        # 6. Check for .gitignore
        gitignore_response = requests.get(f'{base_url}/contents/.gitignore', headers=headers)
        if gitignore_response.status_code == 404:
            analysis['security_issues'].append({
                'title': 'Add .gitignore File',
                'description': 'No .gitignore detected. Create one to prevent committing sensitive files like .env, node_modules/, __pycache__/, and IDE configurations. This prevents accidental exposure of secrets.',
                'priority': 'high',
                'category': 'security'
            })
        elif gitignore_response.status_code == 200:
            gitignore_data = gitignore_response.json()
            gitignore_content = base64.b64decode(gitignore_data['content']).decode('utf-8')
            
            # Check for common security patterns
            if '.env' not in gitignore_content:
                analysis['security_issues'].append({
                    'title': 'Protect Environment Variables',
                    'description': '.env files are not ignored in .gitignore. Add .env, .env.local, and .env.*.local to prevent accidentally committing API keys and secrets.',
                    'priority': 'high',
                    'category': 'security'
                })
        
        # 7. Check for testing setup
        contents_response = requests.get(f'{base_url}/contents', headers=headers)
        if contents_response.status_code == 200:
            contents = contents_response.json()
            file_names = [item['name'] for item in contents if item['type'] == 'file']
            dir_names = [item['name'] for item in contents if item['type'] == 'dir']
            
            # Check for test directories
            test_dirs = ['test', 'tests', '__tests__', 'spec']
            has_tests = any(td in dir_names for td in test_dirs)
            
            if not has_tests:
                analysis['best_practices'].append({
                    'title': 'Implement Automated Testing',
                    'description': 'No test directory found (test/, tests/, __tests__/). Add a comprehensive test suite with unit tests, integration tests, and end-to-end tests. Aim for 80%+ code coverage.',
                    'priority': 'high',
                    'category': 'best-practices'
                })
            
            # Check for Docker
            has_docker = 'Dockerfile' in file_names or 'docker-compose.yml' in file_names
            if not has_docker:
                analysis['best_practices'].append({
                    'title': 'Add Docker Configuration',
                    'description': 'No Dockerfile detected. Containerize your application with Docker for consistent development and production environments. This simplifies deployment and eliminates "works on my machine" issues.',
                    'priority': 'medium',
                    'category': 'best-practices'
                })
            
            # Check for environment template
            has_env_example = any('.env.example' in f or '.env.template' in f for f in file_names)
            if not has_env_example:
                analysis['security_issues'].append({
                    'title': 'Create Environment Variables Template',
                    'description': 'No .env.example file found. Create one documenting all required environment variables without actual values. This helps new developers set up the project quickly and securely.',
                    'priority': 'medium',
                    'category': 'security'
                })
            
            # Check for code quality tools
            has_eslint = '.eslintrc' in file_names or '.eslintrc.json' in file_names or '.eslintrc.js' in file_names
            has_prettier = '.prettierrc' in file_names or '.prettierrc.json' in file_names or 'prettier.config.js' in file_names
            
            if not has_eslint and not has_prettier:
                analysis['code_quality_issues'].append({
                    'title': 'Set Up Code Quality Tools',
                    'description': 'No ESLint or Prettier configuration detected. Add linting and formatting tools to maintain consistent code style and catch potential bugs early. Recommended: ESLint + Prettier + Husky pre-commit hooks.',
                    'priority': 'medium',
                    'category': 'best-practices'
                })
        
        # 8. Check for Code of Conduct
        coc_response = requests.get(f'{base_url}/contents/CODE_OF_CONDUCT.md', headers=headers)
        if coc_response.status_code == 404:
            analysis['documentation_gaps'].append({
                'title': 'Add Code of Conduct',
                'description': 'No CODE_OF_CONDUCT.md found. Add one to set clear expectations for community behavior and create a welcoming environment. Consider adopting the Contributor Covenant.',
                'priority': 'low',
                'category': 'documentation'
            })
        
        # 9. Check for Contributing Guide
        contributing_response = requests.get(f'{base_url}/contents/CONTRIBUTING.md', headers=headers)
        if contributing_response.status_code == 404:
            analysis['documentation_gaps'].append({
                'title': 'Create Contributing Guidelines',
                'description': 'No CONTRIBUTING.md found. Document how others can contribute: setup instructions, coding standards, PR process, and testing requirements. This lowers the barrier for new contributors.',
                'priority': 'low',
                'category': 'documentation'
            })
        
        # 10. Check repository metadata
        if not repo_data.get('description'):
            analysis['documentation_gaps'].append({
                'title': 'Add Repository Description',
                'description': 'Repository has no description. Add a concise description in GitHub settings to help others understand your project at a glance.',
                'priority': 'low',
                'category': 'documentation'
            })
        
        if not repo_data.get('topics') or len(repo_data.get('topics', [])) == 0:
            analysis['documentation_gaps'].append({
                'title': 'Add Repository Topics',
                'description': 'No topics/tags set for this repository. Add relevant topics (e.g., python, fastapi, react, nextjs) to improve discoverability on GitHub.',
                'priority': 'low',
                'category': 'documentation'
            })
        
        # Check for open issues and pull requests
        issues_response = requests.get(f'{base_url}/issues?state=open', headers=headers)
        if issues_response.status_code == 200:
            open_issues = issues_response.json()
            if len(open_issues) > 20:
                analysis['best_practices'].append({
                    'title': 'Address Backlog of Issues',
                    'description': f'There are {len(open_issues)} open issues. Consider triaging and addressing high-priority issues, or closing stale ones. A large backlog can discourage contributors.',
                    'priority': 'low',
                    'category': 'best-practices'
                })
        
        return analysis
        
    except Exception as e:
        print(f"Error analyzing GitHub repository: {e}")
        return analysis


@app.post("/api/generate-recommendations")
async def generate_recommendations(request: RecommendationsRequest):
    """
    Generate AI-powered repository recommendations
    Uses GitHub API analysis (CodeRabbit-style) + Groq AI enhancement
    """
    try:
        # Extract GitHub info from repository name/URL if available
        github_analysis = {}
        if request.repository_name and ('github.com' in request.repository_name or '/' in request.repository_name):
            try:
                owner, repo = parse_github_url(request.repository_name)
                github_analysis = await analyze_github_repository(owner, repo)
            except Exception as e:
                print(f"GitHub analysis failed: {e}")
        
        # Use Groq to enhance and contextualize the recommendations
        groq_api_key = os.environ.get("GROQ_API_KEY")
        if not groq_api_key:
            raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")
        
        groq_client = Groq(api_key=groq_api_key)
        
        # Prepare context
        folder_structure_str = ""
        if request.folder_structure:
            if isinstance(request.folder_structure, str):
                folder_structure_str = request.folder_structure[:2500]
            else:
                folder_structure_str = json.dumps(request.folder_structure, indent=2)[:2500]
        
        dependencies_str = ""
        if request.dependencies:
            dependencies_str = json.dumps(request.dependencies, indent=2)[:800]
        
        # Compile GitHub analysis findings
        github_findings = []
        for category, issues in github_analysis.items():
            github_findings.extend(issues)
        
        github_context = json.dumps(github_findings, indent=2)[:1500] if github_findings else "No GitHub-specific analysis available"
        
        prompt = f"""Analyze this repository and provide 6-8 specific, actionable recommendations.

### REPOSITORY
Name: {request.repository_name}
Languages: {', '.join(request.primary_languages) if request.primary_languages else 'Unknown'}
Files: {request.total_files or 'Unknown'}
Architecture: {request.architecture_type or 'Unknown'}

Structure:
{folder_structure_str}

Dependencies:
{dependencies_str}

GitHub Analysis Findings:
{github_context}

### YOUR TASK
1. Review the GitHub analysis findings above
2. Analyze the folder structure and dependencies
3. Provide 6-8 recommendations across categories: security, performance, architecture, best-practices, documentation

### GUIDELINES
- If GitHub findings exist, incorporate and enhance them
- Add structural recommendations based on folder analysis
- Be specific and actionable
- Prioritize: high (critical), medium (important), low (enhancement)
- Explain clear impact

### OUTPUT FORMAT (JSON only, no markdown)
{{
  "recommendations": [
    {{
      "title": "Implement Automated Testing",
      "description": "No test directory found. Add Jest/Pytest with unit and integration tests.",
      "priority": "high",
      "impact": "Reduces bugs by 70%, enables confident refactoring.",
      "category": "best-practices"
    }}
  ]
}}"""

        # Call Groq API
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a senior software architect analyzing repositories. Provide specific, actionable recommendations. Output ONLY valid JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.4,
            max_tokens=1500
        )
        
        response_content = chat_completion.choices[0].message.content.strip()
        
        # Clean up response
        if "```json" in response_content:
            response_content = response_content.split("```json")[1].split("```")[0].strip()
        elif "```" in response_content:
            response_content = response_content.replace("```", "").strip()
        
        # Parse JSON
        try:
            parsed_response = json.loads(response_content)
            recommendations = parsed_response.get("recommendations", [])
        except json.JSONDecodeError:
            # Fallback: use GitHub findings directly if JSON parsing fails
            recommendations = github_findings[:8]
        
        return {
            "success": True,
            "recommendations": recommendations,
            "source": "github-api + groq"
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error generating recommendations: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate recommendations. Please try again.")