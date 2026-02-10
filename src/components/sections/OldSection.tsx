'use client'

import FilterSidebar from '@/components/layout/FilterSidebar'
import ChartPanel from '@/components/layout/ChartPanel'
import MobileFilterDrawer from '@/components/layout/MobileFilterDrawer'

export default function OldSection() {
  return (
    <div className="flex h-full overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden w-80 shrink-0 border-r md:block">
        <div className="h-full overflow-y-auto">
          <FilterSidebar />
        </div>
      </aside>

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex items-center gap-3 border-b px-4 py-3 md:hidden">
          <MobileFilterDrawer />
          <h1 className="text-lg font-bold">Old View</h1>
        </header>

        {/* Charts */}
        <ChartPanel />
      </div>
    </div>
  )
}
