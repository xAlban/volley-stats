'use client'

import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import HomeSection from '@/components/sections/HomeSection'
import ChartsSection from '@/components/sections/ChartsSection'
import AnalysisSection from '@/components/sections/AnalysisSection'
import InputSection from '@/components/sections/InputSection'
import ProfileSection from '@/components/sections/ProfileSection'
import TeamSection from '@/components/sections/TeamSection'

export default function SectionRouter() {
  const currentSection = useSelector(
    (state: RootState) => state.volley.currentSection,
  )

  switch (currentSection) {
    case 'home':
      return <HomeSection />
    case 'team':
      return <TeamSection />
    case 'charts':
      return <ChartsSection />
    case 'analysis':
      return <AnalysisSection />
    case 'input':
      return <InputSection />
    case 'profile':
      return <ProfileSection />
  }
}
