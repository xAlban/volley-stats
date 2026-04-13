'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <NotionBarChart
          dataRows={notionRows ?? []}
          type={type}
          stackBars={stackBars}
        />
      </CardContent>
    </Card>
  )
}
