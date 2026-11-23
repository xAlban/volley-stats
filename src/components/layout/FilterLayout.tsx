'use client'

import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import PageHeader from '@/components/dashboard/PageHeader'
import SupabaseFilterSidebar from '@/components/layout/SupabaseFilterSidebar'

interface FilterLayoutProps {
  title: string
  description: string
  children: React.ReactNode
  // ---- Hide the match/player filters (views with their own pickers) ----
  showFilters?: boolean
}

// ---- Shared page shell for Charts & Analysis: filter panel + scrolling content ----
export default function FilterLayout({
  title,
  description,
  children,
  showFilters = true,
}: FilterLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-full flex-col overflow-hidden p-4 md:p-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          // ---- Mobile only: filters live in a sheet ----
          <div className={showFilters ? 'md:hidden' : 'hidden'}>
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto p-0">
                <SheetTitle className="sr-only">Filters</SheetTitle>
                <SupabaseFilterSidebar />
              </SheetContent>
            </Sheet>
          </div>
        }
      />

      <div className="flex min-h-0 flex-1 gap-4">
        {/* ---- Desktop filter panel ---- */}
        <aside
          className={`glass hidden w-72 ${showFilters ? 'md:block' : ''} shrink-0 self-start overflow-y-auto rounded-2xl md:max-h-full`}
        >
          <SupabaseFilterSidebar />
        </aside>

        {/* ---- Scrolling dashboard area ---- */}
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
