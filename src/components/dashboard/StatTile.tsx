import { cn } from '@/lib/utils'

export type StatTone = 'default' | 'success' | 'warning' | 'danger'

interface StatTileProps {
  label: string
  value: React.ReactNode
  // ---- Small line under the value (sample size, comparison...) ----
  hint?: React.ReactNode
  icon?: React.ReactNode
  tone?: StatTone
  className?: string
}

const toneClass: Record<StatTone, string> = {
  default: 'text-foreground',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
}

// ---- KPI tile: label, big number, optional hint. Use in dashboard grids ----
export default function StatTile({
  label,
  value,
  hint,
  icon,
  tone = 'default',
  className,
}: StatTileProps) {
  return (
    <div className={cn('glass rounded-2xl p-4', className)}>
      <div className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
        <span className="truncate">{label}</span>
        {icon && <span className="shrink-0 [&_svg]:size-4">{icon}</span>}
      </div>
      <div
        className={cn(
          'mt-1.5 text-2xl font-semibold tracking-tight tabular-nums',
          toneClass[tone],
        )}
      >
        {value}
      </div>
      {hint && (
        <div className="mt-0.5 truncate text-xs text-muted-foreground">
          {hint}
        </div>
      )}
    </div>
  )
}
