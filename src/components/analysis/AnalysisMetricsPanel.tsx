'use client'

import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { ScrollArea } from '@/components/ui/scroll-area'
import PlayerMetricsRow from '@/components/analysis/PlayerMetricsRow'

export default function AnalysisMetricsPanel() {
  const {
    supabaseRows,
    supabaseSelectedPlayers,
    supabaseSelectedMatch,
    supabaseSelectedTeams,
  } = useSelector((state: RootState) => state.volley)

  const filteredRows = useMemo(
    () =>
      supabaseRows.filter(
        (row) =>
          supabaseSelectedPlayers.includes(row.name) &&
          (supabaseSelectedMatch === 'all' ||
            row.match === supabaseSelectedMatch) &&
          (supabaseSelectedTeams.length === 0 ||
            (row.teamId && supabaseSelectedTeams.includes(row.teamId))),
      ),
    [
      supabaseRows,
      supabaseSelectedPlayers,
      supabaseSelectedMatch,
      supabaseSelectedTeams,
    ],
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
        {playerRows.map(({ name, rows }) =>
          rows.length !== 0 ? (
            <PlayerMetricsRow key={name} playerName={name} rows={rows} />
          ) : null,
        )}
      </div>
    </ScrollArea>
  )
}
