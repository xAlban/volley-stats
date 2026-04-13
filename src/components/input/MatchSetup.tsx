'use client'

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import {
  startTracking,
  setTeamRoster,
  setUserTeams,
} from '@/store/volleySlice'
import {
  fetchTeamPlayers,
  addTeamPlayer,
  fetchTeamMatches,
  createMatch,
  fetchUserProfile,
} from '@/app/actions/supabase'
import { MatchInfo } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Play } from 'lucide-react'

export default function MatchSetup() {
  const dispatch = useDispatch()
  const { userTeams, teamRoster } = useSelector(
    (state: RootState) => state.volley,
  )

  const [teamId, setTeamId] = useState<string>('')
  const [existingMatches, setExistingMatches] = useState<MatchInfo[]>([])
  const [matchChoice, setMatchChoice] = useState<string>('new')
  const [newMatchName, setNewMatchName] = useState('')
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [newPlayer, setNewPlayer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ---- Ensure teams are loaded ----
  useEffect(() => {
    if (userTeams.length === 0) {
      fetchUserProfile().then((p) => {
        if (p) dispatch(setUserTeams(p.teams))
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Default team selection ----
  useEffect(() => {
    if (!teamId && userTeams.length > 0) setTeamId(userTeams[0].id)
  }, [userTeams, teamId])

  // ---- When team changes, fetch roster + matches ----
  useEffect(() => {
    if (!teamId) return
    setLoading(true)
    Promise.all([fetchTeamPlayers(teamId), fetchTeamMatches(teamId)])
      .then(([roster, matches]) => {
        dispatch(setTeamRoster(roster))
        setExistingMatches(matches)
        setSelectedPlayers([])
        setMatchChoice('new')
        setNewMatchName('')
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [teamId, dispatch])

  const rosterPlayers = teamRoster
    .filter((p) => p.isActive)
    .map((p) => p.name)
    .sort()

  const handleTogglePlayer = (player: string) => {
    setSelectedPlayers((prev) =>
      prev.includes(player)
        ? prev.filter((p) => p !== player)
        : [...prev, player],
    )
  }

  const handleAddPlayer = async () => {
    const trimmed = newPlayer.trim()
    if (!trimmed || !teamId) return
    if (!teamRoster.some((p) => p.name === trimmed)) {
      try {
        await addTeamPlayer(teamId, trimmed)
        const roster = await fetchTeamPlayers(teamId)
        dispatch(setTeamRoster(roster))
      } catch {
        // ---- Already exists ----
      }
    }
    if (!selectedPlayers.includes(trimmed)) {
      setSelectedPlayers((prev) => [...prev, trimmed])
    }
    setNewPlayer('')
  }

  const handleSelectAll = () => {
    setSelectedPlayers(
      selectedPlayers.length === rosterPlayers.length ? [] : [...rosterPlayers],
    )
  }

  const canStart =
    teamId.length > 0 &&
    selectedPlayers.length > 0 &&
    (matchChoice === 'new' ? newMatchName.trim().length > 0 : true)

  async function handleStart() {
    if (!teamId) return
    setError(null)
    try {
      let matchId: string
      let matchName: string
      if (matchChoice === 'new') {
        const created = await createMatch(teamId, newMatchName.trim())
        matchId = created.id
        matchName = created.name
      } else {
        const existing = existingMatches.find((m) => m.id === matchChoice)
        if (!existing) return
        matchId = existing.id
        matchName = existing.name
      }
      dispatch(
        startTracking({
          teamId,
          matchId,
          matchName,
          players: [...selectedPlayers].sort(),
        }),
      )
    } catch (e) {
      setError((e as Error).message)
    }
  }

  if (userTeams.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground">
          Join or create a team first from the Team section.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 items-start justify-center overflow-y-auto p-4 md:p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-xl">New Match</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* ---- Team selection ---- */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Team</label>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
            >
              {userTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* ---- Match selection ---- */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Match</label>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={matchChoice}
              onChange={(e) => setMatchChoice(e.target.value)}
            >
              <option value="new">+ Create new match</option>
              {existingMatches.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.actionCount})
                </option>
              ))}
            </select>
            {matchChoice === 'new' && (
              <Input
                placeholder="Match name (e.g. vs Team X)"
                value={newMatchName}
                onChange={(e) => setNewMatchName(e.target.value)}
              />
            )}
          </div>

          {/* ---- Player selection ---- */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Players</label>
              <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                {selectedPlayers.length === rosterPlayers.length
                  ? 'Deselect All'
                  : 'Select All'}
              </Button>
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground">
                Loading players...
              </p>
            ) : rosterPlayers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active players in roster. Add players below or in the Team
                section.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {rosterPlayers.map((player) => (
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

          <Button
            className="w-full"
            size="lg"
            disabled={!canStart}
            onClick={handleStart}
          >
            <Play className="mr-2 h-4 w-4" />
            Start Tracking ({selectedPlayers.length} players)
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
