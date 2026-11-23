'use client'

import IconRail from '@/components/layout/IconRail'
import MobileTabBar from '@/components/layout/MobileTabBar'
import SectionRouter from '@/components/layout/SectionRouter'
import { Toaster } from '@/components/ui/sonner'

export default function Home() {
  return (
    // ---- App shell: floating sidebar + content on desktop, bottom tabs on mobile ----
    <div className="flex h-dvh overflow-hidden md:gap-3 md:p-3">
      <Toaster />
      <IconRail />

      {/* ---- Section content (each section manages its own scrolling) ---- */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <SectionRouter />
      </main>

      <MobileTabBar />
    </div>
  )
}
