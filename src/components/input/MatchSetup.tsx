'use client'

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import {
  startTracking,
  setSupabaseData,
  setTeamRoster,
} from '@/store/volleySlice'
import {
  fetchSupabaseData,
  fetchTeamPlayers,
  addTeamPlayer,
} from '@/app/actions/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Play } from 'lucide-react'

export default function MatchSetup() {
  const dispatch = useDispatch()
  const { supabaseAllPlayers, teamRoster, activeTeamId } = useSelector(
    (state: RootState) => state.volley,
  )

  const [matchName, setMatchName] = useState('')
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [newPlayer, setNewPlayer] = useState('')
  const [loading, setLoading] = useState(false)

  // ---- Use roster as primary source, fall back to stats-derived players ----
  const rosterPlayers = teamRoster
    .filter((p) => p.isActive)
    .map((p) => p.name)
  const allPlayers =
    rosterPlayers.length > 0
      ? rosterPlayers.sort()
      : [...new Set(supabaseAllPlayers)].sort()

  // ---- Fetch roster and stats data if not loaded ----
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        if (activeTeamId && teamRoster.length === 0) {
          const roster = await fetchTeamPlayers(activeTeamId)
          dispatch(setTeamRoster(roster))
        }
        if (supabaseAllPlayers.length === 0) {
          const data = await fetchSupabaseData()
          dispatch(setSupabaseData(data))
        }
      } catch {
        // ---- Silently fail ----
      } finally {
        setLoading(false)
      }
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleTogglePlayer = (player: string) => {
    setSelectedPlayers((prev) =>
      prev.includes(player)
        ? prev.filter((p) => p !== player)
        : [...prev, player],
    )
  }

  const handleAddPlayer = async () => {
    const trimmed = newPlayer.trim()
    if (!trimmed) return
    // ---- Add to roster in DB if we have a team ----
    if (activeTeamId && !teamRoster.some((p) => p.name === trimmed)) {
      try {
        await addTeamPlayer(activeTeamId, trimmed)
        const roster = await fetchTeamPlayers(activeTeamId)
        dispatch(setTeamRoster(roster))
      } catch {
        // ---- Player might already exist, ignore ----
      }
    }
    if (!selectedPlayers.includes(trimmed)) {
      setSelectedPlayers((prev) => [...prev, trimmed])
    }
    setNewPlayer('')
  }

  const handleSelectAll = () => {
    setSelectedPlayers(
      selectedPlayers.length === allPlayers.length ? [] : [...allPlayers],
    )
  }

  const canStart = matchName.trim().length > 0 && selectedPlayers.length > 0

  return (
    <div className="flex flex-1 items-start justify-center overflow-y-auto p-4 md:p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-xl">New Match</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* ---- Match name input ---- */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Match Name</label>
            <Input
              placeholder="e.g. vs Team X"
              value={matchName}
              onChange={(e) => setMatchName(e.target.value)}
            />
          </div>

          {/* ---- Player selection ---- */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Players</label>
              <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                {selectedPlayers.length === allPlayers.length
                  ? 'Deselect All'
                  : 'Select All'}
              </Button>
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground">
                Loading players...
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {allPlayers.map((player) => (
                  <label
                    key={player}
                    className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 hover:bg-accent"
                  >
                    <Checkbox
                      checked={selectedPlayers.includes(player)}
                      onCheckedChange={() => handleTogglePlayer(player)}
                    />
                    <span className="text-sm">{player}</span>
                  </label>
                ))}
              </div>
            )}

            {/* ---- Add new player ---- */}
            <div className="flex gap-2">
              <Input
                placeholder="Add new player"
                value={newPlayer}
                onChange={(e) => setNewPlayer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddPlayer()
                  }
                }}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleAddPlayer}
                disabled={!newPlayer.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* ---- Start button ---- */}
          <Button
            className="w-full"
            size="lg"
            disabled={!canStart}
            onClick={() =>
              dispatch(
                startTracking({
                  matchName: matchName.trim(),
                  players: selectedPlayers.sort(),
                }),
              )
            }
          >
            <Play className="mr-2 h-4 w-4" />
            Start Tracking ({selectedPlayers.length} players)
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
