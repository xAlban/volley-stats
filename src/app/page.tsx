'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useEffect, useRef, useState } from 'react'
import { read, utils } from 'xlsx'
import { DataRow, DataType, DataTypeValues, Notation } from '@/types'
import CustomBarChart from '@/components/charts/CustomBarChart'
import NotionBarChart from '@/components/charts/NotionBarChart'
import { Toggle } from '@/components/ui/toggle'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import {
  setExcelData,
  setExcelSelectedPlayers,
  setNotionData,
  setNotionSelectedPlayers,
  setNotionSelectedMatches,
} from '@/store/volleySlice'
import { fetchNotionData } from '@/app/actions/notion'

const fileListSchema =
  typeof window === 'undefined' ? z.any() : z.instanceof(FileList)

const FormSchema = z.object({
  file: fileListSchema.optional(),
})

function Home() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  })

  const dispatch = useDispatch()
  const {
    excelRows,
    excelAllPlayers,
    excelSelectedPlayers,
    notionRows,
    notionAllPlayers,
    notionSelectedPlayers,
    notionAllMatches,
    notionSelectedMatches,
  } = useSelector((state: RootState) => state.volley)

  const [notionLoading, setNotionLoading] = useState(false)
  const [notionError, setNotionError] = useState<string | null>(null)
  const notionFetched = useRef(false)

  const fileRef = form.register('file')

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!data.file || data.file.length !== 1) {
      return
    }

    const f = await data.file[0].arrayBuffer()

    const wb = read(f)
    const ws = wb.Sheets[wb.SheetNames[0]]

    const localAllPlayers: string[] = []

    const localRows: DataRow[] = (
      utils.sheet_to_json(ws, { header: 1 }) as string[][]
    )
      .map((row: string[]) => {
        if (
          !localAllPlayers.includes(row[3]) &&
          !['', 'Nom', undefined].includes(row[3])
        ) {
          localAllPlayers.push(row[3])
        }

        return {
          type: row[1] as DataType,
          name: row[3],
          value: row[2] as Notation,
        }
      })
      .filter(
        (row: { name: string; value: Notation; type: string }) =>
          !['', 'Nom'].includes(row.name) && row.name,
      )

    dispatch(setExcelData({ rows: localRows, allPlayers: localAllPlayers }))
  }

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
    if (!notionFetched.current) {
      notionFetched.current = true
      handleNotionFetch()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleExcelPlayerToggle(player: string) {
    if (excelSelectedPlayers.length === excelAllPlayers.length) {
      dispatch(setExcelSelectedPlayers([player]))
      return
    }

    if (excelSelectedPlayers.includes(player)) {
      dispatch(
        setExcelSelectedPlayers(
          excelSelectedPlayers.length === 1
            ? excelAllPlayers
            : excelSelectedPlayers.filter((value) => value !== player),
        ),
      )
      return
    }

    dispatch(setExcelSelectedPlayers([...excelSelectedPlayers, player]))
  }

  function handleNotionPlayerToggle(player: string) {
    if (notionSelectedPlayers.length === notionAllPlayers.length) {
      dispatch(setNotionSelectedPlayers([player]))
      return
    }

    if (notionSelectedPlayers.includes(player)) {
      dispatch(
        setNotionSelectedPlayers(
          notionSelectedPlayers.length === 1
            ? notionAllPlayers
            : notionSelectedPlayers.filter((value) => value !== player),
        ),
      )
      return
    }

    dispatch(setNotionSelectedPlayers([...notionSelectedPlayers, player]))
  }

  function handleNotionMatchToggle(match: string) {
    if (notionSelectedMatches.length === notionAllMatches.length) {
      dispatch(setNotionSelectedMatches([match]))
      return
    }

    if (notionSelectedMatches.includes(match)) {
      dispatch(
        setNotionSelectedMatches(
          notionSelectedMatches.length === 1
            ? notionAllMatches
            : notionSelectedMatches.filter((value) => value !== match),
        ),
      )
      return
    }

    dispatch(setNotionSelectedMatches([...notionSelectedMatches, match]))
  }

  const excelFilteredRows = excelRows.filter((row) =>
    excelSelectedPlayers.includes(row.name),
  )
  const excelStackBars = excelSelectedPlayers.length === excelAllPlayers.length

  const notionFilteredRows = notionRows.filter(
    (row) =>
      notionSelectedPlayers.includes(row.name) &&
      (!row.match || notionSelectedMatches.includes(row.match)),
  )
  const notionStackBars =
    notionSelectedPlayers.length === notionAllPlayers.length

  return (
    <div className="flex flex-col gap-8 p-1 md:p-4">
      <h1>Volley Stats</h1>
      <Tabs defaultValue="notion">
        <TabsList>
          <TabsTrigger value="notion">Notion</TabsTrigger>
          <TabsTrigger value="excel">Excel</TabsTrigger>
        </TabsList>
        <TabsContent value="excel">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="w-1/1 space-y-6"
            >
              <FormField
                control={form.control}
                name="file"
                render={() => (
                  <FormItem>
                    <FormLabel>Stats File</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept=".xlsx"
                        placeholder="shadcn"
                        {...fileRef}
                      />
                    </FormControl>
                    <FormDescription>
                      Select your stats file to get analytics
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Load Stats</Button>
            </form>
          </Form>
          <Separator className="my-4" />
          <div>
            <div className="flex items-center gap-2">
              <h2>Players</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  dispatch(setExcelSelectedPlayers(excelAllPlayers))
                }
              >
                All
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {excelAllPlayers.map((player) => (
                <Toggle
                  key={player}
                  variant="outline"
                  aria-label="Toggle Player"
                  pressed={excelSelectedPlayers.includes(player)}
                  onPressedChange={() => handleExcelPlayerToggle(player)}
                >
                  {player}
                </Toggle>
              ))}
            </div>
          </div>
          {excelRows.length > 0 && (
            <div className="w-1/1 flex flex-wrap">
              <div className="w-1/1 md:w-1/2">
                <span>Attacks</span>
                <CustomBarChart
                  dataRows={excelFilteredRows}
                  type={DataTypeValues.ATTACK}
                  stackBars={excelStackBars}
                />
              </div>
              <div className="w-1/1 md:w-1/2">
                <span>Defense</span>
                <CustomBarChart
                  dataRows={excelFilteredRows}
                  type={DataTypeValues.DEFENSE}
                  stackBars={excelStackBars}
                />
              </div>
              <div className="w-1/1 md:w-1/2">
                <span>Serve</span>
                <CustomBarChart
                  dataRows={excelFilteredRows}
                  type={DataTypeValues.SERVE}
                  stackBars={excelStackBars}
                />
              </div>
              <div className="w-1/1 md:w-1/2">
                <span>Recep</span>
                <CustomBarChart
                  dataRows={excelFilteredRows}
                  type={DataTypeValues.RECEP}
                  stackBars={excelStackBars}
                />
              </div>
              <div className="w-1/1 md:w-1/2">
                <span>Block</span>
                <CustomBarChart
                  dataRows={excelFilteredRows}
                  type={DataTypeValues.BLOCK}
                  stackBars={excelStackBars}
                />
              </div>
            </div>
          )}
        </TabsContent>
        <TabsContent value="notion">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Fetch volleyball statistics directly from your Notion database.
            </p>
            <Button onClick={handleNotionFetch} disabled={notionLoading}>
              {notionLoading ? 'Loading...' : 'Refresh'}
            </Button>
            {notionError && (
              <p className="text-sm text-destructive">{notionError}</p>
            )}
          </div>
          <Separator className="my-4" />
          {notionAllMatches.length > 0 && (
            <div>
              <div className="flex items-center gap-2">
                <h2>Matches</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    dispatch(setNotionSelectedMatches(notionAllMatches))
                  }
                >
                  All
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {notionAllMatches.map((match) => (
                  <Toggle
                    key={match}
                    variant="outline"
                    aria-label="Toggle Match"
                    pressed={notionSelectedMatches.includes(match)}
                    onPressedChange={() => handleNotionMatchToggle(match)}
                  >
                    {match}
                  </Toggle>
                ))}
              </div>
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2>Players</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  dispatch(setNotionSelectedPlayers(notionAllPlayers))
                }
              >
                All
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {notionAllPlayers.map((player) => (
                <Toggle
                  key={player}
                  variant="outline"
                  aria-label="Toggle Player"
                  pressed={notionSelectedPlayers.includes(player)}
                  onPressedChange={() => handleNotionPlayerToggle(player)}
                >
                  {player}
                </Toggle>
              ))}
            </div>
          </div>
          {notionRows.length > 0 && (
            <div className="w-1/1 flex flex-wrap">
              <div className="w-1/1 md:w-1/2">
                <span>Attacks</span>
                <NotionBarChart
                  dataRows={notionFilteredRows}
                  type={DataTypeValues.ATTACK}
                  stackBars={notionStackBars}
                />
              </div>
              <div className="w-1/1 md:w-1/2">
                <span>Defense</span>
                <NotionBarChart
                  dataRows={notionFilteredRows}
                  type={DataTypeValues.DEFENSE}
                  stackBars={notionStackBars}
                />
              </div>
              <div className="w-1/1 md:w-1/2">
                <span>Serve</span>
                <NotionBarChart
                  dataRows={notionFilteredRows}
                  type={DataTypeValues.SERVE}
                  stackBars={notionStackBars}
                />
              </div>
              <div className="w-1/1 md:w-1/2">
                <span>Recep</span>
                <NotionBarChart
                  dataRows={notionFilteredRows}
                  type={DataTypeValues.RECEP}
                  stackBars={notionStackBars}
                />
              </div>
              <div className="w-1/1 md:w-1/2">
                <span>Block</span>
                <NotionBarChart
                  dataRows={notionFilteredRows}
                  type={DataTypeValues.BLOCK}
                  stackBars={notionStackBars}
                />
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Home
