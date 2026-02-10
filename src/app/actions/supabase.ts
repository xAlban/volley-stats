'use server'

import { supabase } from '@/lib/supabase'
import {
  NotionDataRow,
  NotionDataRowWithId,
  NotionNotation,
  DataType,
} from '@/types'

const PAGE_SIZE = 1000

export async function fetchSupabaseData(): Promise<{
  rows: NotionDataRow[]
  allPlayers: string[]
  allMatches: string[]
}> {
  const players = new Set<string>()
  const matches = new Set<string>()
  const rows: NotionDataRow[] = []

  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('stats')
      .select('player, action_type, quality, match')
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw new Error(error.message)

    for (const row of data) {
      players.add(row.player)
      if (row.match) matches.add(row.match)
      rows.push({
        name: row.player,
        value: row.quality as NotionNotation,
        type: row.action_type as DataType,
        match: row.match ?? undefined,
      })
    }

    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return {
    rows,
    allPlayers: Array.from(players),
    allMatches: Array.from(matches),
  }
}

const BATCH_SIZE = 500

export async function syncNotionToSupabase(
  rows: NotionDataRowWithId[],
): Promise<{ inserted: number }> {
  let inserted = 0

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE).map((r) => ({
      notion_page_id: r.notionPageId,
      player: r.name,
      action_type: r.type,
      quality: r.value,
      match: r.match ?? null,
    }))

    const { data, error } = await supabase
      .from('stats')
      .upsert(batch, { onConflict: 'notion_page_id' })
      .select()

    if (error) throw new Error(error.message)
    inserted += data?.length ?? 0
  }

  return { inserted }
}
