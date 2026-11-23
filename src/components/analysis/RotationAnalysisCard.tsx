'use client'

import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { NotionDataRow, RallyRow } from '@/types'
import {
  pointsByRotation,
  sideOutByRotation,
  breakPointByRotation,
  overallRate,
  manualPointsCount,
  layoutByRotation,
  RotationLayout,
  RotationRate,
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

// ---- Mini court for one rotation: front row on top (net side) ----
const COURT_ROWS: number[][] = [
  [4, 3, 2],
  [5, 6, 1],
]

function RotationCourt({
  layout,
  sideOut,
}: {
  layout: RotationLayout
  sideOut: RotationRate | undefined
}) {
  return (
    <div className="rounded-lg border p-2">
      <div className="mb-2 flex items-baseline justify-between px-1">
        <span className="text-sm font-semibold">S{layout.rotation}</span>
        <span className="text-xs text-muted-foreground">
          Side-out{' '}
          <span className="font-semibold text-foreground">
            {fmtPct(sideOut?.pct ?? null)}
          </span>{' '}
          ({sideOut?.won ?? 0}/{sideOut?.attempts ?? 0})
        </span>
      </div>
      {/* ---- Net ---- */}
      <div className="h-1 rounded-t bg-foreground/60" />
      <div className="grid grid-rows-2 gap-1 rounded-b bg-muted/50 p-1">
        {COURT_ROWS.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className={`grid grid-cols-3 gap-1 ${rowIdx === 0 ? 'border-b border-dashed border-muted-foreground/40 pb-1' : ''}`}
          >
            {row.map((pos) => {
              const occupants = layout.spots[pos - 1]
              const isSetterSpot = pos === layout.rotation
              return (
                <div
                  key={pos}
                  className={`min-h-14 rounded border bg-background px-1 py-0.5 ${isSetterSpot ? 'border-primary' : ''}`}
                >
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>P{pos}</span>
                    {isSetterSpot && (
                      <span className="font-semibold text-primary">S</span>
                    )}
                  </div>
                  {occupants.length === 0 ? (
                    <div className="text-[11px] text-muted-foreground">—</div>
                  ) : (
                    occupants.slice(0, 3).map((o) => (
                      <div
                        key={o.name}
                        className={`flex justify-between gap-1 text-[11px] leading-tight ${o.libero ? 'text-orange-600 dark:text-orange-400' : ''}`}
                      >
                        <span className="truncate">
                          {o.name}
                          {o.libero ? ' (L)' : ''}
                        </span>
                        {occupants.length > 1 && (
                          <span className="tabular-nums text-muted-foreground">
                            {(o.share * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
      <div className="mt-1 px-1 text-[10px] text-muted-foreground">
        {layout.rallies} rallies
      </div>
    </div>
  )
}

export default function RotationAnalysisCard() {
  const {
    supabaseRows,
    supabaseRallies,
    supabaseSelectedPlayers,
    supabaseSelectedMatch,
    supabaseSelectedTeams,
  } = useSelector((state: RootState) => state.volley)

  // ---- Match/team filter only: side-out and layouts need every player's
  //      actions (the point may be scored by a deselected player) ----
  const matchRows: NotionDataRow[] = useMemo(
    () =>
      supabaseRows.filter(
        (row) =>
          (supabaseSelectedMatch === 'all' ||
            row.match === supabaseSelectedMatch) &&
          (supabaseSelectedTeams.length === 0 ||
            (row.teamId && supabaseSelectedTeams.includes(row.teamId))),
      ),
    [supabaseRows, supabaseSelectedMatch, supabaseSelectedTeams],
  )
  // ---- Player filter applies to the per-player breakdown only ----
  const filteredRows: NotionDataRow[] = useMemo(
    () => matchRows.filter((row) => supabaseSelectedPlayers.includes(row.name)),
    [matchRows, supabaseSelectedPlayers],
  )

  const rotationStats = useMemo(
    () => pointsByRotation(filteredRows),
    [filteredRows],
  )
  // ---- Rallies (one per point, incl. manual points) for the same match/team
  //      selection: exact side-out / break-point and court layouts ----
  const rallies: RallyRow[] = useMemo(
    () =>
      supabaseRallies.filter(
        (r) =>
          (supabaseSelectedMatch === 'all' ||
            r.match === supabaseSelectedMatch) &&
          (supabaseSelectedTeams.length === 0 ||
            supabaseSelectedTeams.includes(r.teamId)),
      ),
    [supabaseRallies, supabaseSelectedMatch, supabaseSelectedTeams],
  )
  const sideOutStats = useMemo(() => sideOutByRotation(rallies), [rallies])
  const breakPointStats = useMemo(
    () => breakPointByRotation(rallies),
    [rallies],
  )
  const overallSO = useMemo(() => overallRate(sideOutStats), [sideOutStats])
  const overallBP = useMemo(
    () => overallRate(breakPointStats),
    [breakPointStats],
  )
  const manual = useMemo(() => manualPointsCount(rallies), [rallies])
  const layouts = useMemo(() => layoutByRotation(rallies), [rallies])
  // ---- Legacy actions (no setter rotation) are left out of this tab ----
  const legacyCount = useMemo(
    () => matchRows.filter((r) => r.setterPosition === undefined).length,
    [matchRows],
  )

  const hasData =
    rallies.length > 0 || matchRows.some((r) => r.setterPosition !== undefined)
  if (!hasData) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-12 text-center text-muted-foreground">
        <p>
          No setter-based rotation data for this selection yet. Legacy matches
          (recorded before rotation tracking by setter) are not included here,
          but still count in the player stats.
        </p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full flex-1">
      <div className="space-y-4 p-4">
        {legacyCount > 0 && (
          <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
            {legacyCount} actions from legacy matches are not included in the
            rotation analysis.
          </p>
        )}

        {/* ---- Court layout per rotation ---- */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Lineup per rotation</CardTitle>
            <CardDescription>
              Who stood where in each rotation (S1 = setter at P1). Several
              names on a spot show the share of rallies each player was there.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {layouts.map((layout) => (
              <RotationCourt
                key={layout.rotation}
                layout={layout}
                sideOut={sideOutStats.find(
                  (r) => r.rotation === layout.rotation,
                )}
              />
            ))}
          </CardContent>
        </Card>

        {/* ---- Rotation breakdown ---- */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Rotation breakdown</CardTitle>
            <CardDescription>
              Points scored, errors and attack quality per setter rotation
              (selected players).
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
                    <td className="px-3 py-2 font-medium">S{r.rotation}</td>
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

        {/* ---- Side-out & break-point per rotation (from rallies) ---- */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              Side-out &amp; break-point
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="About side-out and break-point"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  Side-out = points won while receiving. Break-point = points
                  won while serving. Based on every point played, including
                  points added manually on the scoreboard.
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <CardDescription>
              Side-out{' '}
              <span className="font-semibold text-foreground">
                {fmtPct(overallSO.pct)}
              </span>{' '}
              ({overallSO.won}/{overallSO.attempts}) · Break-point{' '}
              <span className="font-semibold text-foreground">
                {fmtPct(overallBP.pct)}
              </span>{' '}
              ({overallBP.won}/{overallBP.attempts})
              {manual.team + manual.opponent > 0 && (
                <>
                  <br />
                  Manual points: {manual.team} for us, {manual.opponent} for the
                  opponent
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[360px] border-collapse text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Rot.</th>
                  <th className="px-3 py-2 text-right">Side-out</th>
                  <th className="px-3 py-2 text-right">%</th>
                  <th className="px-3 py-2 text-right">Break-pt</th>
                  <th className="px-3 py-2 text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {sideOutStats.map((so) => {
                  const bp = breakPointStats.find(
                    (r) => r.rotation === so.rotation,
                  )
                  return (
                    <tr key={so.rotation} className="border-t">
                      <td className="px-3 py-2 font-medium">S{so.rotation}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {so.won}/{so.attempts}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums">
                        {fmtPct(so.pct)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {bp?.won ?? 0}/{bp?.attempts ?? 0}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums">
                        {fmtPct(bp?.pct ?? null)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}
