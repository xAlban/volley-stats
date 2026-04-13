'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import {
  fetchTeamMatches,
  renameMatch,
  deleteMatch,
  updateMatchTeam,
} from '@/app/actions/supabase'
import { TeamInfo, MatchInfo } from '@/types'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Pencil, Check, X } from 'lucide-react'

export default function TeamMatches({ team }: { team: TeamInfo }) {
  const { userTeams } = useSelector((state: RootState) => state.volley)
  const [matches, setMatches] = useState<MatchInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

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

  async function handleRename(matchId: string) {
    if (!editName.trim()) return
    try {
      await renameMatch(matchId, editName.trim())
      setEditingId(null)
      setEditName('')
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function handleDelete(matchId: string) {
    if (!confirm('Delete this match and all its actions?')) return
    try {
      await deleteMatch(matchId)
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
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
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Matches ({matches.length})</CardTitle>
          <CardDescription>
            Rename, reassign to another team, or delete matches.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : matches.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No matches yet. Create one from the Input section.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {matches.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-wrap items-center gap-2 rounded-md bg-muted/50 px-3 py-2"
                >
                  <div className="flex flex-1 items-center gap-2">
                    {editingId === m.id ? (
                      <>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => handleRename(m.id)}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => {
                            setEditingId(null)
                            setEditName('')
                          }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-medium">{m.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {m.actionCount} actions
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => {
                            setEditingId(m.id)
                            setEditName(m.name)
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="h-8 rounded-md border bg-background px-2 text-sm"
                      value={team.id}
                      onChange={(e) => handleReassign(m.id, e.target.value)}
                    >
                      {userTeams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDelete(m.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
