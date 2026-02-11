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
