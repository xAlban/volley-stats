'use client'

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import {
  setSupabaseData,
  setSupabaseSelectedPlayers,
  setSupabaseSelectedMatch,
  setSupabaseSelectedTeams,
  setUserTeams,
} from '@/store/volleySlice'
import { fetchSupabaseData, fetchUserProfile } from '@/app/actions/supabase'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { RefreshCw } from 'lucide-react'
import MatchRadioFilter from '@/components/filters/MatchRadioFilter'
import PlayerCheckboxFilter from '@/components/filters/PlayerCheckboxFilter'
import { usePlayerToggle } from '@/hooks/usePlayerToggle'

export default function SupabaseFilterSidebar() {
  const dispatch = useDispatch()
  const {
    supabaseAllPlayers,
    supabaseSelectedPlayers,
    supabaseAllMatches,
    supabaseSelectedMatch,
    supabaseSelectedTeams,
    userTeams: allTeams,
  } = useSelector((state: RootState) => state.volley)
  // ---- Archived teams have no stats loaded: hide them from the filter ----
  const userTeams = allTeams.filter((t) => !t.archivedAt)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (allTeams.length === 0) {
      fetchUserProfile().then((p) => {
        if (p) dispatch(setUserTeams(p.teams))
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleRefresh() {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchSupabaseData()
      dispatch(setSupabaseData(data))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const playerToggle = usePlayerToggle(
    supabaseAllPlayers,
    supabaseSelectedPlayers,
    (players) => dispatch(setSupabaseSelectedPlayers(players)),
  )

  function toggleTeam(id: string) {
    const next = supabaseSelectedTeams.includes(id)
      ? supabaseSelectedTeams.filter((t) => t !== id)
      : [...supabaseSelectedTeams, id]
    dispatch(setSupabaseSelectedTeams(next))
  }

  const allTeamsSelected =
    userTeams.length > 0 && supabaseSelectedTeams.length === 0

  return (
    <div className="flex flex-col gap-5 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-tight">Filters</h2>
        <Button
          onClick={handleRefresh}
          disabled={loading}
          size="sm"
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}

      {userTeams.length > 1 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Teams
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch(setSupabaseSelectedTeams([]))}
            >
              {allTeamsSelected ? 'All' : 'Clear'}
            </Button>
          </div>
          {userTeams.map((t) => {
            const checked =
              allTeamsSelected || supabaseSelectedTeams.includes(t.id)
            return (
              <label
                key={t.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggleTeam(t.id)}
                />
                <span className="text-sm">{t.name}</span>
              </label>
            )
          })}
        </div>
      )}

      <MatchRadioFilter
        allMatches={supabaseAllMatches}
        selectedMatch={supabaseSelectedMatch}
        onMatchChange={(match) => dispatch(setSupabaseSelectedMatch(match))}
      />
      <PlayerCheckboxFilter
        allPlayers={supabaseAllPlayers}
        selectedPlayers={supabaseSelectedPlayers}
        onPlayerToggle={playerToggle.handleToggle}
        onSelectAll={playerToggle.handleSelectAll}
      />
    </div>
  )
}
