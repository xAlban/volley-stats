'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import CustomBarChart from '@/components/charts/CustomBarChart'
import NotionBarChart from '@/components/charts/NotionBarChart'
import { DataRow, DataType, NotionDataRow } from '@/types'

interface StatChartCardProps {
  title: string
  type: DataType
  dataSource: 'notion' | 'excel'
  excelRows?: DataRow[]
  notionRows?: NotionDataRow[]
  stackBars: boolean
}

export default function StatChartCard({
  title,
  type,
  dataSource,
  excelRows,
  notionRows,
  stackBars,
}: StatChartCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {dataSource === 'notion' ? (
          <NotionBarChart
            dataRows={notionRows ?? []}
            type={type}
            stackBars={stackBars}
          />
        ) : (
          <CustomBarChart
            dataRows={excelRows ?? []}
            type={type}
            stackBars={stackBars}
          />
        )}
      </CardContent>
    </Card>
  )
}
