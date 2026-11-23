import { DataType, NotionDataRow, NotionNotation, RallyRow } from '@/types'

// ---- Statistic catalogue: single definition per statistic ----
// ---- Rate / rating statistics are the MEAN of a per-action score
//      (e.g. attack efficiency: kill = +1, error = -1, other = 0). This
//      makes pooling across matches exact (pool actions, not percentages)
//      and gives a variance for significance checks. Count statistics are
//      per-match SUMS and are only described, never tested. ----

export type StatGroup =
  | 'attack'
  | 'serve'
  | 'reception'
  | 'defense'
  | 'block'
  | 'set'
  | 'overall'
  | 'team'

export type StatUnit = 'pct' | 'signedPct' | 'rating' | 'count'

export const STAT_GROUP_LABELS: Record<StatGroup, string> = {
  attack: 'Attack',
  serve: 'Serve',
  reception: 'Reception',
  defense: 'Defense',
  block: 'Block',
  set: 'Set',
  overall: 'Overall',
  team: 'Points',
}

interface StatBase {
  id: string
  label: string
  group: StatGroup
  unit: StatUnit
  higherIsBetter: boolean
  // ---- Minimum actions/rallies in a match before the value counts ----
  minSample: number
  // ---- Plural noun for the counted things ("attacks", "rallies") ----
  noun: string
  description: string
  // ---- 'team' = needs rally data, only meaningful for the whole team ----
  scope: 'both' | 'team'
  signed?: boolean
}

export interface ActionStat extends StatBase {
  source: 'actions'
  kind: 'mean' | 'sum'
  filter: (r: NotionDataRow) => boolean
  score: (r: NotionDataRow) => number
}

export interface RallyStat extends StatBase {
  source: 'rallies'
  kind: 'mean' | 'sum'
  filter: (r: RallyRow) => boolean
  score: (r: RallyRow) => number
}

export type StatDef = ActionStat | RallyStat

// ---- Score helpers ----
const ofType = (t: DataType) => (r: NotionDataRow) => r.type === t
const is = (q: NotionNotation) => (r: NotionDataRow) => (r.value === q ? 1 : 0)
const positive = (r: NotionDataRow) =>
  r.value === '++' || r.value === '+' ? 1 : 0
const efficiency = (r: NotionDataRow) =>
  r.value === '++' ? 1 : r.value === '/' ? -1 : 0
// ---- Standard 0-3 pass rating ----
const PASS_POINTS: Record<NotionNotation, number> = {
  '++': 3,
  '+': 2,
  '-': 1,
  '/': 0,
}
// ---- Existing GPA weights (all skills) ----
const GPA_POINTS = PASS_POINTS
const SCORING_TYPES: DataType[] = ['attaque', 'service', 'bloc']

