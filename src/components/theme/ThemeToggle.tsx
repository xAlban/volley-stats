'use client'

import { useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'
import { Monitor, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

const options = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const

// ---- True only on the client: the theme is unknown during SSR ----
const subscribe = () => () => {}
function useIsClient() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
}

interface ThemeToggleProps {
  // ---- Vertical icon stack for the collapsed sidebar ----
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

// ---- Segmented control: light / dark / system ----
export default function ThemeToggle({
  orientation = 'horizontal',
  className,
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const isClient = useIsClient()
  const current = isClient ? (theme ?? 'system') : null

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={cn(
        'glass-inset inline-flex gap-0.5 rounded-xl p-0.5',
        orientation === 'vertical' ? 'flex-col' : 'flex-row',
        className,
      )}
    >
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={current === value}
          title={label}
          onClick={() => setTheme(value)}
          className={cn(
            'flex size-7 items-center justify-center rounded-[0.6rem] text-muted-foreground transition-colors hover:text-foreground',
            current === value && 'glass text-foreground',
          )}
        >
          <Icon className="size-3.5" />
          <span className="sr-only">{label}</span>
        </button>
      ))}
    </div>
  )
}
