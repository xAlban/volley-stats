'use client'

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { setSupabaseData } from '@/store/volleySlice'
import { fetchSupabaseData } from '@/app/actions/supabase'
import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import SupabaseFilterSidebar from '@/components/layout/SupabaseFilterSidebar'
import SupabaseChartPanel from '@/components/layout/SupabaseChartPanel'

export default function ChartsSection() {
  const dispatch = useDispatch()
  const supabaseRows = useSelector(
    (state: RootState) => state.volley.supabaseRows,
  )
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (supabaseRows.length === 0) {
      fetchSupabaseData()
        .then((data) => dispatch(setSupabaseData(data)))
        .catch(() => {})
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-full overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden w-80 shrink-0 border-r md:block">
        <div className="h-full overflow-y-auto">
          <SupabaseFilterSidebar />
        </div>
      </aside>

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex items-center gap-3 border-b px-4 py-3 md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <SlidersHorizontal className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <SheetTitle className="sr-only">Filters</SheetTitle>
              <ScrollArea className="h-full">
                <SupabaseFilterSidebar />
              </ScrollArea>
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-bold">Charts</h1>
        </header>

        <SupabaseChartPanel />
      </div>
    </div>
  )
}
