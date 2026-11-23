'use client'

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type MetricFormat = 'percent' | 'decimal' | 'integer'

interface MetricCardProps {
  label: string
  value: number | null
  format: MetricFormat
  description?: string
  thresholds?: { green: number; yellow: number }
}

// ---- Format metric value based on its type ----
function formatValue(value: number, format: MetricFormat): string {
  switch (format) {
    case 'percent':
      return `${(value * 100).toFixed(1)}%`
    case 'decimal':
      return value.toFixed(2)
    case 'integer':
      return value > 0 ? `+${value}` : `${value}`
  }
}

// ---- Color-code value: green/yellow/red based on thresholds, or +/- sign for integers ----
function getColor(
  value: number,
  format: MetricFormat,
  thresholds?: { green: number; yellow: number },
): string {
  if (!thresholds) {
    if (format === 'integer') {
      if (value > 0) return 'text-success'
      if (value < 0) return 'text-danger'
      return 'text-muted-foreground'
    }
    return 'text-foreground'
  }
  if (value >= thresholds.green) return 'text-success'
  if (value >= thresholds.yellow) return 'text-warning'
  return 'text-danger'
}

export default function MetricCard({
  label,
  value,
  format,
  description,
  thresholds,
}: MetricCardProps) {
  return (
    <div className="glass-inset min-w-0 rounded-xl px-2.5 py-2">
      <div className="flex items-center gap-1">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        {description && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={`About ${label}`}
                className="text-muted-foreground/60 hover:text-muted-foreground"
              >
                <Info className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-56">
              {description}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <p
        className={cn(
          'mt-0.5 text-lg font-semibold tracking-tight tabular-nums',
          value !== null
            ? getColor(value, format, thresholds)
            : 'text-muted-foreground',
        )}
      >
        {value !== null ? formatValue(value, format) : 'N/A'}
      </p>
    </div>
  )
}
