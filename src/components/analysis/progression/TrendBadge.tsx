import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { StatDef, formatStatDelta } from '@/utils/statCatalog'
import { StatTrend } from '@/utils/progression'
import { cn } from '@/lib/utils'

// ---- Trend of the last 3 counted matches vs the 3 before. Only coloured
//      when the change is clear (≥90% confidence), otherwise "stable" ----
export default function TrendBadge({
  def,
  trend,
}: {
  def: StatDef
  trend: StatTrend | null
}) {
  if (!trend) {
    return (
      <span
        className="glass-inset rounded-full px-2 py-0.5 text-xs text-muted-foreground"
        title="Needs at least 4 matches with enough actions"
      >
        Not enough data
      </span>
    )
  }

  // ---- Arrow follows the value; colour follows good / bad ----
  const up = trend.delta > 0
  const Icon =
    trend.direction === 'flat' ? Minus : up ? ArrowUpRight : ArrowDownRight
  const label =
    trend.direction === 'flat'
      ? def.kind === 'sum'
        ? formatStatDelta(def, trend.delta)
        : 'Stable'
      : formatStatDelta(def, trend.delta)

  return (
    <span
      title={`Last 3 matches vs 3 before (${trend.nRecent} / ${trend.nPrevious} ${def.kind === 'sum' ? 'matches' : def.noun})${trend.direction === 'flat' && def.kind === 'mean' ? ` · change ${formatStatDelta(def, trend.delta)} is within normal variation` : ''}`}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums',
        trend.direction === 'better' && 'bg-success/12 text-success',
        trend.direction === 'worse' && 'bg-danger/12 text-danger',
        trend.direction === 'flat' && 'glass-inset text-muted-foreground',
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </span>
  )
}
