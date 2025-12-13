export interface AnalysisResponse {
  overview?: {
    repository_name?: string
    total_files?: number
    primary_languages?: string[]
    description?: string
    key_features?: string[]
  }
  architecture?: {
    structure_type?: string
    folder_structure?: string | object
    patterns?: string[]
  }
  modules?: Array<{
    name: string
    purpose?: string
    key_files?: string[]
    dependencies?: string[]
  }>
  dependencies?: {
    external_dependencies?: Array<{
      name: string
      version?: string
    }>
    internal_dependencies?: string[]
  }
  recommendations?: Array<{
    title: string
    description: string
    priority?: "high" | "medium" | "low"
    impact?: string
  }>
}
