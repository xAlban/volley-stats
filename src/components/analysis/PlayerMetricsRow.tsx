'use client'

import { useMemo } from 'react'
import { NotionDataRow } from '@/types'
import {
  attackEfficiency,
  killPercent,
  passPositivity,
  passPerfect,
  serveEfficiency,
  plusMinus,
  weightedGPA,
} from '@/utils/metrics'
import MetricCard from '@/components/analysis/MetricCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PlayerMetricsRowProps {
  playerName: string
  rows: NotionDataRow[]
}

export default function PlayerMetricsRow({
  playerName,
  rows,
}: PlayerMetricsRowProps) {
  // ---- Compute all 7 metrics from player rows ----
  const metrics = useMemo(
    () => ({
      atkEff: attackEfficiency(rows),
      kill: killPercent(rows),
      passPos: passPositivity(rows),
      passPerf: passPerfect(rows),
      srvEff: serveEfficiency(rows),
      pm: plusMinus(rows),
      gpa: weightedGPA(rows),
    }),
    [rows],
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{playerName}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        <MetricCard
          label="ATK Eff."
          value={metrics.atkEff}
          format="percent"
          description="(Kills − Errors − Bad) / Total attacks"
          thresholds={{ green: 0.3, yellow: 0.15 }}
        />
        <MetricCard
          label="Kill %"
          value={metrics.kill}
          format="percent"
          description="Kills / Total attacks"
          thresholds={{ green: 0.4, yellow: 0.25 }}
        />
        <MetricCard
          label="Pass Pos."
          value={metrics.passPos}
          format="percent"
          description="(Perfect + Good) / Total receptions"
          thresholds={{ green: 0.6, yellow: 0.4 }}
        />
        <MetricCard
          label="Pass Perf."
          value={metrics.passPerf}
          format="percent"
          description="Perfect passes / Total receptions"
          thresholds={{ green: 0.3, yellow: 0.15 }}
        />
        <MetricCard
          label="Serve Eff."
          value={metrics.srvEff}
          format="percent"
          description="(Aces − Errors) / Total serves"
          thresholds={{ green: 0.1, yellow: 0.0 }}
        />
        <MetricCard
          label="+/−"
          value={metrics.pm}
          format="integer"
          description="Total ++ (attack, serve, block) minus total errors (/) across all skills"
        />
        <MetricCard
          label="GPA"
          value={metrics.gpa}
          format="decimal"
          description="Weighted average: ++ = 3, + = 2, − = 1, / = 0 across all actions"
          thresholds={{ green: 2.0, yellow: 1.0 }}
        />
      </CardContent>
    </Card>
  )
}
