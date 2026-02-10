'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { read, utils } from 'xlsx'
import { useDispatch } from 'react-redux'
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
import { DataRow, DataType, Notation } from '@/types'
import { setExcelData } from '@/store/volleySlice'

const fileListSchema =
  typeof window === 'undefined' ? z.any() : z.instanceof(FileList)

const FormSchema = z.object({
  file: fileListSchema.optional(),
})

export default function ExcelUploadForm() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  })
  const dispatch = useDispatch()
  const fileRef = form.register('file')

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!data.file || data.file.length !== 1) return

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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
        <FormField
          control={form.control}
          name="file"
          render={() => (
            <FormItem>
              <FormLabel>Stats File</FormLabel>
              <FormControl>
                <Input type="file" accept=".xlsx" {...fileRef} />
              </FormControl>
              <FormDescription>Upload your .xlsx stats file</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="sm" className="w-full">
          Load Stats
        </Button>
      </form>
    </Form>
  )
}
