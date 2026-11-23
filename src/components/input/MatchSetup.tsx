'use client'

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { startTracking, setTeamRoster, setUserTeams } from '@/store/volleySlice'
import {
  fetchTeamPlayers,
  addTeamPlayer,
  fetchTeamMatches,
  fetchUserProfile,
} from '@/app/actions/supabase'
import { MatchInfo, TeamPlayer, LineupDraft, LivePlayer } from '@/types'
import {
  MAX_LIBEROS,
  defaultLiberoTargets,
  validateLineupDraft,
} from '@/utils/rotation'
import LineupEditor from '@/components/input/LineupEditor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Play, ArrowLeft, ArrowRight } from 'lucide-react'

// ---- Convert TeamPlayer to LivePlayer. isLibero is the roster flag, used
//      only as a hint: the match libero is chosen in the lineup step ----
function toLivePlayer(p: TeamPlayer): LivePlayer {
  return {
    playerId: p.id,
    name: p.name,
    jerseyNumber: p.jerseyNumber,
    position: p.position,
    isLibero: p.isLibero,
  }
}

const emptyDraft = (): LineupDraft => ({
  lineup: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null },
  liberoIds: [],
  liberoTargetIds: [],
  isTeamServing: true,
})

export default function MatchSetup() {
  const dispatch = useDispatch()
  const { userTeams, teamRoster } = useSelector(
    (state: RootState) => state.volley,
  )

  // ---- Step management: 1=match, 2=players, 3=lineup ----
  const [step, setStep] = useState<1 | 2 | 3>(1)

  const [teamId, setTeamId] = useState<string>('')
  const [existingMatches, setExistingMatches] = useState<MatchInfo[]>([])
  const [matchChoice, setMatchChoice] = useState<string>('new')
  const [opponentName, setOpponentName] = useState('')
  // ---- Match date defaults to today (YYYY-MM-DD for <input type="date">) ----
  const [matchDate, setMatchDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10),
  )
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [newPlayer, setNewPlayer] = useState('')
  const [newPlayerJersey, setNewPlayerJersey] = useState('')
  const [newPlayerPosition, setNewPlayerPosition] = useState('')
  const [newPlayerIsLibero, setNewPlayerIsLibero] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ---- Starting lineup draft (positions, libero, first serve) ----
  const [draft, setDraft] = useState<LineupDraft>(emptyDraft)

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
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [teamId, dispatch])

  const rosterPlayers = teamRoster
    .filter((p) => p.isActive)
    .sort((a, b) => a.name.localeCompare(b.name))

  const rosterNames = rosterPlayers.map((p) => p.name)

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
        // ---- Parse optional jersey; empty string → null ----
        const jerseyNumber = newPlayerJersey
          ? parseInt(newPlayerJersey, 10)
          : null
        await addTeamPlayer(teamId, trimmed, {
          jerseyNumber:
            jerseyNumber !== null && !Number.isNaN(jerseyNumber)
              ? jerseyNumber
              : null,
          position: newPlayerPosition || null,
          isLibero: newPlayerIsLibero,
        })
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
    setNewPlayerJersey('')
    setNewPlayerPosition('')
    setNewPlayerIsLibero(false)
  }

  const handleSelectAll = () => {
    setSelectedPlayers(
      selectedPlayers.length === rosterNames.length ? [] : [...rosterNames],
    )
  }

  // ---- Players taking part in this match ----
  const matchPlayers: LivePlayer[] = rosterPlayers
    .filter((p) => selectedPlayers.includes(p.name))
    .map(toLivePlayer)

  // ---- Step validation: new match requires opponent + date; existing just needs a pick ----
  const canGoToStep2 =
    teamId.length > 0 &&
    (matchChoice === 'new'
      ? opponentName.trim().length > 0 && matchDate.length > 0
      : true)

  const canGoToStep3 = selectedPlayers.length >= 6

  const lineupCount = Object.values(draft.lineup).filter(Boolean).length
  const canStart = validateLineupDraft(draft).length === 0

  async function handleStart() {
    if (!teamId) return
    setError(null)
    try {
      // ---- Defer match row creation to submit. null => new match ----
      let matchId: string | null
      let resolvedOpponent: string
      let resolvedDate: string
      if (matchChoice === 'new') {
        matchId = null
        resolvedOpponent = opponentName.trim()
        resolvedDate = matchDate
      } else {
        const existing = existingMatches.find((m) => m.id === matchChoice)
        if (!existing) return
        matchId = existing.id
        resolvedOpponent = existing.opponentName
        resolvedDate = existing.matchDate
      }

      // ---- Court/bench + libero designation are built by the reducer ----
      dispatch(
        startTracking({
          teamId,
          matchId,
          opponentName: resolvedOpponent,
          matchDate: resolvedDate,
          players: matchPlayers,
          draft,
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
          <CardTitle className="flex items-center justify-between text-xl">
            <span>
              {step === 1 && 'New Match'}
              {step === 2 && 'Select Players'}
              {step === 3 && 'Starting Lineup'}
            </span>
            <span className="text-sm text-muted-foreground font-normal">
              Step {step}/3
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* ---- STEP 1: Match Setup ---- */}
          {step === 1 && (
            <>
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
                      {m.opponentName} — {m.matchDate} ({m.actionCount})
                    </option>
                  ))}
                </select>
              </div>

              {/* ---- New match: opponent + date ---- */}
              {matchChoice === 'new' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Opponent</label>
                    <Input
                      placeholder="Opponent team name"
                      value={opponentName}
                      onChange={(e) => setOpponentName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date</label>
                    <Input
                      type="date"
                      value={matchDate}
                      onChange={(e) => setMatchDate(e.target.value)}
                    />
                  </div>
                </>
              )}

              <Button
                className="w-full"
                size="lg"
                disabled={!canGoToStep2}
                onClick={() => setStep(2)}
              >
                Next: Select Players
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}

          {/* ---- STEP 2: Player Selection ---- */}
          {step === 2 && (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Players ({selectedPlayers.length} selected, min 6)
                  </label>
                  <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                    {selectedPlayers.length === rosterNames.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </Button>
                </div>

                {loading ? (
                  <p className="text-sm text-muted-foreground">
                    Loading players...
                  </p>
                ) : rosterNames.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No active players in roster. Add players below or in the
                    Team section.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {rosterPlayers.map((player) => (
                      <label
                        key={player.id}
                        className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 hover:bg-accent"
                      >
                        <Checkbox
                          checked={selectedPlayers.includes(player.name)}
                          onCheckedChange={() =>
                            handleTogglePlayer(player.name)
                          }
                        />
                        <div className="flex items-center gap-1.5">
                          {player.jerseyNumber !== null && (
                            <span className="text-xs font-bold text-muted-foreground">
                              #{player.jerseyNumber}
                            </span>
                          )}
                          <span className="text-sm">{player.name}</span>
                          {player.isLibero && (
                            <span className="text-[10px] text-orange-500 font-bold">
                              L
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
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
                    className="flex-1 min-w-[140px]"
                  />
                  <Input
                    type="number"
                    placeholder="#"
                    value={newPlayerJersey}
                    onChange={(e) => setNewPlayerJersey(e.target.value)}
                    className="h-10 w-16"
                  />
                  <select
                    value={newPlayerPosition}
                    onChange={(e) => setNewPlayerPosition(e.target.value)}
                    className="h-10 rounded-md border bg-background px-2 text-sm"
                  >
                    <option value="">Pos</option>
                    <option value="OH">OH</option>
                    <option value="MB">MB</option>
                    <option value="S">S</option>
                    <option value="OP">OP</option>
                    <option value="L">L</option>
                    <option value="DS">DS</option>
                  </select>
                  <label className="flex items-center gap-1 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPlayerIsLibero}
                      onChange={(e) => setNewPlayerIsLibero(e.target.checked)}
                    />
                    Libero
                  </label>
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

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  className="flex-1"
                  disabled={!canGoToStep3}
                  onClick={() => {
                    // ---- Reset lineup; pre-select roster liberos (still
                    //      editable: a roster libero may play another role)
                    //      and default libero targets to middle blockers ----
                    setDraft((prev) => ({
                      ...emptyDraft(),
                      isTeamServing: prev.isTeamServing,
                      liberoIds: matchPlayers
                        .filter((p) => p.isLibero)
                        .slice(0, MAX_LIBEROS)
                        .map((p) => p.playerId),
                      liberoTargetIds: defaultLiberoTargets(matchPlayers),
                    }))
                    setStep(3)
                  }}
                >
                  Next: Lineup
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {/* ---- STEP 3: Starting Lineup ---- */}
          {step === 3 && (
            <>
              <LineupEditor
                players={matchPlayers}
                draft={draft}
                onChange={setDraft}
              />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(2)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  className="flex-1"
                  disabled={!canStart}
                  onClick={handleStart}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start ({lineupCount}/6)
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
