'use client'

import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { DataTypeValues } from '@/types'
import StatChartCard from '@/components/charts/StatChartCard'
import { ScrollArea } from '@/components/ui/scroll-area'

const chartSections = [
  { title: 'Attacks', type: DataTypeValues.ATTACK },
  { title: 'Defense', type: DataTypeValues.DEFENSE },
  { title: 'Serve', type: DataTypeValues.SERVE },
  { title: 'Reception', type: DataTypeValues.RECEP },
  { title: 'Block', type: DataTypeValues.BLOCK },
] as const

export default function ChartPanel() {
  const {
    activeTab,
    excelRows,
    excelAllPlayers,
    excelSelectedPlayers,
    notionRows,
    notionAllPlayers,
    notionSelectedPlayers,
    notionSelectedMatch,
    supabaseRows,
    supabaseAllPlayers,
    supabaseSelectedPlayers,
    supabaseSelectedMatch,
  } = useSelector((state: RootState) => state.volley)

  const excelFilteredRows = excelRows.filter((row) =>
    excelSelectedPlayers.includes(row.name),
  )
  const excelStackBars = excelSelectedPlayers.length === excelAllPlayers.length

  const notionFilteredRows = notionRows.filter(
    (row) =>
      notionSelectedPlayers.includes(row.name) &&
      (notionSelectedMatch === 'all' || row.match === notionSelectedMatch),
  )
  const notionStackBars =
    notionSelectedPlayers.length === notionAllPlayers.length

  const supabaseFilteredRows = supabaseRows.filter(
    (row) =>
      supabaseSelectedPlayers.includes(row.name) &&
      (supabaseSelectedMatch === 'all' || row.match === supabaseSelectedMatch),
  )
  const supabaseStackBars =
    supabaseSelectedPlayers.length === supabaseAllPlayers.length

  const hasData =
    activeTab === 'notion'
      ? notionRows.length > 0
      : activeTab === 'supabase'
        ? supabaseRows.length > 0
        : excelRows.length > 0

  if (!hasData) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        <p>
          {activeTab === 'notion'
            ? 'Loading Notion data...'
            : activeTab === 'supabase'
              ? 'No Supabase data. Click Refresh or Sync from Notion.'
              : 'Upload an Excel file to view stats.'}
        </p>
      </div>
    )
  }

  const rows =
    activeTab === 'notion'
      ? notionFilteredRows
      : activeTab === 'supabase'
        ? supabaseFilteredRows
        : undefined

  const excelRowsForChart =
    activeTab === 'excel' ? excelFilteredRows : undefined

  const stackBars =
    activeTab === 'notion'
      ? notionStackBars
      : activeTab === 'supabase'
        ? supabaseStackBars
        : excelStackBars

  return (
    <ScrollArea className="flex-1 h-full">
      <div className="space-y-4 p-4">
        {chartSections.map(({ title, type }) => (
          <StatChartCard
            key={type}
            title={title}
            type={type}
            dataSource={activeTab}
            excelRows={excelRowsForChart}
            notionRows={rows}
            stackBars={stackBars}
          />
        ))}
      </div>
    </ScrollArea>
  )
}
