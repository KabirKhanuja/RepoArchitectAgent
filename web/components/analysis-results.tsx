"use client"

import type React from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { FileCode, GitBranch, Package, Lightbulb, AlertTriangle, CheckCircle2, Info } from "lucide-react"
import type { AnalysisResponse } from "@/lib/types"

interface AnalysisResultsProps {
  data: AnalysisResponse
}

export function AnalysisResults({ data }: AnalysisResultsProps) {
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
          value={data.recommendations?.length.toString() || "0"}
          icon={<Lightbulb className="h-5 w-5" />}
        />
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
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

              {data.overview?.description && (
                <div>
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">Description</h3>
                  <p className="text-sm leading-relaxed">{data.overview.description}</p>
                </div>
              )}

              {data.overview?.key_features && data.overview.key_features.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-medium text-muted-foreground">Key Features</h3>
                  <ul className="space-y-2">
                    {data.overview.key_features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
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
              <CardTitle>AI Recommendations</CardTitle>
              <CardDescription>Suggested improvements and best practices</CardDescription>
            </CardHeader>
            <CardContent>
              {data.recommendations && data.recommendations.length > 0 ? (
                <div className="space-y-4">
                  {data.recommendations.map((rec, idx) => (
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
                <p className="text-sm text-muted-foreground">No recommendations available</p>
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
