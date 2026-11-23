import {
  NotionDataRow,
  NotionNotation,
  DataType,
  DataTypeValues,
  RallyRow,
} from '@/types'

function filterByType(rows: NotionDataRow[], type: DataType): NotionDataRow[] {
  return rows.filter((r) => r.type === type)
}

function countQuality(rows: NotionDataRow[], quality: NotionNotation): number {
  return rows.filter((r) => r.value === quality).length
}

// ---- Attack Efficiency: (++ - /) / total, attack rows only ----
export function attackEfficiency(rows: NotionDataRow[]): number | null {
  const atk = filterByType(rows, DataTypeValues.ATTACK)
  if (atk.length === 0) return null
  const kills = countQuality(atk, '++')
  const errors = countQuality(atk, '/')
  return (kills - errors) / atk.length
}

// ---- Kill %: ++ / total, attack rows only ----
export function killPercent(rows: NotionDataRow[]): number | null {
  const atk = filterByType(rows, DataTypeValues.ATTACK)
  if (atk.length === 0) return null
  return countQuality(atk, '++') / atk.length
}

// ---- Pass Positivity %: (++ + +) / total, reception rows only ----
export function passPositivity(rows: NotionDataRow[]): number | null {
  const rec = filterByType(rows, DataTypeValues.RECEP)
  if (rec.length === 0) return null
  const excellent = countQuality(rec, '++')
  const good = countQuality(rec, '+')
  return (excellent + good) / rec.length
}

// ---- Pass Perfect %: ++ / total, reception rows only ----
export function passPerfect(rows: NotionDataRow[]): number | null {
  const rec = filterByType(rows, DataTypeValues.RECEP)
  if (rec.length === 0) return null
  return countQuality(rec, '++') / rec.length
}

// ---- Serve Efficiency: (++ - /) / total, serve rows only ----
export function serveEfficiency(rows: NotionDataRow[]): number | null {
  const srv = filterByType(rows, DataTypeValues.SERVE)
  if (srv.length === 0) return null
  const aces = countQuality(srv, '++')
  const errors = countQuality(srv, '/')
  return (aces - errors) / srv.length
}

// ---- Plus/Minus: ++ from attack/serve/block only, minus / from all skills ----
export function plusMinus(rows: NotionDataRow[]): number | null {
  if (rows.length === 0) return null
  const plusTypes: DataType[] = [
    DataTypeValues.ATTACK,
    DataTypeValues.SERVE,
    DataTypeValues.BLOCK,
  ]
  // ---- Only count ++ from offensive skills, errors from all ----
  const plusRows = rows.filter((r) => plusTypes.includes(r.type))
  return countQuality(plusRows, '++') - countQuality(rows, '/')
}

// ---- GPA weight mapping: ++ = 3, + = 2, - = 1, / = 0 ----
const GPA_WEIGHTS: Record<NotionNotation, number> = {
  '++': 3,
  '+': 2,
  '-': 1,
  '/': 0,
}

// ---- Weighted GPA: weighted average across all actions ----
export function weightedGPA(rows: NotionDataRow[]): number | null {
  if (rows.length === 0) return null
  const total = rows.reduce((sum, r) => sum + (GPA_WEIGHTS[r.value] ?? 0), 0)
  return total / rows.length
}

// ---- Rotation analysis is based on the rotation reference (setter):
//      S1 = setter at P1 ... S6 = setter at P6, listed in rotation order.
//      Legacy rows (no setter position recorded) are excluded. ----
export const SETTER_ROTATIONS = [1, 6, 5, 4, 3, 2] as const

export interface RotationStats {
  rotation: number
  actions: number
  pointsScored: number // ++ on attaque/service/bloc
  errors: number // / on any action
  attackEff: number | null
  killPct: number | null
}

const POINT_TYPES: DataType[] = [
  DataTypeValues.ATTACK,
  DataTypeValues.SERVE,
  DataTypeValues.BLOCK,
]

// ---- Keep only rows recorded with a setter position ----
export function withSetterRotation(rows: NotionDataRow[]): NotionDataRow[] {
  return rows.filter((r) => r.setterPosition !== undefined)
}

