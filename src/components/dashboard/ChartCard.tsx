import { cn } from '@/lib/utils'

interface ChartCardProps {
  title: React.ReactNode
  description?: React.ReactNode
  // ---- Right side of the header (toggle, legend, info tooltip...) ----
  actions?: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
  // ---- Remove body padding for edge-to-edge tables ----
  flush?: boolean
  className?: string
}

// ---- Standard container for a chart, table or comparison block ----
export default function ChartCard({
  title,
  description,
  actions,
  footer,
  children,
  flush = false,
  className,
}: ChartCardProps) {
  return (
    <section
      className={cn('glass flex min-w-0 flex-col rounded-2xl', className)}
    >
      <header className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
      </header>
      <div className={cn('min-w-0 flex-1', flush ? 'pb-1' : 'px-5 pb-5')}>
        {children}
      </div>
      {footer && (
        <footer className="border-t px-5 py-3 text-xs text-muted-foreground">
          {footer}
        </footer>
      )}
    </section>
  )
}
