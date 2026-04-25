import {
  NotionDataRow,
  NotionNotation,
  DataType,
  DataTypeValues,
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

// ---- Per-rotation breakdown (rotation 1-6) ----
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

// ---- Skip legacy rows (no rotation captured) ----
function withRotation(rows: NotionDataRow[]): NotionDataRow[] {
  return rows.filter((r) => r.rotationNumber !== undefined)
}

export function pointsByRotation(rows: NotionDataRow[]): RotationStats[] {
  const tagged = withRotation(rows)
  return [1, 2, 3, 4, 5, 6].map((rot) => {
    const slice = tagged.filter((r) => r.rotationNumber === rot)
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

// ---- Side-out per rotation ----
// ---- A "rally" = consecutive actions sharing the same (setNumber, total score).
//      A side-out attempt = rally that started while we were receiving.
//      A side-out won     = above, AND we ended up scoring the rally (any ++ on
//      att/srv/blk recorded while receiving). ----
export interface RotationSideOut {
  rotation: number
  attempts: number
  won: number
  pct: number | null
}

interface RallyKey {
  setNumber: number
  scoreTotal: number
}

interface Rally {
  key: RallyKey
  actions: NotionDataRow[]
}

function groupIntoRallies(rows: NotionDataRow[]): Rally[] {
  // ---- Group by (set, score-total). Order doesn't matter for side-out math. ----
  const map = new Map<string, Rally>()
  for (const row of rows) {
    if (row.setNumber === undefined) continue
    const total = (row.teamScore ?? 0) + (row.opponentScore ?? 0)
    const k = `${row.setNumber}-${total}`
    let rally = map.get(k)
    if (!rally) {
      rally = {
        key: { setNumber: row.setNumber, scoreTotal: total },
        actions: [],
      }
      map.set(k, rally)
    }
    rally.actions.push(row)
  }
  return Array.from(map.values())
}

export function sideOutByRotation(rows: NotionDataRow[]): RotationSideOut[] {
  const rallies = groupIntoRallies(withRotation(rows))

  // ---- Bucket by the rotation we were in at the start of the rally ----
  const buckets = new Map<number, { attempts: number; won: number }>()
  for (let r = 1; r <= 6; r++) buckets.set(r, { attempts: 0, won: 0 })

  for (const rally of rallies) {
    // ---- Side-out attempt only when we were receiving ----
    const receiving = rally.actions.some((a) => a.isTeamServing === false)
    if (!receiving) continue

    // ---- Use the rotation captured on the receive-side actions ----
    const rcvAction = rally.actions.find((a) => a.isTeamServing === false)
    const rotation = rcvAction?.rotationNumber
    if (!rotation) continue

    const bucket = buckets.get(rotation)!
    bucket.attempts++

    // ---- Side-out won: any ++ on att/srv/blk while receiving ----
    const won = rally.actions.some(
      (a) =>
        a.isTeamServing === false &&
        a.value === '++' &&
        POINT_TYPES.includes(a.type),
    )
    if (won) bucket.won++
  }

  return Array.from(buckets.entries()).map(([rotation, b]) => ({
    rotation,
    attempts: b.attempts,
    won: b.won,
    pct: b.attempts === 0 ? null : b.won / b.attempts,
  }))
}

export function overallSideOut(rows: NotionDataRow[]): {
  attempts: number
  won: number
  pct: number | null
} {
  const breakdown = sideOutByRotation(rows)
  const attempts = breakdown.reduce((s, r) => s + r.attempts, 0)
  const won = breakdown.reduce((s, r) => s + r.won, 0)
  return { attempts, won, pct: attempts === 0 ? null : won / attempts }
}
