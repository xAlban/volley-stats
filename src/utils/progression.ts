import { MatchMeta, NotionDataRow, RallyRow } from '@/types'
import {
  STATS,
  StatDef,
  evaluateStat,
  formatStatDelta,
  formatStatValue,
  meanVar,
  zScore,
} from '@/utils/statCatalog'

// ---- Progression over time ----
// ---- Matches are ordered by date (same day: recording time). A match only
//      counts for a statistic when it has at least `minSample` actions;
//      lower-sample matches are still shown (hollow) but excluded from
//      averages, rolling lines and trends. ----

// ---- |z| ≥ 1.645 ≈ 90% confidence that a difference is not noise ----
export const SIGNIFICANT_Z = 1.645
const TREND_WINDOW = 3

export type Period = 5 | 10 | 'all'

// ---- Matches of one team that have data, oldest → newest, cut to period ----
export function matchTimeline(
  matches: MatchMeta[],
  teamId: string,
  rows: NotionDataRow[],
  period: Period,
): MatchMeta[] {
  const withData = new Set(
    rows.filter((r) => r.teamId === teamId).map((r) => r.matchId),
  )
  const list = matches.filter((m) => m.teamId === teamId && withData.has(m.id))
  return period === 'all' ? list : list.slice(-period)
}

// ---- Group rows / rallies by match id once ----
export function byMatch<T extends { matchId?: string }>(
  items: T[],
): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const it of items) {
    if (!it.matchId) continue
    const list = map.get(it.matchId)
    if (list) list.push(it)
    else map.set(it.matchId, [it])
  }
  return map
}

export interface SeriesPoint {
  matchId: string
  // ---- Short axis label (dd/mm) and full context for the tooltip ----
  axisLabel: string
  date: string
  opponent: string
  result: string | null
  value: number | null
  n: number
  detail: string
  // ---- Enough actions for this value to count ----
  enough: boolean
  // ---- Pooled average of the last up-to-3 counted matches ----
  rolling: number | null
}

export interface StatTrend {
  recent: number
  previous: number
  delta: number
  z: number | null
  significant: boolean
  // ---- Better / worse according to higherIsBetter ----
  direction: 'better' | 'worse' | 'flat'
  nRecent: number
  nPrevious: number
}

export interface StatSeries {
  def: StatDef
  points: SeriesPoint[]
  // ---- Pooled value over the whole period (reference line) ----
  average: number | null
  averageN: number
  latest: SeriesPoint | null
  trend: StatTrend | null
}

function axisLabel(date: string): string {
  const [, m, d] = date.split('-')
  return `${d}/${m}`
}

function resultLabel(m: MatchMeta): string | null {
  if (m.setsWon === null || m.setsLost === null) return null
  return `${m.setsWon}-${m.setsLost} ${m.setsWon > m.setsLost ? 'W' : 'L'}`
}

// ---- Build the per-match series for one statistic ----
export function buildSeries(
  def: StatDef,
  timeline: MatchMeta[],
  rowsByMatch: Map<string, NotionDataRow[]>,
  ralliesByMatch: Map<string, RallyRow[]>,
): StatSeries {
  const perMatch = timeline.map((m) =>
    evaluateStat(
      def,
      rowsByMatch.get(m.id) ?? [],
      ralliesByMatch.get(m.id) ?? [],
    ),
  )
  const counts = (i: number) =>
    perMatch[i].n > 0 && perMatch[i].n >= def.minSample

  const points: SeriesPoint[] = timeline.map((m, i) => {
    // ---- Rolling: pool the last up-to-3 counted matches up to here ----
    let rolling: number | null = null
    const window: number[] = []
    for (let j = i; j >= 0 && window.length < TREND_WINDOW; j--) {
      if (counts(j)) window.push(j)
    }
    if (window.length > 0 && counts(i)) {
      if (def.kind === 'mean') {
        rolling = meanVar(window.flatMap((j) => perMatch[j].samples)).mean
      } else {
        rolling =
          window.reduce((s, j) => s + (perMatch[j].value ?? 0), 0) /
          window.length
      }
    }
    return {
      matchId: m.id,
      axisLabel: axisLabel(m.matchDate),
      date: m.matchDate,
      opponent: m.opponentName,
      result: resultLabel(m),
      value: perMatch[i].n > 0 ? perMatch[i].value : null,
      n: perMatch[i].n,
      detail: perMatch[i].detail,
      enough: counts(i),
      rolling,
    }
  })

  const counted = perMatch.map((_, i) => i).filter(counts)

  // ---- Period average: pooled actions (mean) or average per match (sum) ----
  let average: number | null = null
  let averageN = 0
  if (counted.length > 0) {
    if (def.kind === 'mean') {
      const pooled = counted.flatMap((i) => perMatch[i].samples)
      average = meanVar(pooled).mean
      averageN = pooled.length
    } else {
      average =
        counted.reduce((s, i) => s + (perMatch[i].value ?? 0), 0) /
        counted.length
      averageN = counted.reduce((s, i) => s + perMatch[i].n, 0)
    }
  }

  const latestIdx = counted.length > 0 ? counted[counted.length - 1] : -1
  return {
    def,
    points,
    average,
    averageN,
    latest: latestIdx >= 0 ? points[latestIdx] : null,
    trend: computeTrend(
      def,
      counted.map((i) => perMatch[i]),
    ),
  }
}

