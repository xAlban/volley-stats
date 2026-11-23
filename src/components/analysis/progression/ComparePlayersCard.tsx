'use client'

import {
  CartesianGrid,
  ComposedChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import ChartCard from '@/components/dashboard/ChartCard'
import { StatDef, formatStatValue } from '@/utils/statCatalog'
import { StatSeries } from '@/utils/progression'
import { yDomain } from '@/components/analysis/progression/StatSeriesCard'

export const COMPARE_COLORS = [
  'var(--chart-1)',
  'var(--chart-5)',
  'var(--chart-3)',
  'var(--chart-2)',
]

interface Row {
  key: string
  axis: string
  date: string
  opponent: string
  [k: string]: string | number | null
}

// ---- Tooltip: every compared player for the hovered match ----
function CompareTooltip({
  active,
  payload,
  def,
  players,
  series,
}: {
  active?: boolean
  payload?: { payload: Row }[]
  def: StatDef
  players: string[]
  series: StatSeries[]
}) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  const idx = Number(row.key)
  return (
    <div className="glass-strong max-w-64 rounded-xl px-3 py-2 text-xs">
      <div className="font-semibold">{row.opponent}</div>
      <div className="mb-1.5 text-muted-foreground">{row.date}</div>
      {players.map((name, i) => {
        const p = series[i].points[idx]
        return (
          <div key={name} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5">
              <span
                className="size-2 rounded-full"
                style={{ background: COMPARE_COLORS[i] }}
              />
              {name}
            </span>
            <span className="tabular-nums">
              {p.n === 0
                ? '—'
                : `${formatStatValue(def, p.value)} (${p.n}${p.enough ? '' : ', low'})`}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ---- One statistic, several players, same match timeline ----
export default function ComparePlayersCard({
  def,
  players,
  series,
}: {
  def: StatDef
  players: string[]
  series: StatSeries[]
}) {
  const base = series[0]?.points ?? []
  const data: Row[] = base.map((p, idx) => {
    const row: Row = {
      key: `${idx}`,
      axis: p.axisLabel,
      date: p.date,
      opponent: p.opponent,
    }
    series.forEach((s, i) => {
      const pt = s.points[idx]
      row[`p${i}`] = pt.enough ? pt.value : null
      row[`low${i}`] = !pt.enough && pt.value !== null ? pt.value : null
    })
    return row
  })

  return (
    <ChartCard
      title={`${def.label}: player comparison`}
      description={`${def.description}. Hollow points have fewer than ${def.minSample} ${def.noun} and are not connected.`}
    >
      {/* ---- Legend with each player's period average ---- */}
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
        {players.map((name, i) => (
          <span key={name} className="flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-full"
              style={{ background: COMPARE_COLORS[i] }}
            />
            {name}
            <span className="text-muted-foreground tabular-nums">
              {series[i].averageN > 0
                ? `avg ${formatStatValue(def, series[i].average)} · ${series[i].averageN} ${def.noun}`
                : `no ${def.noun} counted`}
            </span>
          </span>
        ))}
      </div>
      <ChartContainer config={{}} className="aspect-auto h-72 w-full">
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
            tickCount={5}
          />
          <Tooltip
            cursor={{ stroke: 'var(--border)' }}
            content={
              <CompareTooltip def={def} players={players} series={series} />
            }
          />
          {players.map((name, i) => [
            <Line
              key={`p${i}`}
              dataKey={`p${i}`}
              name={name}
              stroke={COMPARE_COLORS[i]}
              strokeWidth={2}
              dot={{ r: 3, fill: COMPARE_COLORS[i], strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              connectNulls
              isAnimationActive={false}
            />,
            <Line
              key={`low${i}`}
              dataKey={`low${i}`}
              stroke="transparent"
              dot={{
                r: 3,
                fill: 'var(--background)',
                stroke: COMPARE_COLORS[i],
                strokeWidth: 1.5,
              }}
              activeDot={false}
              isAnimationActive={false}
            />,
          ])}
        </ComposedChart>
      </ChartContainer>
    </ChartCard>
  )
}
