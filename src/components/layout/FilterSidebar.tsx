'use client'

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import {
  setActiveTab,
  setExcelSelectedPlayers,
  setNotionSelectedPlayers,
  setNotionSelectedMatch,
  setNotionData,
} from '@/store/volleySlice'
import { fetchNotionData } from '@/app/actions/notion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import NotionControls from '@/components/filters/NotionControls'
import MatchRadioFilter from '@/components/filters/MatchRadioFilter'
import PlayerCheckboxFilter from '@/components/filters/PlayerCheckboxFilter'
import ExcelUploadForm from '@/components/filters/ExcelUploadForm'
import { usePlayerToggle } from '@/hooks/usePlayerToggle'

let notionFetchInitiated = false

export default function FilterSidebar() {
  const dispatch = useDispatch()
  const {
    activeTab,
    excelAllPlayers,
    excelSelectedPlayers,
    notionAllPlayers,
    notionSelectedPlayers,
    notionAllMatches,
    notionSelectedMatch,
  } = useSelector((state: RootState) => state.volley)

  const [notionLoading, setNotionLoading] = useState(false)
  const [notionError, setNotionError] = useState<string | null>(null)

  async function handleNotionFetch() {
    setNotionLoading(true)
    setNotionError(null)
    try {
      const data = await fetchNotionData()
      dispatch(setNotionData(data))
    } catch (err) {
      setNotionError(
        err instanceof Error ? err.message : 'Failed to fetch Notion data',
      )
    } finally {
      setNotionLoading(false)
    }
  }

  useEffect(() => {
    if (!notionFetchInitiated) {
      notionFetchInitiated = true
      handleNotionFetch()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const notionPlayerToggle = usePlayerToggle(
    notionAllPlayers,
    notionSelectedPlayers,
    (players) => dispatch(setNotionSelectedPlayers(players)),
  )

  const excelPlayerToggle = usePlayerToggle(
    excelAllPlayers,
    excelSelectedPlayers,
    (players) => dispatch(setExcelSelectedPlayers(players)),
  )

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <h1 className="text-xl font-bold">Volley Stats</h1>
      <Tabs
        value={activeTab}
        onValueChange={(v) => dispatch(setActiveTab(v as 'notion' | 'excel'))}
      >
        <TabsList className="w-full">
          <TabsTrigger value="notion" className="flex-1">
            Notion
          </TabsTrigger>
          <TabsTrigger value="excel" className="flex-1">
            Excel
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notion" className="mt-4 space-y-4">
          <NotionControls
            loading={notionLoading}
            error={notionError}
            onRefresh={handleNotionFetch}
          />
          <Separator />
          <MatchRadioFilter
            allMatches={notionAllMatches}
            selectedMatch={notionSelectedMatch}
            onMatchChange={(match) => dispatch(setNotionSelectedMatch(match))}
          />
          <Separator />
          <PlayerCheckboxFilter
            allPlayers={notionAllPlayers}
            selectedPlayers={notionSelectedPlayers}
            onPlayerToggle={notionPlayerToggle.handleToggle}
            onSelectAll={notionPlayerToggle.handleSelectAll}
          />
        </TabsContent>

        <TabsContent value="excel" className="mt-4 space-y-4">
          <ExcelUploadForm />
          <Separator />
          <PlayerCheckboxFilter
            allPlayers={excelAllPlayers}
            selectedPlayers={excelSelectedPlayers}
            onPlayerToggle={excelPlayerToggle.handleToggle}
            onSelectAll={excelPlayerToggle.handleSelectAll}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
