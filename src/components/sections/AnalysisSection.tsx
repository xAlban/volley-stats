'use client'

import { TrendingUp } from 'lucide-react'

export default function AnalysisSection() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
      <TrendingUp className="h-12 w-12" />
      <p className="text-lg font-medium">Coming soon...</p>
      <p className="text-sm">Advanced analysis and trends will appear here.</p>
    </div>
  )
}
