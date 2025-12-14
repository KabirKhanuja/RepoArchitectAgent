// web/lib/api.ts
import type { AnalysisResponse } from "./types"

// Use consistent environment variable name and provide fallback
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Helper function to ensure proper URL construction
function getApiUrl(endpoint: string): string {
  const base = API_BASE_URL.replace(/\/$/, '') // Remove trailing slash
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${base}${path}`
}

export async function analyzeRepository(repoUrl: string): Promise<AnalysisResponse> {
  try {
    const url = getApiUrl('/analyze')
    console.log('Analyzing repository:', repoUrl)
    console.log('API URL:', url)
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ repository_url: repoUrl }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || errorData.message || errorData.error || `Analysis failed with status ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Analysis error:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("An unexpected error occurred while analyzing the repository")
  }
}

// Export the helper function so other components can use it
export { getApiUrl, API_BASE_URL }