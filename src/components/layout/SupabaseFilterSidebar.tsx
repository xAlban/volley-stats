'use client'

import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import {
  setSupabaseData,
  setSupabaseSelectedPlayers,
  setSupabaseSelectedMatch,
} from '@/store/volleySlice'
import { fetchSupabaseData } from '@/app/actions/supabase'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
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
  } = useSelector((state: RootState) => state.volley)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
