'use client'

import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { NotionDataRow } from '@/types'
import {
  pointsByRotation,
  sideOutByRotation,
  overallSideOut,
} from '@/utils/metrics'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Info } from 'lucide-react'

function fmtPct(value: number | null): string {
  if (value === null) return '—'
  return `${(value * 100).toFixed(0)}%`
}

function fmtEff(value: number | null): string {
  if (value === null) return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${(value * 100).toFixed(0)}%`
}

export default function RotationAnalysisCard() {
  const {
    supabaseRows,
    supabaseSelectedPlayers,
    supabaseSelectedMatch,
    supabaseSelectedTeams,
  } = useSelector((state: RootState) => state.volley)

  const filteredRows: NotionDataRow[] = useMemo(
    () =>
      supabaseRows.filter(
        (row) =>
          supabaseSelectedPlayers.includes(row.name) &&
          (supabaseSelectedMatch === 'all' ||
            row.match === supabaseSelectedMatch) &&
          (supabaseSelectedTeams.length === 0 ||
            (row.teamId && supabaseSelectedTeams.includes(row.teamId))),
      ),
    [
      supabaseRows,
      supabaseSelectedPlayers,
      supabaseSelectedMatch,
      supabaseSelectedTeams,
    ],
  )

  const rotationStats = useMemo(
    () => pointsByRotation(filteredRows),
    [filteredRows],
  )
  const sideOutStats = useMemo(
    () => sideOutByRotation(filteredRows),
    [filteredRows],
  )
  const overall = useMemo(() => overallSideOut(filteredRows), [filteredRows])

  // ---- Rotation analysis only makes sense for a single match (lineups differ) ----
  if (supabaseSelectedMatch === 'all') {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-12 text-center text-muted-foreground">
        <p>
          Pick a single match in the filter to see its rotation breakdown and
          side-out percentages.
        </p>
      </div>
    )
  }

  const hasData = rotationStats.some((r) => r.actions > 0)
  if (!hasData) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-12 text-center text-muted-foreground">
        <p>
          No rotation data on this match yet. Older matches recorded before the
          state-tracking update don&apos;t carry rotation info.
        </p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full flex-1">
      <div className="space-y-4 p-4">
        {/* ---- Rotation breakdown ---- */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Rotation breakdown</CardTitle>
            <CardDescription>
              Points scored, errors and attack quality per rotation 1-6.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[420px] border-collapse text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Rot.</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                  <th className="px-3 py-2 text-right">Points</th>
                  <th className="px-3 py-2 text-right">Errors</th>
                  <th className="px-3 py-2 text-right">ATK Eff.</th>
                  <th className="px-3 py-2 text-right">Kill %</th>
                </tr>
              </thead>
              <tbody>
                {rotationStats.map((r) => (
                  <tr key={r.rotation} className="border-t">
                    <td className="px-3 py-2 font-medium">R{r.rotation}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {r.actions}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                      {r.pointsScored}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-red-600 dark:text-red-400">
                      {r.errors}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {fmtEff(r.attackEff)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {fmtPct(r.killPct)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* ---- Side-out per rotation ---- */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              Side-out per rotation
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="About side-out"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  Side-out = winning a point while receiving the opponent&apos;s
                  serve. Counts may slightly under-report rallies opponents
                  ended with their own errors (we don&apos;t record those).
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <CardDescription>
              Overall:{' '}
              <span className="font-semibold text-foreground">
                {fmtPct(overall.pct)}
              </span>{' '}
              ({overall.won}/{overall.attempts})
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[360px] border-collapse text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Rot.</th>
                  <th className="px-3 py-2 text-right">Attempts</th>
                  <th className="px-3 py-2 text-right">Won</th>
                  <th className="px-3 py-2 text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {sideOutStats.map((r) => (
                  <tr key={r.rotation} className="border-t">
                    <td className="px-3 py-2 font-medium">R{r.rotation}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {r.attempts}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {r.won}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold">
                      {fmtPct(r.pct)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}