export function pointsByRotation(rows: NotionDataRow[]): RotationStats[] {
  const tagged = withSetterRotation(rows)
  return SETTER_ROTATIONS.map((rot) => {
    const slice = tagged.filter((r) => r.setterPosition === rot)
    const pointsScored = slice.filter(
      (r) => r.value === '++' && POINT_TYPES.includes(r.type),
    ).length
    const errors = countQuality(slice, '/')
    return {
      rotation: rot,
      actions: slice.length,
      pointsScored,
      errors,
      attackEff: attackEfficiency(slice),
      killPct: killPercent(slice),
    }
  })
}

// ---- Rally-based metrics (exact: one row per point, incl. manual points) ----

// ---- Only rallies recorded with a setter position ----
function withSetter(rallies: RallyRow[]): RallyRow[] {
  return rallies.filter((r) => r.setterPosition >= 1 && r.setterPosition <= 6)
}

// ---- Points won / played per rotation for one serving phase ----
export interface RotationRate {
  rotation: number
  attempts: number
  won: number
  pct: number | null
}

function rateByRotation(rallies: RallyRow[], serving: boolean): RotationRate[] {
  const phase = withSetter(rallies).filter((r) => r.isTeamServing === serving)
  return SETTER_ROTATIONS.map((rotation) => {
    const slice = phase.filter((r) => r.setterPosition === rotation)
    const won = slice.filter((r) => r.winner === 'team').length
    return {
      rotation,
      attempts: slice.length,
      won,
      pct: slice.length === 0 ? null : won / slice.length,
    }
  })
}

// ---- Side-out: points won while receiving ----
export function sideOutByRotation(rallies: RallyRow[]): RotationRate[] {
  return rateByRotation(rallies, false)
}

// ---- Break-point: points won while serving ----
export function breakPointByRotation(rallies: RallyRow[]): RotationRate[] {
  return rateByRotation(rallies, true)
}

export function overallRate(breakdown: RotationRate[]): {
  attempts: number
  won: number
  pct: number | null
} {
  const attempts = breakdown.reduce((s, r) => s + r.attempts, 0)
  const won = breakdown.reduce((s, r) => s + r.won, 0)
  return { attempts, won, pct: attempts === 0 ? null : won / attempts }
}

// ---- Points that came from the scoreboard (no player action) ----
export function manualPointsCount(rallies: RallyRow[]): {
  team: number
  opponent: number
} {
  const manual = rallies.filter((r) => r.source === 'manual')
  return {
    team: manual.filter((r) => r.winner === 'team').length,
    opponent: manual.filter((r) => r.winner === 'opponent').length,
  }
}

// ---- Court layout per rotation ----
// ---- For each setter rotation, who stood at each court spot, as a share of
//      the rallies played in that rotation ----
export interface SpotOccupant {
  name: string
  libero: boolean
  share: number // 0..1 of the rallies in this rotation
}

export interface RotationLayout {
  rotation: number
  rallies: number
  // ---- Index 0 = P1 ... 5 = P6, occupants sorted by share desc ----
  spots: SpotOccupant[][]
}

export function layoutByRotation(rallies: RallyRow[]): RotationLayout[] {
  const tagged = withSetter(rallies).filter((r) => r.courtLineup.length === 6)
  return SETTER_ROTATIONS.map((rot) => {
    const snapshots = tagged
      .filter((r) => r.setterPosition === rot)
      .map((r) => r.courtLineup)

    const spots = [0, 1, 2, 3, 4, 5].map((idx) => {
      const counts = new Map<string, { libero: boolean; n: number }>()
      for (const snap of snapshots) {
        const entry = snap[idx]
        if (!entry) continue
        const c = counts.get(entry.name) ?? { libero: entry.libero, n: 0 }
        c.n++
        counts.set(entry.name, c)
      }
      return Array.from(counts.entries())
        .map(([name, c]) => ({
          name,
          libero: c.libero,
          share: snapshots.length === 0 ? 0 : c.n / snapshots.length,
        }))
        .sort((a, b) => b.share - a.share)
    })
    return { rotation: rot, rallies: snapshots.length, spots }
  })
}
