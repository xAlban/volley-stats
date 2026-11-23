'use client'

import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { setCurrentSection } from '@/store/volleySlice'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import ThemeToggle from '@/components/theme/ThemeToggle'
import { navItems } from '@/components/layout/navItems'
import { cn } from '@/lib/utils'

// ---- Desktop sidebar: floating glass panel. Icons only on md, icons +
//      labels from lg ----
export default function IconRail() {
  const dispatch = useDispatch()
  const currentSection = useSelector(
    (state: RootState) => state.volley.currentSection,
  )

  return (
    <aside className="glass-strong hidden w-16 shrink-0 flex-col rounded-2xl p-2 md:flex lg:w-52">
      {/* ---- Brand ---- */}
      <div className="flex h-12 items-center gap-2.5 px-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-[inset_0_1px_0_0_oklch(1_0_0/0.3)]">
          V
        </div>
        <span className="hidden truncate text-sm font-semibold tracking-tight lg:block">
          Volley Stats
        </span>
      </div>

      <nav className="mt-2 flex flex-1 flex-col gap-1">
        {navItems.map(({ key, label, icon: Icon }) => {
          const active = currentSection === key
          return (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => dispatch(setCurrentSection(key))}
                  className={cn(
                    'flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                    active && 'glass text-foreground hover:bg-card',
                  )}
                >
                  <Icon
                    className={cn(
                      'size-[18px] shrink-0',
                      active && 'text-primary',
                    )}
                  />
                  <span className="hidden truncate lg:block">{label}</span>
                </button>
              </TooltipTrigger>
              {/* ---- Labels are visible from lg: tooltip only when collapsed ---- */}
              <TooltipContent side="right" className="lg:hidden">
                {label}
              </TooltipContent>
            </Tooltip>
          )
        })}
      </nav>

      <div className="flex justify-center pt-2 lg:justify-start lg:px-1">
        <ThemeToggle orientation="vertical" className="lg:hidden" />
        <ThemeToggle className="hidden lg:inline-flex" />
      </div>
    </aside>
  )
}
