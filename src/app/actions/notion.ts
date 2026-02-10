'use server'

export const maxDuration = 60

import { Client } from '@notionhq/client'
import { NotionDataRow, NotionNotation, actionNameMap } from '@/types'

const validNotionNotations = new Set<string>(['++', '+', '-', '/'])

function getTextProperty(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any,
  propertyName: string,
): string {
  const prop = page.properties[propertyName]
  if (!prop) return ''

  switch (prop.type) {
    case 'title':
      return prop.title?.[0]?.plain_text ?? ''
    case 'rich_text':
      return prop.rich_text?.[0]?.plain_text ?? ''
    case 'select':
      return prop.select?.name ?? ''
    default:
      return ''
  }
}

export async function fetchNotionData(): Promise<{
  rows: NotionDataRow[]
  allPlayers: string[]
  allMatches: string[]
}> {
  const apiKey = process.env.NOTION_API_KEY
  const databaseId = process.env.NOTION_DATABASE_ID

  if (!apiKey || !databaseId) {
    throw new Error(
      'Missing NOTION_API_KEY or NOTION_DATABASE_ID environment variables',
    )
  }

  const notion = new Client({ auth: apiKey })

  const allPages = []
  let cursor: string | undefined = undefined

  do {
    const response = await notion.dataSources.query({
      data_source_id: databaseId,
      start_cursor: cursor,
      page_size: 100,
    })

    allPages.push(...response.results)
    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined
  } while (cursor)

  const players = new Set<string>()
  const matches = new Set<string>()
  const rows: NotionDataRow[] = []

  for (const page of allPages) {
    const actionName = getTextProperty(page, 'Action Type')
    const quality = getTextProperty(page, 'Quality')
    const player = getTextProperty(page, 'Player')
    const match = getTextProperty(page, 'Match')

    const mappedType = actionNameMap[actionName.toLowerCase()]

    if (!mappedType || !validNotionNotations.has(quality) || !player) continue

    players.add(player)
    if (match) matches.add(match)
    rows.push({
      name: player,
      value: quality as NotionNotation,
      type: mappedType,
      match: match || undefined,
    })
  }

  return {
    rows,
    allPlayers: Array.from(players),
    allMatches: Array.from(matches),
  }
}
