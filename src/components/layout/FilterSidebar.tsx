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
  setSupabaseData,
  setSupabaseSelectedPlayers,
  setSupabaseSelectedMatch,
} from '@/store/volleySlice'
import { fetchNotionData } from '@/app/actions/notion'
import { fetchSupabaseData, syncNotionToSupabase } from '@/app/actions/supabase'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import NotionControls from '@/components/filters/NotionControls'
import SupabaseControls from '@/components/filters/SupabaseControls'
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
    notionRows,
    notionAllPlayers,
    notionSelectedPlayers,
    notionAllMatches,
    notionSelectedMatch,
    supabaseAllPlayers,
    supabaseSelectedPlayers,
    supabaseAllMatches,
    supabaseSelectedMatch,
  } = useSelector((state: RootState) => state.volley)

  const [notionLoading, setNotionLoading] = useState(false)
  const [notionError, setNotionError] = useState<string | null>(null)
  const [supabaseLoading, setSupabaseLoading] = useState(false)
  const [supabaseError, setSupabaseError] = useState<string | null>(null)
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)

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

  async function handleSupabaseFetch() {
    setSupabaseLoading(true)
    setSupabaseError(null)
    try {
      const data = await fetchSupabaseData()
      dispatch(setSupabaseData(data))
    } catch (err) {
      setSupabaseError(
        err instanceof Error ? err.message : 'Failed to fetch Supabase data',
      )
    } finally {
      setSupabaseLoading(false)
    }
  }

  async function handleSync() {
    setSyncLoading(true)
    setSyncResult(null)
    try {
      const result = await syncNotionToSupabase(notionRows)
      setSyncResult(`Synced ${result.inserted} rows to Supabase`)
      if (activeTab === 'supabase') {
        handleSupabaseFetch()
      }
    } catch (err) {
      setSyncResult(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncLoading(false)
    }
  }

  useEffect(() => {
    if (!notionFetchInitiated) {
      notionFetchInitiated = true
      handleNotionFetch()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleTabChange(tab: string) {
    const t = tab as 'notion' | 'excel' | 'supabase'
    dispatch(setActiveTab(t))
    if (t === 'supabase') {
      handleSupabaseFetch()
    }
  }

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

  const supabasePlayerToggle = usePlayerToggle(
    supabaseAllPlayers,
    supabaseSelectedPlayers,
    (players) => dispatch(setSupabaseSelectedPlayers(players)),
  )

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <h1 className="text-xl font-bold">Volley Stats</h1>
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full">
          <TabsTrigger value="notion" className="flex-1">
            Notion
          </TabsTrigger>
          <TabsTrigger value="excel" className="flex-1">
            Excel
          </TabsTrigger>
          <TabsTrigger value="supabase" className="flex-1">
            Supabase
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notion" className="mt-4 space-y-4">
          <NotionControls
            loading={notionLoading}
            error={notionError}
            onRefresh={handleNotionFetch}
          />
          <Button
            onClick={handleSync}
            disabled={syncLoading || notionRows.length === 0}
            size="sm"
            variant="secondary"
            className="w-full"
          >
            <Upload
              className={`mr-2 h-4 w-4 ${syncLoading ? 'animate-pulse' : ''}`}
            />
            {syncLoading ? 'Syncing...' : 'Save to Supabase'}
          </Button>
          {syncResult && (
            <p className="text-xs text-muted-foreground">{syncResult}</p>
          )}
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

        <TabsContent value="supabase" className="mt-4 space-y-4">
          <SupabaseControls
            loading={supabaseLoading}
            error={supabaseError}
            onRefresh={handleSupabaseFetch}
            syncLoading={syncLoading}
            syncResult={syncResult}
            onSync={handleSync}
            hasSyncableData={notionRows.length > 0}
          />
          <Separator />
          <MatchRadioFilter
            allMatches={supabaseAllMatches}
            selectedMatch={supabaseSelectedMatch}
            onMatchChange={(match) => dispatch(setSupabaseSelectedMatch(match))}
          />
          <Separator />
          <PlayerCheckboxFilter
            allPlayers={supabaseAllPlayers}
            selectedPlayers={supabaseSelectedPlayers}
            onPlayerToggle={supabasePlayerToggle.handleToggle}
            onSelectAll={supabasePlayerToggle.handleSelectAll}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
