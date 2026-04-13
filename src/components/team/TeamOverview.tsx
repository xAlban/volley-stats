'use client'

import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { RootState } from '@/store/store'
import { updateTeamName } from '@/app/actions/supabase'
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
import { Copy, Check, BarChart3, Users, Trophy } from 'lucide-react'
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

export default function TeamOverview() {
  const { activeTeamId, userTeams, supabaseRows, supabaseAllMatches, teamRoster } =
    useSelector((state: RootState) => state.volley)
  const activeTeam = userTeams.find((t) => t.id === activeTeamId)
  const isAdmin = activeTeam?.role === 'admin'

  const [copied, setCopied] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<TeamNameValues>({
    resolver: zodResolver(teamNameSchema),
    defaultValues: { name: activeTeam?.name ?? '' },
  })

  // ---- Team-level metrics computed from all team rows ----
  const metrics = useMemo(() => {
    return {
      atkEff: attackEfficiency(supabaseRows),
      killPct: killPercent(supabaseRows),
      passPos: passPositivity(supabaseRows),
      srvEff: serveEfficiency(supabaseRows),
      gpa: weightedGPA(supabaseRows),
    }
  }, [supabaseRows])

  // ---- Find MVP: player with highest weighted GPA ----
  const mvp = useMemo(() => {
    const players = [...new Set(supabaseRows.map((r) => r.name))]
    let best: string | null = null
    let bestGpa = -Infinity
    for (const player of players) {
      const playerRows = supabaseRows.filter((r) => r.name === player)
      const gpa = weightedGPA(playerRows)
      if (gpa !== null && gpa > bestGpa) {
        bestGpa = gpa
        best = player
      }
    }
    return best
  }, [supabaseRows])

  async function onUpdateName(values: TeamNameValues) {
    if (!activeTeamId) return
    try {
      await updateTeamName(activeTeamId, values.name)
      setMessage('Team name updated')
      setError(null)
      setTimeout(() => setMessage(null), 3000)
    } catch (e) {
      setError((e as Error).message)
      setTimeout(() => setError(null), 5000)
    }
  }

  async function copyInviteCode() {
    if (activeTeam?.inviteCode) {
      await navigator.clipboard.writeText(activeTeam.inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!activeTeam) return null

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

      {/* ---- Team info ---- */}
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
              <p className="font-medium">{activeTeam.name}</p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Invite code:</span>
            <code className="rounded bg-muted px-2 py-1 text-sm">
              {activeTeam.inviteCode}
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

      {/* ---- Quick stats ---- */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Stats</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supabaseRows.length}</div>
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
            <div className="text-2xl font-bold">
              {supabaseAllMatches.length}
            </div>
            <p className="text-xs text-muted-foreground">recorded matches</p>
          </CardContent>
        </Card>
      </div>

      {/* ---- Team performance metrics ---- */}
      {supabaseRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
            <CardDescription>
              {mvp && `MVP: ${mvp}`}
            </CardDescription>
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
    </div>
  )
}
