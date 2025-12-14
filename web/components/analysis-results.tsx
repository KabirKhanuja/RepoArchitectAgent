"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { FileCode, GitBranch, Package, Lightbulb, AlertTriangle, CheckCircle2, Info, Loader2, RefreshCw } from "lucide-react"
import type { AnalysisResponse } from "@/lib/types"
import MermaidViewer from "./MermaidViewer"

import { getApiUrl } from "@/lib/api"

interface AnalysisResultsProps {
  data: AnalysisResponse
}

interface DirectoryDescription {
  directory: string
  description: string
}

interface Recommendation {
  title: string
  description: string
  priority: string
  impact?: string
  category?: string
}

// Get API URL from environment or default to localhost
// const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

export function AnalysisResults({ data }: AnalysisResultsProps) {
  // State for AI-generated description
  const [aiDescription, setAiDescription] = useState<string>(data.overview?.description || "")
  const [aiKeyFeatures, setAiKeyFeatures] = useState<string[]>(data.overview?.key_features || [])
  const [descriptionLoading, setDescriptionLoading] = useState<boolean>(false)
  const [descriptionError, setDescriptionError] = useState<string | null>(null)

  // State for Mermaid diagram
  const [mermaidDiagram, setMermaidDiagram] = useState<string>(data.visualization?.mermaid || "")
  const [mermaidLoading, setMermaidLoading] = useState<boolean>(false)
  const [mermaidError, setMermaidError] = useState<string | null>(null)

  // State for AI-generated recommendations
  const [recommendations, setRecommendations] = useState<Recommendation[]>((data.recommendations as Recommendation[]) || [])
  const [recommendationsLoading, setRecommendationsLoading] = useState<boolean>(false)
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null)

  // Fetch AI description on component mount if needed
  useEffect(() => {
    if (!data.overview?.description || data.overview.description.includes("unknown architecture")) {
      fetchAIDescription()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch Mermaid diagram on component mount if needed
  useEffect(() => {
    if (!data.visualization?.mermaid) {
      fetchMermaidDiagram()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch recommendations on component mount if needed
  useEffect(() => {
    if (!data.recommendations || data.recommendations.length === 0) {
      fetchRecommendations()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchAIDescription = async () => {
    try {
      setDescriptionLoading(true)
      setDescriptionError(null)

      const response = await fetch(`getApiUrl(/api/generate-description)`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repository_name: data.overview?.repository_name || "Unknown",
          primary_languages: data.overview?.primary_languages || [],
          total_files: data.overview?.total_files || 0,
          folder_structure: data.architecture?.folder_structure || null,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to generate description: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.description) {
        setAiDescription(result.description)
      }
      
      if (result.key_features && Array.isArray(result.key_features)) {
        setAiKeyFeatures(result.key_features)
      }
    } catch (err) {
      console.error("Description generation error:", err)
      setDescriptionError(err instanceof Error ? err.message : "Unknown error")
      setAiDescription(data.overview?.description || "Unable to generate description")
    } finally {
      setDescriptionLoading(false)
    }
  }

  const fetchMermaidDiagram = async () => {
    try {
      setMermaidLoading(true)
      setMermaidError(null)

      const response = await fetch(`getApiUrl(/api/generate-mermaid)`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          folder_structure: data.architecture?.folder_structure || {},
          repository_name: data.overview?.repository_name || "Repository",
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to generate Mermaid diagram: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.mermaid && result.mermaid.includes("graph")) {
        setMermaidDiagram(result.mermaid)
      } else {
        throw new Error("Invalid Mermaid diagram received")
      }
    } catch (err) {
      console.error("Mermaid generation error:", err)
      setMermaidError(err instanceof Error ? err.message : "Unknown error")
      
      setMermaidDiagram(`graph TD
    A["${data.overview?.repository_name || "Repository"}"]
    A --> B["api/"]
    A --> C["web/"]
    B --> D("index.py")
    C --> E["components/"]
    C --> F["pages/"]`)
    } finally {
      setMermaidLoading(false)
    }
  }

  const fetchRecommendations = async () => {
    try {
      setRecommendationsLoading(true)
      setRecommendationsError(null)

      const response = await fetch(`getApiUrl(/api/generate-recommendations)`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repository_name: data.overview?.repository_name || "Unknown",
          primary_languages: data.overview?.primary_languages || [],
          total_files: data.overview?.total_files || 0,
          folder_structure: data.architecture?.folder_structure || null,
          dependencies: data.dependencies || null,
          architecture_type: data.architecture?.structure_type || null,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to generate recommendations: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.recommendations && Array.isArray(result.recommendations)) {
        setRecommendations(result.recommendations)
      }
    } catch (err) {
      console.error("Recommendations generation error:", err)
      setRecommendationsError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setRecommendationsLoading(false)
    }
  }

  // Function to generate directory descriptions using Groq API
  const generateDirectoryDescriptions = async (directories: string[]): Promise<DirectoryDescription[]> => {
    try {
      const response = await fetch(`getApiUrl(/api/generate-directory-descriptions)`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          directories: directories,
          repository_name: data.overview?.repository_name || "Repository",
          folder_structure: data.architecture?.folder_structure || null,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to generate directory descriptions: ${response.statusText}`)
      }

      const result = await response.json()
      return result.descriptions || []
    } catch (err) {
      console.error("Directory description generation error:", err)
      return []
    }
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Files"
          value={data.overview?.total_files?.toString() || "N/A"}
          icon={<FileCode className="h-5 w-5" />}
        />
        <MetricCard
          title="Languages"
          value={data.overview?.primary_languages?.length.toString() || "N/A"}
          icon={<GitBranch className="h-5 w-5" />}
        />
        <MetricCard
          title="Dependencies"
          value={(data.dependencies?.external_dependencies?.length || 0).toString()}
          icon={<Package className="h-5 w-5" />}
        />
        <MetricCard
          title="Recommendations"
          value={recommendations.length.toString()}
          icon={<Lightbulb className="h-5 w-5" />}
        />
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="visualization">Visualization</TabsTrigger>
          <TabsTrigger value="architecture">Architecture</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Repository Overview</CardTitle>
              <CardDescription>High-level analysis of the repository structure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {data.overview?.repository_name && (
                <div>
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">Repository Name</h3>
                  <p className="font-mono text-lg">{data.overview.repository_name}</p>
                </div>
              )}

              {data.overview?.primary_languages && data.overview.primary_languages.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-medium text-muted-foreground">Primary Languages</h3>
                  <div className="flex flex-wrap gap-2">
                    {data.overview.primary_languages.map((lang, idx) => (
                      <Badge key={idx} variant="secondary" className="px-3 py-1">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* AI-Generated Description Section */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchAIDescription}
                    disabled={descriptionLoading}
                    className="h-7 gap-2 px-2"
                  >
                    <RefreshCw className={`h-3 w-3 ${descriptionLoading ? "animate-spin" : ""}`} />
                    {descriptionLoading ? "Generating..." : "Regenerate"}
                  </Button>
                </div>
                
                {descriptionLoading ? (
                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-4">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">
                      Generating AI-powered description with Groq...
                    </span>
                  </div>
                ) : descriptionError ? (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                    <p className="text-sm text-destructive">⚠️ {descriptionError}</p>
                  </div>
                ) : null}
                
                <p className="text-sm leading-relaxed mt-2">{aiDescription}</p>
              </div>

              {/* Key Features Section */}
              {aiKeyFeatures.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-medium text-muted-foreground">Key Features</h3>
                  <ul className="space-y-2">
                    {aiKeyFeatures.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visualization" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Visualization</CardTitle>
                  <CardDescription>Mermaid diagram of the repository architecture</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchMermaidDiagram}
                  disabled={mermaidLoading}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${mermaidLoading ? "animate-spin" : ""}`} />
                  {mermaidLoading ? "Generating..." : "Regenerate"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {mermaidLoading ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-lg bg-muted/50 p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Generating comprehensive Mermaid diagram with AI...
                  </span>
                </div>
              ) : mermaidError ? (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
                  <p className="text-sm text-destructive mb-4">⚠️ {mermaidError}</p>
                  <Button onClick={fetchMermaidDiagram} size="sm">
                    Retry
                  </Button>
                </div>
              ) : mermaidDiagram ? (
                <div className="rounded-lg border border-border/50 bg-card/50 p-4">
                  <MermaidViewer 
                    diagram={mermaidDiagram} 
                    repositoryName={data.overview?.repository_name}
                    onGenerateDescriptions={generateDirectoryDescriptions}
                  />
                </div>
              ) : (
                <div className="rounded-lg bg-muted/50 p-8 text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    No visualization available. Click to generate one.
                  </p>
                  <Button onClick={fetchMermaidDiagram} size="sm">
                    Generate Diagram
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="architecture" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Architecture Analysis</CardTitle>
              <CardDescription>Structure and organization of the codebase</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {data.architecture?.structure_type && (
                <div>
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">Structure Type</h3>
                  <Badge variant="outline" className="text-base">
                    {data.architecture.structure_type}
                  </Badge>
                </div>
              )}

              {data.architecture?.folder_structure && (
                <div>
                  <h3 className="mb-3 text-sm font-medium text-muted-foreground">Folder Structure</h3>
                  <div className="rounded-lg bg-muted/50 p-4 font-mono text-sm">
                    <pre className="overflow-x-auto whitespace-pre-wrap">
                      {typeof data.architecture.folder_structure === "string"
                        ? data.architecture.folder_structure
                        : JSON.stringify(data.architecture.folder_structure, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {data.architecture?.patterns && data.architecture.patterns.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-medium text-muted-foreground">Design Patterns</h3>
                  <div className="flex flex-wrap gap-2">
                    {data.architecture.patterns.map((pattern, idx) => (
                      <Badge key={idx} variant="secondary">
                        {pattern}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Modules & Responsibilities</CardTitle>
              <CardDescription>Breakdown of modules and their purposes</CardDescription>
            </CardHeader>
            <CardContent>
              {data.modules && data.modules.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {data.modules.map((module, idx) => (
                    <AccordionItem key={idx} value={`module-${idx}`}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center gap-2">
                          <FileCode className="h-4 w-4 text-primary" />
                          <span className="font-mono">{module.name}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3 pt-2">
                        {module.purpose && (
                          <div>
                            <h4 className="mb-1 text-sm font-medium text-muted-foreground">Purpose</h4>
                            <p className="text-sm leading-relaxed">{module.purpose}</p>
                          </div>
                        )}
                        {module.key_files && module.key_files.length > 0 && (
                          <div>
                            <h4 className="mb-2 text-sm font-medium text-muted-foreground">Key Files</h4>
                            <ul className="space-y-1">
                              {module.key_files.map((file, fileIdx) => (
                                <li key={fileIdx} className="font-mono text-sm text-muted-foreground">
                                  • {file}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {module.dependencies && module.dependencies.length > 0 && (
                          <div>
                            <h4 className="mb-2 text-sm font-medium text-muted-foreground">Dependencies</h4>
                            <div className="flex flex-wrap gap-2">
                              {module.dependencies.map((dep, depIdx) => (
                                <Badge key={depIdx} variant="outline" className="text-xs">
                                  {dep}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-sm text-muted-foreground">No module information available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dependencies" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  External Dependencies
                </CardTitle>
                <CardDescription>Third-party packages and libraries</CardDescription>
              </CardHeader>
              <CardContent>
                {data.dependencies?.external_dependencies && data.dependencies.external_dependencies.length > 0 ? (
                  <div className="space-y-2">
                    {data.dependencies.external_dependencies.map((dep, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg border border-border/50 bg-card/50 p-3"
                      >
                        <span className="font-mono text-sm">{dep.name}</span>
                        {dep.version && (
                          <Badge variant="secondary" className="text-xs">
                            {dep.version}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No external dependencies found</p>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  Internal Dependencies
                </CardTitle>
                <CardDescription>Internal module relationships</CardDescription>
              </CardHeader>
              <CardContent>
                {data.dependencies?.internal_dependencies && data.dependencies.internal_dependencies.length > 0 ? (
                  <div className="space-y-2">
                    {data.dependencies.internal_dependencies.map((dep, idx) => (
                      <div key={idx} className="rounded-lg border border-border/50 bg-card/50 p-3">
                        <p className="font-mono text-sm">{dep}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No internal dependencies tracked</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>AI Recommendations</CardTitle>
                  <CardDescription>Suggested improvements and best practices</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchRecommendations}
                  disabled={recommendationsLoading}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${recommendationsLoading ? "animate-spin" : ""}`} />
                  {recommendationsLoading ? "Analyzing..." : "Regenerate"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recommendationsLoading ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-lg bg-muted/50 p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Analyzing repository with GitHub API + AI...
                  </span>
                </div>
              ) : recommendationsError ? (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
                  <p className="text-sm text-destructive mb-4">⚠️ {recommendationsError}</p>
                  <Button onClick={fetchRecommendations} size="sm">
                    Retry
                  </Button>
                </div>
              ) : recommendations && recommendations.length > 0 ? (
                <div className="space-y-4">
                  {recommendations.map((rec, idx) => (
                    <div key={idx} className="rounded-lg border-l-4 border-primary bg-card/50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {rec.priority === "high" ? (
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                          ) : rec.priority === "medium" ? (
                            <Info className="h-5 w-5 text-primary" />
                          ) : (
                            <Lightbulb className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{rec.title}</h4>
                            {rec.priority && (
                              <Badge
                                variant={rec.priority === "high" ? "destructive" : "secondary"}
                                className="text-xs"
                              >
                                {rec.priority}
                              </Badge>
                            )}
                            {rec.category && (
                              <Badge variant="outline" className="text-xs">
                                {rec.category}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm leading-relaxed text-muted-foreground">{rec.description}</p>
                          {rec.impact && (
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium">Impact:</span> {rec.impact}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg bg-muted/50 p-8 text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    No recommendations available. Click to generate AI-powered insights.
                  </p>
                  <Button onClick={fetchRecommendations} size="sm">
                    Generate Recommendations
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MetricCard({
  title,
  value,
  icon,
}: {
  title: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <Card className="glass-card transition-all hover:shadow-lg hover:shadow-primary/5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-primary">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}