export const STATS: StatDef[] = [
  // ---- Attack ----
  {
    id: 'attack_eff',
    label: 'Attack efficiency',
    group: 'attack',
    unit: 'signedPct',
    higherIsBetter: true,
    minSample: 5,
    noun: 'attacks',
    description: '(kills − errors) / attacks',
    scope: 'both',
    source: 'actions',
    kind: 'mean',
    filter: ofType('attaque'),
    score: efficiency,
  },
  {
    id: 'attack_kill',
    label: 'Kill %',
    group: 'attack',
    unit: 'pct',
    higherIsBetter: true,
    minSample: 5,
    noun: 'attacks',
    description: 'kills / attacks',
    scope: 'both',
    source: 'actions',
    kind: 'mean',
    filter: ofType('attaque'),
    score: is('++'),
  },
  {
    id: 'attack_error',
    label: 'Attack error %',
    group: 'attack',
    unit: 'pct',
    higherIsBetter: false,
    minSample: 5,
    noun: 'attacks',
    description: 'errors / attacks',
    scope: 'both',
    source: 'actions',
    kind: 'mean',
    filter: ofType('attaque'),
    score: is('/'),
  },
  // ---- Serve ----
  {
    id: 'serve_eff',
    label: 'Serve efficiency',
    group: 'serve',
    unit: 'signedPct',
    higherIsBetter: true,
    minSample: 5,
    noun: 'serves',
    description: '(aces − errors) / serves',
    scope: 'both',
    source: 'actions',
    kind: 'mean',
    filter: ofType('service'),
    score: efficiency,
  },
  {
    id: 'serve_ace',
    label: 'Ace %',
    group: 'serve',
    unit: 'pct',
    higherIsBetter: true,
    minSample: 5,
    noun: 'serves',
    description: 'aces / serves',
    scope: 'both',
    source: 'actions',
    kind: 'mean',
    filter: ofType('service'),
    score: is('++'),
  },
  {
    id: 'serve_error',
    label: 'Serve error %',
    group: 'serve',
    unit: 'pct',
    higherIsBetter: false,
    minSample: 5,
    noun: 'serves',
    description: 'errors / serves',
    scope: 'both',
    source: 'actions',
    kind: 'mean',
    filter: ofType('service'),
    score: is('/'),
  },
  // ---- Reception ----
  {
    id: 'rec_rating',
    label: 'Pass rating',
    group: 'reception',
    unit: 'rating',
    higherIsBetter: true,
    minSample: 5,
    noun: 'receptions',
    description: 'average on a 0–3 scale (++ 3, + 2, - 1, / 0)',
    scope: 'both',
    source: 'actions',
    kind: 'mean',
    filter: ofType('réception'),
    score: (r) => PASS_POINTS[r.value],
  },
  {
    id: 'rec_positive',
    label: 'Positive reception %',
    group: 'reception',
    unit: 'pct',
    higherIsBetter: true,
    minSample: 5,
    noun: 'receptions',
    description: '(++ and +) / receptions',
    scope: 'both',
    source: 'actions',
    kind: 'mean',
    filter: ofType('réception'),
    score: positive,
  },
  {
    id: 'rec_perfect',
    label: 'Perfect reception %',
    group: 'reception',
    unit: 'pct',
    higherIsBetter: true,
    minSample: 5,
    noun: 'receptions',
    description: '++ / receptions',
    scope: 'both',
    source: 'actions',
    kind: 'mean',
    filter: ofType('réception'),
    score: is('++'),
  },
  {
    id: 'rec_error',
    label: 'Reception error %',
    group: 'reception',
    unit: 'pct',
    higherIsBetter: false,
    minSample: 5,
    noun: 'receptions',
    description: 'errors / receptions',
    scope: 'both',
    source: 'actions',
    kind: 'mean',
    filter: ofType('réception'),
    score: is('/'),
  },
  // ---- Defense ----
  {
    id: 'def_positive',
    label: 'Positive defense %',
    group: 'defense',
    unit: 'pct',
    higherIsBetter: true,
    minSample: 4,
    noun: 'digs',
    description: '(++ and +) / defensive actions',
    scope: 'both',
    source: 'actions',
    kind: 'mean',
    filter: ofType('défense'),
    score: positive,
  },
  {
    id: 'def_error',
    label: 'Defense error %',
    group: 'defense',
    unit: 'pct',
    higherIsBetter: false,
    minSample: 4,
    noun: 'digs',
    description: 'errors / defensive actions',
    scope: 'both',
    source: 'actions',
    kind: 'mean',
    filter: ofType('défense'),
    score: is('/'),
  },
  // ---- Block ----
  {
    id: 'block_positive',
    label: 'Positive block %',
    group: 'block',
    unit: 'pct',
    higherIsBetter: true,
    minSample: 3,
    noun: 'blocks',
    description: '(kill blocks and touches) / block actions',
    scope: 'both',
    source: 'actions',
    kind: 'mean',
    filter: ofType('bloc'),
    score: positive,
  },
  {
    id: 'block_points',
    label: 'Block points',
    group: 'block',
    unit: 'count',
    higherIsBetter: true,
    minSample: 0,
    noun: 'blocks',
    description: 'kill blocks per match (depends on playing time)',
    scope: 'both',
    source: 'actions',
    kind: 'sum',
    filter: ofType('bloc'),
    score: is('++'),
  },
  // ---- Set ----
  {
    id: 'set_positive',
    label: 'Positive set %',
    group: 'set',
    unit: 'pct',
    higherIsBetter: true,
    minSample: 5,
    noun: 'sets',
    description: '(++ and +) / sets',
    scope: 'both',
    source: 'actions',
    kind: 'mean',
    filter: ofType('passe'),
    score: positive,
  },
  {
    id: 'set_error',
    label: 'Set error %',
    group: 'set',
    unit: 'pct',
    higherIsBetter: false,
    minSample: 5,
    noun: 'sets',
    description: 'errors / sets',
    scope: 'both',
    source: 'actions',
    kind: 'mean',
    filter: ofType('passe'),
    score: is('/'),
  },
  // ---- Overall ----
  {
    id: 'gpa',
    label: 'GPA',
    group: 'overall',
    unit: 'rating',
    higherIsBetter: true,
    minSample: 10,
    noun: 'actions',
    description: 'average action quality on a 0–3 scale (all skills)',
    scope: 'both',
    source: 'actions',
    kind: 'mean',
    filter: () => true,
    score: (r) => GPA_POINTS[r.value],
  },
  {
    id: 'plus_minus',
    label: '+/−',
    group: 'overall',
    unit: 'count',
    higherIsBetter: true,
    minSample: 0,
    noun: 'actions',
    description:
      'points won (++ on attack, serve, block) minus errors, per match',
    scope: 'both',
    signed: true,
    source: 'actions',
    kind: 'sum',
    filter: () => true,
    score: (r) =>
      (r.value === '++' && SCORING_TYPES.includes(r.type) ? 1 : 0) -
      (r.value === '/' ? 1 : 0),
  },
  {
    id: 'errors',
    label: 'Errors',
    group: 'overall',
    unit: 'count',
    higherIsBetter: false,
    minSample: 0,
    noun: 'actions',
    description: 'errors (/) on any skill, per match',
    scope: 'both',
    source: 'actions',
    kind: 'sum',
    filter: () => true,
    score: is('/'),
  },
  // ---- Team (needs rally data: matches recorded with the rally log) ----
  {
    id: 'sideout',
    label: 'Side-out %',
    group: 'team',
    unit: 'pct',
    higherIsBetter: true,
    minSample: 8,
    noun: 'receiving rallies',
    description: 'points won while receiving',
    scope: 'team',
    source: 'rallies',
    kind: 'mean',
    filter: (r) => !r.isTeamServing,
    score: (r) => (r.winner === 'team' ? 1 : 0),
  },
  {
    id: 'breakpoint',
    label: 'Break-point %',
    group: 'team',
    unit: 'pct',
    higherIsBetter: true,
    minSample: 8,
    noun: 'serving rallies',
    description: 'points won while serving',
    scope: 'team',
    source: 'rallies',
    kind: 'mean',
    filter: (r) => r.isTeamServing,
    score: (r) => (r.winner === 'team' ? 1 : 0),
  },
  {
    id: 'opp_errors',
    label: 'Points from opponent errors',
    group: 'team',
    unit: 'count',
    higherIsBetter: true,
    minSample: 0,
    noun: 'rallies',
    description: 'points added manually on the scoreboard for us',
    scope: 'team',
    source: 'rallies',
    kind: 'sum',
    filter: (r) => r.source === 'manual',
    score: (r) => (r.winner === 'team' ? 1 : 0),
  },
]

