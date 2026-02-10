'use client'

import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { DataTypeValues } from '@/types'
import StatChartCard from '@/components/charts/StatChartCard'
import { ScrollArea } from '@/components/ui/scroll-area'

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
  } = useSelector((state: RootState) => state.volley)

  const filteredRows = supabaseRows.filter(
    (row) =>
      supabaseSelectedPlayers.includes(row.name) &&
      (supabaseSelectedMatch === 'all' || row.match === supabaseSelectedMatch),
  )

  const stackBars = supabaseSelectedPlayers.length === supabaseAllPlayers.length

  if (supabaseRows.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        <p>No data yet. Click Refresh to load from Supabase.</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full flex-1">
      <div className="space-y-4 p-4">
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
    </ScrollArea>
  )
}
