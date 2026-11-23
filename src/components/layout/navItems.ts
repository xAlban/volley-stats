import {
  Home,
  BarChart3,
  TrendingUp,
  ClipboardPen,
  CircleUser,
  Shield,
  type LucideIcon,
} from 'lucide-react'

export type SectionKey =
  | 'home'
  | 'team'
  | 'charts'
  | 'analysis'
  | 'input'
  | 'profile'

// ---- Single source for desktop sidebar and mobile tab bar ----
export const navItems: { key: SectionKey; label: string; icon: LucideIcon }[] =
  [
    { key: 'home', label: 'Home', icon: Home },
    { key: 'team', label: 'Team', icon: Shield },
    { key: 'charts', label: 'Charts', icon: BarChart3 },
    { key: 'analysis', label: 'Analysis', icon: TrendingUp },
    { key: 'input', label: 'Input', icon: ClipboardPen },
    { key: 'profile', label: 'Profile', icon: CircleUser },
  ]
