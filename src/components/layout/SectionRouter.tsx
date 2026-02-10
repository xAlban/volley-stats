'use client'

import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import HomeSection from '@/components/sections/HomeSection'
import ChartsSection from '@/components/sections/ChartsSection'
import AnalysisSection from '@/components/sections/AnalysisSection'
import OldSection from '@/components/sections/OldSection'

export default function SectionRouter() {
  const currentSection = useSelector(
    (state: RootState) => state.volley.currentSection,
  )

  switch (currentSection) {
    case 'home':
      return <HomeSection />
    case 'charts':
      return <ChartsSection />
    case 'analysis':
      return <AnalysisSection />
    case 'old':
      return <OldSection />
  }
}
