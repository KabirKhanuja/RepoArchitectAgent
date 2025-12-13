"use client"

import { useEffect, useState } from "react"

const loadingMessages = [
  "Cloning repository structure...",
  "Analyzing file dependencies...",
  "Mapping architecture patterns...",
  "Detecting module boundaries...",
  "Generating insights...",
]

export function LoadingState() {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="glass-card rounded-2xl p-12 shadow-lg">
      <div className="flex flex-col items-center justify-center space-y-8">
        {/* Animated loader */}
        <div className="relative h-32 w-32">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-primary" />
          <div
            className="absolute inset-4 animate-spin rounded-full border-4 border-transparent border-t-primary/50"
            style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
          />
          <div className="absolute inset-8 animate-pulse rounded-full bg-primary/20" />
        </div>

        {/* Loading message */}
        <div className="text-center">
          <p className="text-lg font-medium text-foreground">{loadingMessages[messageIndex]}</p>
          <p className="mt-2 text-sm text-muted-foreground">This may take a few moments</p>
        </div>
      </div>
    </div>
  )
}
