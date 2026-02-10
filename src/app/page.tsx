'use client'

import IconRail from '@/components/layout/IconRail'
import MobileTabBar from '@/components/layout/MobileTabBar'
import SectionRouter from '@/components/layout/SectionRouter'

export default function Home() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop icon rail */}
      <IconRail />

      {/* Section content */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden pb-16 md:pb-0">
        <SectionRouter />
      </main>

      {/* Mobile bottom tab bar */}
      <MobileTabBar />
    </div>
  )
}
