from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import Optional, Any, Dict

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
    allow_origins=["*"],  # tighten later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request / Response Models

class AnalyzeRequest(BaseModel):
    repository_url: HttpUrl


class AnalyzeResponse(BaseModel):

    overview: Optional[Dict[str, Any]] = None
    architecture: Optional[Dict[str, Any]] = None
    visualization: Optional[Dict[str, Any]] = None
    modules: Optional[Any] = None
    dependencies: Optional[Dict[str, Any]] = None
    recommendations: Optional[Any] = None


# Routes
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
        raise HTTPException(
            status_code=500,
            detail="Failed to analyze repository. Please try again later.",
        )
    
    '''

debuggimg purposes 

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )
    
'''
