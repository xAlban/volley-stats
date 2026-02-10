'use client'

import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { setCurrentSection } from '@/store/volleySlice'
import { Home, BarChart3, TrendingUp, Archive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const sections = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'charts', label: 'Charts', icon: BarChart3 },
  { key: 'analysis', label: 'Analysis', icon: TrendingUp },
  { key: 'old', label: 'Old', icon: Archive },
] as const

export default function IconRail() {
  const dispatch = useDispatch()
  const currentSection = useSelector(
    (state: RootState) => state.volley.currentSection,
  )

  return (
    <aside className="hidden w-15 shrink-0 flex-col items-center gap-2 border-r bg-sidebar py-4 md:flex">
      {sections.map(({ key, label, icon: Icon }) => (
        <Tooltip key={key}>
          <TooltipTrigger asChild>
            <Button
              variant={currentSection === key ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => dispatch(setCurrentSection(key))}
            >
              <Icon className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      ))}
    </aside>
  )
}
