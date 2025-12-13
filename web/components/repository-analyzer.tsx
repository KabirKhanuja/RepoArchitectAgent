"use client"

import type React from "react"

import { useState } from "react"
import { Search, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AnalysisResults } from "@/components/analysis-results"
import { LoadingState } from "@/components/loading-state"
import { analyzeRepository } from "@/lib/api"
import type { AnalysisResponse } from "@/lib/types"

export function RepositoryAnalyzer() {
  const [repoUrl, setRepoUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<AnalysisResponse | null>(null)

  const handleAnalyze = async () => {
    if (!repoUrl.trim()) {
      setError("Please enter a valid GitHub repository URL")
      return
    }

    // Basic URL validation
    const urlPattern = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/
    if (!urlPattern.test(repoUrl.trim())) {
      setError("Please enter a valid GitHub repository URL (e.g., https://github.com/username/repo)")
      return
    }

    setError(null)
    setLoading(true)
    setResults(null)

    try {
      const data = await analyzeRepository(repoUrl.trim())
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze repository. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleAnalyze()
    }
  }

  return (
    <div className="space-y-8">
      {/* Input Section */}
      <div className="glass-card rounded-2xl p-8 shadow-lg transition-all hover:shadow-primary/5">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Input
                type="url"
                placeholder="https://github.com/username/repository"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className="h-12 pr-10 text-base"
              />
              <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            </div>
            <Button onClick={handleAnalyze} disabled={loading} size="lg" className="group h-12 px-8">
              {loading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Analyzing...
                </>
              ) : (
                "Analyze Repository"
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <p className="text-sm text-muted-foreground">
            Enter a public GitHub repository URL to get started. The AI will analyze the structure, dependencies, and
            architecture to provide comprehensive insights.
          </p>
        </div>
      </div>

      {/* Loading State */}
      {loading && <LoadingState />}

      {/* Results */}
      {results && !loading && <AnalysisResults data={results} />}
    </div>
  )
}
