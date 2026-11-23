'use client'

import ChartCard from '@/components/dashboard/ChartCard'
import NotionBarChart from '@/components/charts/NotionBarChart'
import { DataType, NotionDataRow } from '@/types'

interface StatChartCardProps {
  title: string
  type: DataType
  dataSource: 'supabase'
  notionRows?: NotionDataRow[]
  stackBars: boolean
}

export default function StatChartCard({
  title,
  type,
  notionRows,
  stackBars,
}: StatChartCardProps) {
  return (
    <ChartCard title={title}>
      <NotionBarChart
        dataRows={notionRows ?? []}
        type={type}
        stackBars={stackBars}
      />
    </ChartCard>
  )
}
