'use client'

import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { setCurrentSection } from '@/store/volleySlice'
import { Home, BarChart3, TrendingUp, Archive } from 'lucide-react'

const sections = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'charts', label: 'Charts', icon: BarChart3 },
  { key: 'analysis', label: 'Analysis', icon: TrendingUp },
  { key: 'old', label: 'Old', icon: Archive },
] as const

export default function MobileTabBar() {
  const dispatch = useDispatch()
  const currentSection = useSelector(
    (state: RootState) => state.volley.currentSection,
  )

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t bg-background md:hidden">
      {sections.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => dispatch(setCurrentSection(key))}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
            currentSection === key ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <Icon className="h-5 w-5" />
          {label}
        </button>
      ))}
    </nav>
  )
}
