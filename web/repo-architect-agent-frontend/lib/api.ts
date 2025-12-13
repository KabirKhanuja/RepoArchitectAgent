import type { AnalysisResponse } from "./types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""

export async function analyzeRepository(repoUrl: string): Promise<AnalysisResponse> {
  if (!API_BASE_URL) {
    throw new Error("API base URL is not configured. Please set NEXT_PUBLIC_API_BASE_URL environment variable.")
  }

  try {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ repository_url: repoUrl }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || errorData.error || `Analysis failed with status ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("An unexpected error occurred while analyzing the repository")
  }
}
