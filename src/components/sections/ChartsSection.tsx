'use client'

import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { setSupabaseData } from '@/store/volleySlice'
import { fetchSupabaseData } from '@/app/actions/supabase'
import FilterLayout from '@/components/layout/FilterLayout'
import SupabaseChartPanel from '@/components/layout/SupabaseChartPanel'

export default function ChartsSection() {
  const dispatch = useDispatch()
  const supabaseRows = useSelector(
    (state: RootState) => state.volley.supabaseRows,
  )

  useEffect(() => {
    if (supabaseRows.length === 0) {
      fetchSupabaseData()
        .then((data) => dispatch(setSupabaseData(data)))
        .catch(() => {})
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <FilterLayout
      title="Charts"
      description="Action quality by player across attack, defense, serve, reception and block."
    >
      <SupabaseChartPanel />
    </FilterLayout>
  )
}