// ---- Last 3 counted matches vs the 3 before ----
function computeTrend(
  def: StatDef,
  counted: ReturnType<typeof evaluateStat>[],
): StatTrend | null {
  if (counted.length < 4) return null
  const recentM = counted.slice(-TREND_WINDOW)
  const prevM = counted.slice(-2 * TREND_WINDOW, -TREND_WINDOW)
  if (prevM.length < 2) return null

  let recent: number
  let previous: number
  let z: number | null = null
  let nRecent: number
  let nPrevious: number
  if (def.kind === 'mean') {
    const a = recentM.flatMap((r) => r.samples)
    const b = prevM.flatMap((r) => r.samples)
    // ---- Both windows need a solid sample ----
    if (a.length < def.minSample * 2 || b.length < def.minSample * 2)
      return null
    recent = meanVar(a).mean
    previous = meanVar(b).mean
    z = zScore(a, b)
    nRecent = a.length
    nPrevious = b.length
  } else {
    // ---- Counts depend on playing time: descriptive only ----
    recent = recentM.reduce((s, r) => s + (r.value ?? 0), 0) / recentM.length
    previous = prevM.reduce((s, r) => s + (r.value ?? 0), 0) / prevM.length
    nRecent = recentM.length
    nPrevious = prevM.length
  }
  const delta = recent - previous
  const significant = z !== null && Math.abs(z) >= SIGNIFICANT_Z
  const improving = def.higherIsBetter ? delta > 0 : delta < 0
  return {
    recent,
    previous,
    delta,
    z,
    significant,
    direction: !significant ? 'flat' : improving ? 'better' : 'worse',
    nRecent,
    nPrevious,
  }
}

// ---- Training focus ----
export interface Insight {
  statId: string
  kind: 'trend' | 'vsTeam'
  good: boolean
  z: number
  title: string
  text: string
}

// ---- Rule-based, transparent insights: significant trends, and (player
//      scope) significant gaps vs the rest of the team over the period ----
export function trainingInsights(params: {
  stats: StatDef[]
  series: StatSeries[]
  // ---- Player scope: player's rows vs the other players' rows ----
  playerRows?: NotionDataRow[]
  othersRows?: NotionDataRow[]
}): { concerns: Insight[]; strengths: Insight[] } {
  const insights: Insight[] = []

  // ---- 1. Significant trends (last 3 counted matches vs 3 before) ----
  for (const s of params.series) {
    const t = s.trend
    if (!t || !t.significant || t.z === null) continue
    insights.push({
      statId: s.def.id,
      kind: 'trend',
      good: t.direction === 'better',
      z: Math.abs(t.z),
      title: `${s.def.label}: getting ${t.direction === 'better' ? 'better' : 'worse'}`,
      text: `${formatStatValue(s.def, t.previous)} → ${formatStatValue(s.def, t.recent)} (${formatStatDelta(s.def, t.delta)}), last 3 matches vs 3 before · ${t.nRecent} / ${t.nPrevious} ${s.def.noun}`,
    })
  }

  // ---- 2. Player vs rest of team, pooled over the period ----
  if (params.playerRows && params.othersRows) {
    for (const def of params.stats) {
      if (def.source !== 'actions' || def.kind !== 'mean') continue
      const mine = params.playerRows.filter(def.filter).map(def.score)
      const others = params.othersRows.filter(def.filter).map(def.score)
      if (mine.length < def.minSample * 2 || others.length < def.minSample * 2)
        continue
      const z = zScore(mine, others)
      if (z === null || Math.abs(z) < SIGNIFICANT_Z) continue
      const m = meanVar(mine).mean
      const o = meanVar(others).mean
      const better = def.higherIsBetter ? m > o : m < o
      insights.push({
        statId: def.id,
        kind: 'vsTeam',
        good: better,
        z: Math.abs(z),
        title: `${def.label}: ${better ? 'better' : 'worse'} than team`,
        text: `${formatStatValue(def, m)} vs team ${formatStatValue(def, o)} (${formatStatDelta(def, m - o)}) · ${mine.length} ${def.noun}`,
      })
    }
  }

  // ---- Strongest evidence first ----
  insights.sort((a, b) => b.z - a.z)
  return {
    concerns: insights.filter((i) => !i.good).slice(0, 4),
    strengths: insights.filter((i) => i.good).slice(0, 3),
  }
}

// ---- Stats available for a scope ----
export function statsForScope(scope: 'team' | 'player'): StatDef[] {
  return STATS.filter((s) => scope === 'team' || s.scope === 'both')
}

// ---- Default selection per scope / roster position ----
export function defaultStatIds(
  scope: 'team' | 'player',
  position: string | null,
): string[] {
  if (scope === 'team')
    return ['sideout', 'breakpoint', 'attack_eff', 'rec_rating', 'serve_eff']
  switch (position) {
    case 'L':
    case 'DS':
      return ['rec_rating', 'rec_perfect', 'def_positive', 'rec_error']
    case 'MB':
      return ['attack_eff', 'attack_kill', 'block_positive', 'serve_eff']
    case 'S':
      return ['set_positive', 'set_error', 'serve_eff', 'def_positive']
    default:
      return ['attack_eff', 'attack_kill', 'rec_rating', 'serve_eff']
  }
}
