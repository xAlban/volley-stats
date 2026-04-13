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
import { Separator } from '@/components/ui/separator'
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
    userTeams,
  } = useSelector((state: RootState) => state.volley)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (userTeams.length === 0) {
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
    <div className="flex h-full flex-col gap-4 p-4">
      <h2 className="text-lg font-bold">Filters</h2>
      <Button
        onClick={handleRefresh}
        disabled={loading}
        size="sm"
        variant="outline"
        className="w-full"
      >
        <RefreshCw
          className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
        />
        {loading ? 'Loading...' : 'Refresh'}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Separator />

      {userTeams.length > 1 && (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Teams</h3>
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
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
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
          <Separator />
        </>
      )}

      <MatchRadioFilter
        allMatches={supabaseAllMatches}
        selectedMatch={supabaseSelectedMatch}
        onMatchChange={(match) => dispatch(setSupabaseSelectedMatch(match))}
      />
      <Separator />
      <PlayerCheckboxFilter
        allPlayers={supabaseAllPlayers}
        selectedPlayers={supabaseSelectedPlayers}
        onPlayerToggle={playerToggle.handleToggle}
        onSelectAll={playerToggle.handleSelectAll}
      />
    </div>
  )
}
