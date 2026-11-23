import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: React.ReactNode
  // ---- Right-aligned actions (buttons, filters trigger...) ----
  actions?: React.ReactNode
  className?: string
}

// ---- Consistent page title block for every section ----
export default function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-wrap items-end justify-between gap-3 pb-4',
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="truncate">{title}</h1>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}
