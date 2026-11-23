'use client'

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { setSupabaseData } from '@/store/volleySlice'
import { fetchSupabaseData } from '@/app/actions/supabase'
import FilterLayout from '@/components/layout/FilterLayout'
import AnalysisMetricsPanel from '@/components/analysis/AnalysisMetricsPanel'
import RotationAnalysisCard from '@/components/analysis/RotationAnalysisCard'
import ProgressionPanel from '@/components/analysis/progression/ProgressionPanel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function AnalysisSection() {
  const dispatch = useDispatch()
  const supabaseRows = useSelector(
    (state: RootState) => state.volley.supabaseRows,
  )
  // ---- Progression has its own team/player pickers: hide sidebar filters ----
  const [tab, setTab] = useState('progression')

  // ---- Auto-fetch supabase data on mount if not loaded yet ----
  useEffect(() => {
    if (supabaseRows.length === 0) {
      fetchSupabaseData()
        .then((data) => dispatch(setSupabaseData(data)))
        .catch(() => {})
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <FilterLayout
      title="Analysis"
      description="Progression over time, efficiency per player and per setter rotation."
      showFilters={tab !== 'progression'}
    >
      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <TabsList>
          <TabsTrigger value="progression">Progression</TabsTrigger>
          <TabsTrigger value="players">By Player</TabsTrigger>
          <TabsTrigger value="rotation">By Rotation</TabsTrigger>
        </TabsList>
        <TabsContent value="progression">
          <ProgressionPanel />
        </TabsContent>
        <TabsContent value="players">
          <AnalysisMetricsPanel />
        </TabsContent>
        <TabsContent value="rotation">
          <RotationAnalysisCard />
        </TabsContent>
      </Tabs>
    </FilterLayout>
  )
}
