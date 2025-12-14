from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import Optional, Any, Dict
import os
from groq import Groq
import subprocess
import json
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