"use client"

import type React from "react"
import Link from "next/link"
import { ArrowRight, GitBranch, Network, FileCode, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { FluidBackground } from "@/components/fluid-background"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <FluidBackground />
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient effect */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/20 blur-[100px]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-primary" />
              AI-Powered Analysis
            </div>

            <h1 className="mx-auto max-w-4xl text-balance text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Understand Any GitHub Repository{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Instantly
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground sm:text-xl">
              AI-powered architectural insights, dependency analysis, and intelligent recommendations to help you
              understand complex codebases in seconds.
            </p>

            <div className="mt-10 flex items-center justify-center gap-4">
              <Button size="lg" asChild className="group">
                <Link href="/dashboard">
                  Start Analyzing
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Powerful AI Analysis Features</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Everything you need to understand complex repositories quickly and efficiently
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<GitBranch className="h-6 w-6" />}
              title="Architecture Mapping"
              description="Visualize repository structure with intelligent hierarchy detection and folder organization insights."
            />
            <FeatureCard
              icon={<Network className="h-6 w-6" />}
              title="Dependency Analysis"
              description="Comprehensive analysis of internal and external dependencies with version tracking."
            />
            <FeatureCard
              icon={<FileCode className="h-6 w-6" />}
              title="Module Breakdown"
              description="Understand module responsibilities, patterns, and relationships across your codebase."
            />
            <FeatureCard
              icon={<Lightbulb className="h-6 w-6" />}
              title="Smart Recommendations"
              description="Get AI-powered suggestions for improvements, refactoring, and best practices."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden border-t border-border/50">
        <div className="absolute inset-0 -z-10">
          <div className="absolute bottom-0 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-primary/10 blur-[100px]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to analyze your repository?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Start understanding your codebase with AI-powered insights in seconds.
            </p>
            <div className="mt-10">
              <Button size="lg" asChild className="group">
                <Link href="/dashboard">
                  Get Started Now
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  )
}