export const STAT_BY_ID: Record<string, StatDef> = Object.fromEntries(
  STATS.map((s) => [s.id, s]),
)

// ---- Result of evaluating one statistic on a set of actions/rallies ----
export interface StatResult {
  value: number | null
  // ---- Number of counted actions / rallies ----
  n: number
  // ---- Per-action scores (mean stats), kept for pooling / tests ----
  samples: number[]
  // ---- Human readable basis, e.g. "7 ++ · 4 + · 2 - · 2 / of 15 attacks" ----
  detail: string
}

// ---- Quality breakdown of the counted actions ----
function qualityDetail(rows: NotionDataRow[], noun: string): string {
  const c: Record<NotionNotation, number> = { '++': 0, '+': 0, '-': 0, '/': 0 }
  for (const r of rows) c[r.value]++
  return `${c['++']} ++ · ${c['+']} + · ${c['-']} - · ${c['/']} / of ${rows.length} ${noun}`
}

export function evaluateStat(
  def: StatDef,
  rows: NotionDataRow[],
  rallies: RallyRow[],
): StatResult {
  let samples: number[]
  let detail: string
  if (def.source === 'actions') {
    const counted = rows.filter(def.filter)
    samples = counted.map(def.score)
    detail = qualityDetail(counted, def.noun)
  } else {
    const counted = rallies.filter(def.filter)
    samples = counted.map(def.score)
    const won = counted.filter((r) => r.winner === 'team').length
    detail =
      def.kind === 'mean'
        ? `${won} won of ${counted.length} ${def.noun}`
        : `${samples.reduce((a, b) => a + b, 0)} points`
  }
  const n = samples.length
  const total = samples.reduce((a, b) => a + b, 0)
  if (def.kind === 'sum') return { value: total, n, samples, detail }
  return {
    value: n === 0 ? null : total / n,
    n,
    samples,
    detail,
  }
}

// ---- Mean / variance of per-action scores ----
export function meanVar(samples: number[]): { mean: number; variance: number } {
  const n = samples.length
  if (n === 0) return { mean: 0, variance: 0 }
  const mean = samples.reduce((a, b) => a + b, 0) / n
  const variance =
    n < 2 ? 0 : samples.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1)
  return { mean, variance }
}

// ---- Two-sample z for a difference of means (Welch-style SE) ----
export function zScore(a: number[], b: number[]): number | null {
  if (a.length < 2 || b.length < 2) return null
  const A = meanVar(a)
  const B = meanVar(b)
  const se = Math.sqrt(A.variance / a.length + B.variance / b.length)
  if (se === 0) return A.mean === B.mean ? 0 : null
  return (A.mean - B.mean) / se
}

// ---- Display formatting ----
export function formatStatValue(def: StatDef, v: number | null): string {
  if (v === null || Number.isNaN(v)) return '—'
  switch (def.unit) {
    case 'pct':
      return `${Math.round(v * 100)}%`
    case 'signedPct': {
      const p = Math.round(v * 100)
      return `${p > 0 ? '+' : ''}${p}%`
    }
    case 'rating':
      return v.toFixed(2)
    case 'count': {
      const r = Math.round(v * 10) / 10
      return def.signed && r > 0 ? `+${r}` : `${r}`
    }
  }
}

// ---- Difference formatting: percentage points for rates ----
export function formatStatDelta(def: StatDef, d: number): string {
  const sign = d > 0 ? '+' : d < 0 ? '−' : '±'
  const a = Math.abs(d)
  switch (def.unit) {
    case 'pct':
    case 'signedPct':
      return `${sign}${Math.round(a * 100)} pts`
    case 'rating':
      return `${sign}${a.toFixed(2)}`
    case 'count':
      return `${sign}${(Math.round(a * 10) / 10).toString()} /match`
  }
}
