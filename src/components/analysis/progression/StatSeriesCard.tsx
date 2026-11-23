'use client'

import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import ChartCard from '@/components/dashboard/ChartCard'
import { StatDef, formatStatValue } from '@/utils/statCatalog'
import { SeriesPoint, StatSeries } from '@/utils/progression'
import TrendBadge from '@/components/analysis/progression/TrendBadge'

// ---- One colour per skill group (theme chart tokens) ----
export const GROUP_COLOR: Record<StatDef['group'], string> = {
  attack: 'var(--chart-1)',
  serve: 'var(--chart-2)',
  reception: 'var(--chart-3)',
  defense: 'var(--chart-5)',
  block: 'var(--chart-4)',
  set: 'var(--chart-6)',
  overall: 'var(--chart-1)',
  team: 'var(--chart-2)',
}

// ---- Y domain per unit: percentages from 0, efficiencies around 0 ----
export function yDomain(
  def: StatDef,
): [number | ((v: number) => number), number | ((v: number) => number)] {
  switch (def.unit) {
    case 'pct':
      return [0, (max) => Math.min(1, Math.ceil((max + 0.05) * 10) / 10)]
    case 'signedPct':
      return [
        (min) => Math.min(0, Math.floor((min - 0.05) * 10) / 10),
        (max) => Math.max(0.1, Math.ceil((max + 0.05) * 10) / 10),
      ]
    case 'rating':
      return [0, 3]
    case 'count':
      return [
        (min) => Math.min(0, Math.floor(min)),
        (max) => Math.ceil(max + 1),
      ]
  }
}

// ---- Chart rows: counted values vs low-sample values as separate keys ----
export function chartRows(points: SeriesPoint[]) {
  return points.map((p, i) => ({
    key: `${i}`,
    axis: p.axisLabel,
    value: p.enough ? p.value : null,
    low: !p.enough && p.value !== null ? p.value : null,
    rolling: p.rolling,
    point: p,
  }))
}

// ---- Tooltip: match context + exact basis of the value ----
function PointTooltip({
  active,
  payload,
  def,
  showRolling,
}: {
  active?: boolean
  payload?: { payload: ReturnType<typeof chartRows>[number] }[]
  def: StatDef
  showRolling: boolean
}) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload.point
  return (
    <div className="glass-strong max-w-64 rounded-xl px-3 py-2 text-xs">
      <div className="font-semibold text-foreground">{p.opponent}</div>
      <div className="text-muted-foreground">
        {p.date}
        {p.result ? ` · ${p.result}` : ''}
      </div>
      <div className="mt-1.5 text-base font-semibold tabular-nums">
        {p.n === 0 ? 'No data' : formatStatValue(def, p.value)}
      </div>
      {p.n > 0 && <div className="text-muted-foreground">{p.detail}</div>}
      {p.n > 0 && !p.enough && (
        <div className="mt-1 text-warning">
          Low sample (under {def.minSample} {def.noun}): not counted in averages
        </div>
      )}
      {showRolling && p.rolling !== null && (
        <div className="mt-1 text-muted-foreground">
          3-match average: {formatStatValue(def, p.rolling)}
        </div>
      )}
    </div>
  )
}

interface StatSeriesCardProps {
  series: StatSeries
  showRolling: boolean
}

// ---- Small multiple: one statistic over the match timeline ----
export default function StatSeriesCard({
  series,
  showRolling,
}: StatSeriesCardProps) {
  const { def, points, average, averageN, latest, trend } = series
  const color = GROUP_COLOR[def.group]
  const data = chartRows(points)
  const hasData = points.some((p) => p.value !== null)

  return (
    <ChartCard
      title={def.label}
      description={def.description}
      actions={<TrendBadge def={def} trend={trend} />}
    >
      {/* ---- Latest / average summary ---- */}
      <div className="mb-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
        <span>
          Latest{' '}
          <span className="text-sm font-semibold text-foreground tabular-nums">
            {formatStatValue(def, latest?.value ?? null)}
          </span>
        </span>
        <span>
          Average{' '}
          <span className="text-sm font-semibold text-foreground tabular-nums">
            {formatStatValue(def, average)}
          </span>{' '}
          {averageN > 0 && `(${averageN} ${def.noun})`}
        </span>
      </div>

      {!hasData ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No {def.noun} recorded in this period.
        </p>
      ) : (
        <ChartContainer
          config={{ value: { label: def.label, color } }}
          className="aspect-auto h-44 w-full"
        >
          <ComposedChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="key"
              tickFormatter={(k: string) => data[Number(k)]?.axis ?? ''}
              axisLine={false}
              tickLine={false}
              tickMargin={6}
              minTickGap={8}
            />
            <YAxis
              domain={yDomain(def)}
              tickFormatter={(v: number) => formatStatValue(def, v)}
              axisLine={false}
              tickLine={false}
              width={44}
              tickCount={4}
            />
            {average !== null && (
              <ReferenceLine
                y={average}
                stroke="var(--muted-foreground)"
                strokeDasharray="4 4"
                strokeOpacity={0.6}
              />
            )}
            {def.unit === 'signedPct' && (
              <ReferenceLine y={0} stroke="var(--border)" />
            )}
            <Tooltip
              cursor={{ stroke: 'var(--border)' }}
              content={<PointTooltip def={def} showRolling={showRolling} />}
            />
            {showRolling && (
              <Line
                dataKey="rolling"
                stroke={color}
                strokeOpacity={0.45}
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
                activeDot={false}
                connectNulls
                isAnimationActive={false}
              />
            )}
            <Line
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ r: 3.5, fill: color, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              connectNulls
              isAnimationActive={false}
            />
            {/* ---- Low-sample matches: hollow, not connected ---- */}
            <Line
              dataKey="low"
              stroke="transparent"
              dot={{
                r: 3.5,
                fill: 'var(--background)',
                stroke: color,
                strokeWidth: 1.5,
              }}
              activeDot={{ r: 5, fill: 'var(--background)', stroke: color }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ChartContainer>
      )}
    </ChartCard>
  )
}
