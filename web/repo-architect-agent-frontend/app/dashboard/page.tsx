import { Navigation } from "@/components/navigation"
import { RepositoryAnalyzer } from "@/components/repository-analyzer"

export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Repository Analysis Dashboard</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Enter a GitHub repository URL to generate comprehensive architectural insights
          </p>
        </div>

        <RepositoryAnalyzer />
      </div>
    </div>
  )
}
