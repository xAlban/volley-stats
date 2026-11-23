'use client'

import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { setCurrentSection } from '@/store/volleySlice'
import { navItems } from '@/components/layout/navItems'
import { cn } from '@/lib/utils'

// ---- Mobile bottom navigation: glass bar above the safe area ----
export default function MobileTabBar() {
  const dispatch = useDispatch()
  const currentSection = useSelector(
    (state: RootState) => state.volley.currentSection,
  )

  return (
    <nav className="glass-strong fixed inset-x-0 bottom-0 z-50 flex rounded-none border-x-0 border-b-0 px-1 pb-[env(safe-area-inset-bottom)] md:hidden">
      {navItems.map(({ key, label, icon: Icon }) => {
        const active = currentSection === key
        return (
          <button
            key={key}
            type="button"
            aria-current={active ? 'page' : undefined}
            onClick={() => dispatch(setCurrentSection(key))}
            className={cn(
              'flex h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground transition-colors',
              active && 'text-primary',
            )}
          >
            <span
              className={cn(
                'flex h-7 w-12 items-center justify-center rounded-full transition-colors',
                active && 'bg-primary/12',
              )}
            >
              <Icon className="size-5" />
            </span>
            {label}
          </button>
        )
      })}
    </nav>
  )
}
