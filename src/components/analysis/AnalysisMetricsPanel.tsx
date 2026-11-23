'use client'

import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { Users } from 'lucide-react'
import EmptyState from '@/components/dashboard/EmptyState'
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
      <div className="glass rounded-2xl">
        <EmptyState
          icon={<Users />}
          title="No data yet"
          description="Click Refresh in the filters to load your stats from Supabase."
        />
      </div>
    )
  }

  // ---- One ChartCard per player, in a shared dashboard grid ----
  return (
    <div className="grid grid-cols-1 gap-3 md:gap-4">
      {playerRows.map(({ name, rows }) =>
        rows.length !== 0 ? (
          <PlayerMetricsRow key={name} playerName={name} rows={rows} />
        ) : null,
      )}
    </div>
  )
}
