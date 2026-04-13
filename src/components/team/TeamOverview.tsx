'use client'

import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { RootState } from '@/store/store'
import { updateTeamName, deleteTeam } from '@/app/actions/supabase'
import { TeamInfo } from '@/types'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Copy, Check, BarChart3, Users, Trophy, Trash2 } from 'lucide-react'
import MetricCard from '@/components/analysis/MetricCard'
import {
  attackEfficiency,
  killPercent,
  passPositivity,
  serveEfficiency,
  weightedGPA,
} from '@/utils/metrics'

const teamNameSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters'),
})
type TeamNameValues = z.infer<typeof teamNameSchema>

interface Props {
  team: TeamInfo
  onDeleted: () => void | Promise<void>
}

export default function TeamOverview({ team, onDeleted }: Props) {
  const { supabaseRows, teamRoster } = useSelector(
    (state: RootState) => state.volley,
  )
  const isAdmin = team.role === 'admin'

  // ---- Scope rows/matches to this team ----
  const teamRows = useMemo(
    () => supabaseRows.filter((r) => r.teamId === team.id),
    [supabaseRows, team.id],
  )
  const teamMatches = useMemo(
    () => new Set(teamRows.map((r) => r.match).filter(Boolean)),
    [teamRows],
  )

  const [copied, setCopied] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmName, setConfirmName] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const form = useForm<TeamNameValues>({
    resolver: zodResolver(teamNameSchema),
    defaultValues: { name: team.name },
  })

  const metrics = useMemo(
    () => ({
      atkEff: attackEfficiency(teamRows),
      killPct: killPercent(teamRows),
      passPos: passPositivity(teamRows),
      srvEff: serveEfficiency(teamRows),
      gpa: weightedGPA(teamRows),
    }),
    [teamRows],
  )

  const mvp = useMemo(() => {
    const players = [...new Set(teamRows.map((r) => r.name))]
    let best: string | null = null
    let bestGpa = -Infinity
    for (const player of players) {
      const gpa = weightedGPA(teamRows.filter((r) => r.name === player))
      if (gpa !== null && gpa > bestGpa) {
        bestGpa = gpa
        best = player
      }
    }
    return best
  }, [teamRows])

  async function onUpdateName(values: TeamNameValues) {
    try {
      await updateTeamName(team.id, values.name)
      setMessage('Team name updated')
      setError(null)
      setTimeout(() => setMessage(null), 3000)
    } catch (e) {
      setError((e as Error).message)
      setTimeout(() => setError(null), 5000)
    }
  }

  async function copyInviteCode() {
    await navigator.clipboard.writeText(team.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleDelete() {
    if (confirmName.trim() !== team.name) {
      setError('Team name does not match')
      return
    }
    setDeleting(true)
    try {
      await deleteTeam(team.id)
      await onDeleted()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setDeleting(false)
      setConfirmOpen(false)
      setConfirmName('')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {message && (
        <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Team Info</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isAdmin ? (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onUpdateName)}
                className="flex flex-col gap-3"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-fit">
                  Update name
                </Button>
              </form>
            </Form>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground">Team name</p>
              <p className="font-medium">{team.name}</p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Invite code:</span>
            <code className="rounded bg-muted px-2 py-1 text-sm">
              {team.inviteCode}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={copyInviteCode}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Stats</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamRows.length}</div>
            <p className="text-xs text-muted-foreground">recorded actions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamRoster.length}</div>
            <p className="text-xs text-muted-foreground">in roster</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Matches</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMatches.size}</div>
            <p className="text-xs text-muted-foreground">recorded matches</p>
          </CardContent>
        </Card>
      </div>

      {teamRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
            <CardDescription>{mvp && `MVP: ${mvp}`}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <MetricCard
                label="Atk Eff"
                value={metrics.atkEff}
                format="percent"
                description="(Kills - Errors) / Total attacks"
                thresholds={{ green: 0.2, yellow: 0.1 }}
              />
              <MetricCard
                label="Kill %"
                value={metrics.killPct}
                format="percent"
                description="Kills / Total attacks"
                thresholds={{ green: 0.4, yellow: 0.25 }}
              />
              <MetricCard
                label="Pass+"
                value={metrics.passPos}
                format="percent"
                description="(Perfect + Good) / Total receptions"
                thresholds={{ green: 0.6, yellow: 0.45 }}
              />
              <MetricCard
                label="Srv Eff"
                value={metrics.srvEff}
                format="percent"
                description="(Aces - Errors) / Total serves"
                thresholds={{ green: 0.1, yellow: 0.0 }}
              />
              <MetricCard
                label="GPA"
                value={metrics.gpa}
                format="decimal"
                description="Weighted average: ++=3, +=2, -=1, /=0"
                thresholds={{ green: 2.0, yellow: 1.5 }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ---- Danger zone: delete team (admin only) ---- */}
      {isAdmin && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger zone</CardTitle>
            <CardDescription>
              Deleting the team will permanently remove every player, match,
              member and stat row. This cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {!confirmOpen ? (
              <Button
                variant="destructive"
                className="w-fit gap-2"
                onClick={() => setConfirmOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete team
              </Button>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-sm">
                  Type <strong>{team.name}</strong> to confirm deletion.
                </p>
                <Input
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  placeholder={team.name}
                />
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    disabled={deleting || confirmName.trim() !== team.name}
                    onClick={handleDelete}
                  >
                    {deleting ? 'Deleting…' : 'Confirm delete'}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setConfirmOpen(false)
                      setConfirmName('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
