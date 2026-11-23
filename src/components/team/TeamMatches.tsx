'use client'

import { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import {
  fetchTeamMatches,
  deleteMatch,
  updateMatchTeam,
  setMatchArchived,
  updateMatchDetails,
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
import { Input } from '@/components/ui/input'
import { Archive, ArchiveRestore, Check, Pencil, Trash2, X } from 'lucide-react'

export default function TeamMatches({ team }: { team: TeamInfo }) {
  const dispatch = useDispatch()
  const { userTeams } = useSelector((state: RootState) => state.volley)
  const [matches, setMatches] = useState<MatchInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  // ---- Inline edit of opponent + date ----
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editOpponent, setEditOpponent] = useState('')
  const [editDate, setEditDate] = useState('')
  const [saving, setSaving] = useState(false)

  const startEdit = (m: MatchInfo) => {
    setEditingId(m.id)
    setEditOpponent(m.opponentName)
    setEditDate(m.matchDate)
  }

  // ---- Save, then reload the list and stats (labels and order change) ----
  const saveEdit = () => {
    if (!editingId) return
    setSaving(true)
    updateMatchDetails(editingId, {
      opponentName: editOpponent,
      matchDate: editDate,
    })
      .then(() => Promise.all([load(), fetchSupabaseData()]))
      .then(([, data]) => {
        dispatch(setSupabaseData(data))
        setEditingId(null)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setSaving(false))
  }

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
              {activeMatches.map((m) =>
                editingId === m.id ? (
                  // ---- Edit mode: opponent + date ----
                  <div
                    key={m.id}
                    className="glass-inset flex flex-wrap items-center gap-2 rounded-xl px-3 py-2.5"
                  >
                    <Input
                      aria-label="Opponent"
                      value={editOpponent}
                      onChange={(e) => setEditOpponent(e.target.value)}
                      className="h-9 min-w-40 flex-1"
                    />
                    <Input
                      aria-label="Match date"
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="h-9 w-40"
                    />
                    <Button
                      size="sm"
                      disabled={saving || !editOpponent.trim() || !editDate}
                      onClick={saveEdit}
                    >
                      <Check className="size-4" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="size-4" />
                      Cancel
                    </Button>
                  </div>
                ) : (
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
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        title="Edit opponent and date"
                        aria-label="Edit match"
                        onClick={() => startEdit(m)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
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
                ),
              )}

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
