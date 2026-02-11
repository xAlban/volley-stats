'use client'

import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import MatchSetup from '@/components/input/MatchSetup'
import LiveTracker from '@/components/input/LiveTracker'

export default function InputSection() {
  const inputPhase = useSelector((state: RootState) => state.volley.inputPhase)

  return inputPhase === 'setup' ? <MatchSetup /> : <LiveTracker />
}
