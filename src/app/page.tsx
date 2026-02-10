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
import { useState } from 'react'
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
  } = useSelector((state: RootState) => state.volley)

  const [notionLoading, setNotionLoading] = useState(false)
  const [notionError, setNotionError] = useState<string | null>(null)

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

  const excelFilteredRows = excelRows.filter((row) =>
    excelSelectedPlayers.includes(row.name),
  )
  const excelStackBars = excelSelectedPlayers.length === excelAllPlayers.length

  const notionFilteredRows = notionRows.filter((row) =>
    notionSelectedPlayers.includes(row.name),
  )
  const notionStackBars =
    notionSelectedPlayers.length === notionAllPlayers.length

  return (
    <div className="flex flex-col gap-8 p-1 md:p-4">
      <h1>Volley Stats</h1>
      <Tabs defaultValue="excel">
        <TabsList>
          <TabsTrigger value="excel">Excel</TabsTrigger>
          <TabsTrigger value="notion">Notion</TabsTrigger>
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
            <h2>Players</h2>
            {excelAllPlayers.map((player) => (
              <Toggle
                key={player}
                aria-label="Toggle Player"
                onClick={() => handleExcelPlayerToggle(player)}
              >
                {player}
              </Toggle>
            ))}
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
              {notionLoading ? 'Loading...' : 'Fetch from Notion'}
            </Button>
            {notionError && (
              <p className="text-sm text-destructive">{notionError}</p>
            )}
          </div>
          <Separator className="my-4" />
          <div>
            <h2>Players</h2>
            {notionAllPlayers.map((player) => (
              <Toggle
                key={player}
                aria-label="Toggle Player"
                onClick={() => handleNotionPlayerToggle(player)}
              >
                {player}
              </Toggle>
            ))}
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
