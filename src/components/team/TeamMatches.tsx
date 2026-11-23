'use client'

import { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import {
  fetchTeamMatches,
  deleteMatch,
  updateMatchTeam,
  setMatchArchived,
  fetchSupabaseData,
} from '@/app/actions/supabase'
import { setSupabaseData } from '@/store/volleySlice'
import { TeamInfo, MatchInfo } from '@/types'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { NativeSelect } from '@/components/ui/native-select'
import { Badge } from '@/components/ui/badge'
import { Archive, ArchiveRestore, Trash2 } from 'lucide-react'

export default function TeamMatches({ team }: { team: TeamInfo }) {
  const dispatch = useDispatch()
  const { userTeams } = useSelector((state: RootState) => state.volley)
  const [matches, setMatches] = useState<MatchInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  // ---- Archived matches are listed separately so they can be restored ----
  const activeMatches = matches.filter((m) => !m.archivedAt)
  const archivedMatches = matches.filter((m) => m.archivedAt)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setMatches(await fetchTeamMatches(team.id))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [team.id])

  useEffect(() => {
    load()
  }, [load])

  async function handleDelete(matchId: string) {
    if (!confirm('Delete this match and all its actions?')) return
    try {
      await deleteMatch(matchId)
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  // ---- Archive hides the match from stats; unarchive restores it ----
  // ---- Reload the list and the loaded stats so charts update right away ----
  function handleArchive(matchId: string, archived: boolean) {
    setMatchArchived(matchId, archived)
      .then(() => Promise.all([load(), fetchSupabaseData()]))
      .then(([, data]) => {
        dispatch(setSupabaseData(data))
      })
      .catch((e: Error) => setError(e.message))
  }

  async function handleReassign(matchId: string, newTeamId: string) {
    if (newTeamId === team.id) return
    try {
      await updateMatchTeam(matchId, newTeamId)
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="rounded-xl bg-danger/10 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Matches ({activeMatches.length})</CardTitle>
          <CardDescription>
            Reassign, archive (hidden from stats, can be restored) or delete
            matches.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : activeMatches.length === 0 && archivedMatches.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No matches yet. Create one from the Input section.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {activeMatches.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-wrap items-center gap-2 glass-inset rounded-xl px-3 py-2.5"
                >
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2">
                    <span className="text-sm font-medium">
                      {m.opponentName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {m.matchDate}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      · {m.actionCount} actions
                    </span>
                    {/* ---- Legacy: no setter rotation, excluded from rotation analysis ---- */}
                    {m.isLegacy && (
                      <Badge
                        variant="outline"
                        className="text-[0.75rem]"
                        title="Recorded before setter-based rotations: counted in player stats, not in rotation analysis"
                      >
                        Legacy
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <NativeSelect
                      wrapperClassName="w-36"
                      className="h-8 rounded-lg"
                      aria-label="Reassign match to team"
                      value={team.id}
                      onChange={(e) => handleReassign(m.id, e.target.value)}
                    >
                      {userTeams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </NativeSelect>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      title="Archive: hide from statistics"
                      aria-label="Archive match"
                      onClick={() => handleArchive(m.id, true)}
                    >
                      <Archive className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-danger hover:text-danger"
                      aria-label="Delete match"
                      onClick={() => handleDelete(m.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* ---- Archived matches: collapsed list with unarchive ---- */}
              {archivedMatches.length > 0 && (
                <div className="mt-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowArchived(!showArchived)}
                    className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
                  >
                    Archived ({archivedMatches.length})
                    <span>{showArchived ? '−' : '+'}</span>
                  </button>
                  {showArchived && (
                    <div className="mt-2 flex flex-col gap-2">
                      {archivedMatches.map((m) => (
                        <div
                          key={m.id}
                          className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed px-3 py-2.5 text-muted-foreground opacity-80"
                        >
                          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2">
                            <span className="text-sm font-medium">
                              {m.opponentName}
                            </span>
                            <span className="text-xs">{m.matchDate}</span>
                            <span className="text-xs">
                              · {m.actionCount} actions
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleArchive(m.id, false)}
                          >
                            <ArchiveRestore className="mr-1 h-3.5 w-3.5" />
                            Unarchive
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
