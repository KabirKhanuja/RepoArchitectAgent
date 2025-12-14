"use client"

import { useEffect, useRef, useState } from "react"
import mermaid from "mermaid"
import { X, Folder, File, Info, Loader2 } from "lucide-react"

interface MermaidViewerProps {
  diagram: string
  repositoryName?: string
  onGenerateDescriptions?: (directories: string[]) => Promise<DirectoryDescription[]>
}

interface NodeInfo {
  id: string
  label: string
  type: "folder" | "file"
  description: string
}

interface DirectoryDescription {
  directory: string
  description: string
}

export default function MermaidViewer({ 
  diagram, 
  repositoryName,
  onGenerateDescriptions 
}: MermaidViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState<boolean>(false)
  const [selectedNode, setSelectedNode] = useState<NodeInfo | null>(null)
  const [nodeDescriptions, setNodeDescriptions] = useState<Map<string, NodeInfo>>(new Map())
  const [directoryDescriptions, setDirectoryDescriptions] = useState<DirectoryDescription[]>([])
  const [loadingDescriptions, setLoadingDescriptions] = useState<boolean>(false)

  useEffect(() => {
    // Initialize Mermaid once
    if (!isInitialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: "dark",
        themeVariables: {
          primaryColor: "#3b82f6",
          primaryTextColor: "#e2e8f0",
          primaryBorderColor: "#2563eb",
          lineColor: "#64748b",
          secondaryColor: "#475569",
          tertiaryColor: "#1e293b",
          background: "#0f172a",
          mainBkg: "#1e293b",
          secondBkg: "#334155",
          textColor: "#e2e8f0",
          border1: "#475569",
          border2: "#64748b",
          nodeBorder: "#475569",
          clusterBkg: "#1e293b",
          clusterBorder: "#475569",
          edgeLabelBackground: "#1e293b",
          fontSize: "16px",
        },
        securityLevel: "loose",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: "basis",
          nodeSpacing: 80,
          rankSpacing: 80,
          padding: 20,
        },
      })
      setIsInitialized(true)
    }
  }, [isInitialized])

  // Extract node information from diagram
  const extractNodeInfo = (diagramText: string): Map<string, NodeInfo> => {
    const nodes = new Map<string, NodeInfo>()
    const lines = diagramText.split('\n')
    
    for (const line of lines) {
      // Match patterns like: A["folder/"] or B("file.py")
      const folderMatch = line.match(/(\w+)\["([^"]+)"\]/)
      const fileMatch = line.match(/(\w+)\("([^"]+)"\)/)
      
      if (folderMatch) {
        const [, id, label] = folderMatch
        nodes.set(id, {
          id,
          label: label,
          type: "folder",
          description: generateDescription(label, "folder")
        })
      } else if (fileMatch) {
        const [, id, label] = fileMatch
        nodes.set(id, {
          id,
          label: label,
          type: "file",
          description: generateDescription(label, "file")
        })
      }
    }
    
    return nodes
  }

  // Generate contextual descriptions for nodes
  const generateDescription = (label: string, type: "folder" | "file"): string => {
    const name = label.replace(/\/$/, '') // Remove trailing slash
    
    if (type === "folder") {
      const folderDescriptions: Record<string, string> = {
        "api": "Backend API implementation containing routes, controllers, and business logic",
        "web": "Frontend web application with UI components and pages",
        "src": "Main source code directory containing core application logic",
        "lib": "Reusable library code and utility functions",
        "components": "Reusable UI components for building the interface",
        "pages": "Application pages and routing definitions",
        "routes": "API route handlers and endpoint definitions",
        "models": "Data models and database schema definitions",
        "controllers": "Business logic controllers that handle requests",
        "services": "Service layer for business operations and integrations",
        "utils": "Utility functions and helper methods",
        "config": "Configuration files and environment settings",
        "tests": "Test suites and testing utilities",
        "__tests__": "Jest test files for unit and integration testing",
        "docs": "Documentation files and guides",
        "public": "Static assets accessible to the public",
        "assets": "Images, fonts, and other static resources",
        "styles": "CSS/styling files and theme definitions",
        "hooks": "Custom React hooks for shared logic",
        "context": "React context providers for state management",
        "middleware": "Express/API middleware functions",
        "types": "TypeScript type definitions and interfaces",
        "interfaces": "Interface definitions for data structures",
        "schemas": "Validation schemas and data structure definitions",
        "db": "Database connection and migration files",
        "migrations": "Database migration scripts",
        "seeders": "Database seeding scripts for test data",
      }
      
      return folderDescriptions[name.toLowerCase()] || 
             `Directory containing ${name}-related code and resources`
    } else {
      const ext = name.split('.').pop()?.toLowerCase()
      const fileDescriptions: Record<string, string> = {
        "index": "Main entry point file that initializes the application",
        "app": "Application initialization and configuration file",
        "main": "Main application file that starts the program",
        "server": "Server setup and configuration file",
        "package.json": "Node.js project metadata and dependency definitions",
        "tsconfig.json": "TypeScript compiler configuration",
        "requirements.txt": "Python package dependencies",
        "Dockerfile": "Docker container build instructions",
        "docker-compose.yml": "Multi-container Docker application definition",
        ".env": "Environment variables and configuration",
        "README.md": "Project documentation and setup instructions",
        ".gitignore": "Git ignore patterns for excluded files",
      }
      
      const extDescriptions: Record<string, string> = {
        "py": "Python source code file",
        "js": "JavaScript source code file",
        "ts": "TypeScript source code file",
        "tsx": "TypeScript React component file",
        "jsx": "JavaScript React component file",
        "json": "JSON configuration or data file",
        "md": "Markdown documentation file",
        "yml": "YAML configuration file",
        "yaml": "YAML configuration file",
        "css": "Stylesheet file",
        "scss": "SASS stylesheet file",
      }
      
      return fileDescriptions[name.toLowerCase()] || 
             (ext ? extDescriptions[ext] || `${ext.toUpperCase()} file` : "File")
    }
  }

  // Extract all directories from the diagram
  const extractDirectories = (nodes: Map<string, NodeInfo>): string[] => {
    const directories: string[] = []
    nodes.forEach((node) => {
      if (node.type === "folder") {
        directories.push(node.label)
      }
    })
    return directories
  }

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current || !diagram || !isInitialized) return

      try {
        setError(null)
        
        // Extract node information
        const nodes = extractNodeInfo(diagram)
        setNodeDescriptions(nodes)
        
        // Extract directories and generate AI descriptions
        const directories = extractDirectories(nodes)
        if (directories.length > 0 && onGenerateDescriptions) {
          setLoadingDescriptions(true)
          try {
            const descriptions = await onGenerateDescriptions(directories)
            setDirectoryDescriptions(descriptions)
          } catch (err) {
            console.error("Failed to generate directory descriptions:", err)
          } finally {
            setLoadingDescriptions(false)
          }
        }
        
        // Clear previous content
        containerRef.current.innerHTML = ""

        // Generate unique ID
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        // Render the diagram
        const { svg } = await mermaid.render(id, diagram)
        
        if (containerRef.current) {
          containerRef.current.innerHTML = svg
          
          // Apply responsive styling to SVG
          const svgElement = containerRef.current.querySelector("svg")
          if (svgElement) {
            svgElement.style.maxWidth = "100%"
            svgElement.style.height = "auto"
            svgElement.style.minHeight = "600px"
            
            // Ensure proper scaling
            const viewBox = svgElement.getAttribute("viewBox")
            if (viewBox) {
              svgElement.setAttribute("preserveAspectRatio", "xMidYMid meet")
            }
            
            // Add click handlers to nodes
            const nodeElements = svgElement.querySelectorAll('.node')
            nodeElements.forEach((nodeEl) => {
              if (!(nodeEl instanceof HTMLElement)) return
              
              const nodeId = nodeEl.id?.replace(`${id}-`, '')
              const nodeInfo = nodes.get(nodeId)
              
              if (nodeInfo) {
                // Make node clickable
                nodeEl.style.cursor = "pointer"
                
                // Add hover effect
                nodeEl.addEventListener('mouseenter', () => {
                  const rect = nodeEl.querySelector('rect, polygon')
                  if (rect) {
                    rect.setAttribute('stroke', '#3b82f6')
                    rect.setAttribute('stroke-width', '3')
                  }
                })
                
                nodeEl.addEventListener('mouseleave', () => {
                  const rect = nodeEl.querySelector('rect, polygon')
                  if (rect && (!selectedNode || selectedNode.id !== nodeId)) {
                    rect.setAttribute('stroke', '#475569')
                    rect.setAttribute('stroke-width', '1')
                  }
                })
                
                // Add click handler
                nodeEl.addEventListener('click', () => {
                  setSelectedNode(nodeInfo)
                })
              }
            })
          }
        }
      } catch (err) {
        console.error("Mermaid rendering error:", err)
        setError(err instanceof Error ? err.message : "Failed to render diagram")
        
        // Clear the container on error
        if (containerRef.current) {
          containerRef.current.innerHTML = ""
        }
      }
    }

    renderDiagram()
    
    // Cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ""
      }
    }
  }, [diagram, isInitialized, onGenerateDescriptions])

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">
          <strong>Diagram Rendering Error:</strong> {error}
        </p>
        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
            View diagram syntax
          </summary>
          <pre className="mt-2 max-h-64 overflow-auto rounded bg-muted p-2 text-xs">
            {diagram}
          </pre>
        </details>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Diagram */}
      <div className="relative">
        <div 
          ref={containerRef} 
          className="mermaid-container flex justify-center items-center min-h-[600px] w-full overflow-auto p-6 bg-slate-900/30 rounded-lg"
        />
        
        {/* Info Panel */}
        {selectedNode && (
          <div className="fixed inset-y-0 right-0 w-96 bg-slate-900/95 backdrop-blur-sm border-l border-slate-700 shadow-2xl z-50 overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  {selectedNode.type === "folder" ? (
                    <Folder className="h-6 w-6 text-blue-400" />
                  ) : (
                    <File className="h-6 w-6 text-green-400" />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {selectedNode.label}
                    </h3>
                    <p className="text-xs text-slate-400 capitalize">
                      {selectedNode.type}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 hover:bg-slate-800 rounded transition-colors"
                >
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              {/* Description */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-blue-400" />
                    <h4 className="text-sm font-medium text-slate-300">Description</h4>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {selectedNode.description}
                  </p>
                </div>

                {/* Node ID */}
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Node ID</h4>
                  <code className="text-xs text-blue-300 bg-slate-800 px-2 py-1 rounded">
                    {selectedNode.id}
                  </code>
                </div>

                {/* Additional Context */}
                <div className="pt-4 border-t border-slate-800">
                  <h4 className="text-sm font-medium text-slate-300 mb-2">
                    Typical Contents
                  </h4>
                  <div className="text-xs text-slate-400 space-y-1">
                    {selectedNode.type === "folder" ? (
                      <>
                        <p>• Subdirectories for organization</p>
                        <p>• Related source code files</p>
                        <p>• Configuration files</p>
                        <p>• Supporting resources</p>
                      </>
                    ) : (
                      <>
                        <p>• Source code implementation</p>
                        <p>• Function definitions</p>
                        <p>• Configuration or data</p>
                        <p>• Documentation</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Diagram Legend */}
        <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg p-4 text-xs">
          <h4 className="font-semibold text-slate-300 mb-2">Legend</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-12 h-6 border-2 border-slate-500 bg-slate-800 rounded flex items-center justify-center">
                <Folder className="h-3 w-3 text-blue-400" />
              </div>
              <span className="text-slate-400">Directory</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-12 h-6 border-2 border-slate-500 bg-slate-800 rounded-full flex items-center justify-center">
                <File className="h-3 w-3 text-green-400" />
              </div>
              <span className="text-slate-400">File</span>
            </div>
            <p className="text-slate-500 mt-2 pt-2 border-t border-slate-700">
              Click any node for details
            </p>
          </div>
        </div>
      </div>

      {/* Directory Descriptions Section */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Folder className="h-6 w-6 text-blue-400" />
          <div>
            <h3 className="text-lg font-semibold text-white">Directory Overview</h3>
            <p className="text-sm text-slate-400">AI-generated descriptions for each directory</p>
          </div>
        </div>

        {loadingDescriptions ? (
          <div className="flex items-center justify-center gap-3 py-12">
            <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
            <span className="text-sm text-slate-400">Generating AI descriptions...</span>
          </div>
        ) : directoryDescriptions.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {directoryDescriptions.map((dir, idx) => (
              <div
                key={idx}
                className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 hover:border-blue-500/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <Folder className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-mono text-sm font-semibold text-white mb-2 truncate">
                      {dir.directory}
                    </h4>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {dir.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Folder className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No directory descriptions available</p>
          </div>
        )}
      </div>
    </div>
  )
}