'use client'

import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { ScrollArea } from '@/components/ui/scroll-area'
import PlayerMetricsRow from '@/components/analysis/PlayerMetricsRow'

export default function AnalysisMetricsPanel() {
  const { supabaseRows, supabaseSelectedPlayers, supabaseSelectedMatch } =
    useSelector((state: RootState) => state.volley)

  // ---- Filter rows by selected players and match ----
  const filteredRows = useMemo(
    () =>
      supabaseRows.filter(
        (row) =>
          supabaseSelectedPlayers.includes(row.name) &&
          (supabaseSelectedMatch === 'all' ||
            row.match === supabaseSelectedMatch),
      ),
    [supabaseRows, supabaseSelectedPlayers, supabaseSelectedMatch],
  )

  // ---- Group filtered rows by player, sorted alphabetically ----
  const playerRows = useMemo(() => {
    const sorted = [...supabaseSelectedPlayers].sort()
    return sorted.map((name) => ({
      name,
      rows: filteredRows.filter((r) => r.name === name),
    }))
  }, [supabaseSelectedPlayers, filteredRows])

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
        {playerRows.map(({ name, rows }) => (
          <PlayerMetricsRow key={name} playerName={name} rows={rows} />
        ))}
      </div>
    </ScrollArea>
  )
}
