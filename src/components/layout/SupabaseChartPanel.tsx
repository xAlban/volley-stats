'use client'

import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { DataTypeValues } from '@/types'
import StatChartCard from '@/components/charts/StatChartCard'
import { BarChart3 } from 'lucide-react'
import EmptyState from '@/components/dashboard/EmptyState'

const chartSections = [
  { title: 'Attacks', type: DataTypeValues.ATTACK },
  { title: 'Defense', type: DataTypeValues.DEFENSE },
  { title: 'Serve', type: DataTypeValues.SERVE },
  { title: 'Reception', type: DataTypeValues.RECEP },
  { title: 'Block', type: DataTypeValues.BLOCK },
] as const

export default function SupabaseChartPanel() {
  const {
    supabaseRows,
    supabaseAllPlayers,
    supabaseSelectedPlayers,
    supabaseSelectedMatch,
    supabaseSelectedTeams,
  } = useSelector((state: RootState) => state.volley)

  const filteredRows = supabaseRows.filter(
    (row) =>
      supabaseSelectedPlayers.includes(row.name) &&
      (supabaseSelectedMatch === 'all' ||
        row.match === supabaseSelectedMatch) &&
      (supabaseSelectedTeams.length === 0 ||
        (row.teamId && supabaseSelectedTeams.includes(row.teamId))),
  )

  const stackBars = supabaseSelectedPlayers.length === supabaseAllPlayers.length

  if (supabaseRows.length === 0) {
    return (
      <div className="glass rounded-2xl">
        <EmptyState
          icon={<BarChart3 />}
          title="No data yet"
          description="Click Refresh in the filters to load your stats from Supabase."
        />
      </div>
    )
  }

  // ---- Dashboard grid: add new ChartCards here ----
  return (
    <div className="grid grid-cols-1 gap-3 md:gap-4 xl:grid-cols-2">
      {chartSections.map(({ title, type }) => (
        <StatChartCard
          key={type}
          title={title}
          type={type}
          dataSource="supabase"
          notionRows={filteredRows}
          stackBars={stackBars}
        />
      ))}
    </div>
  )
}
