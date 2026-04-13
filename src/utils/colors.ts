import { DataType, NotionNotation } from '../types'

const notionNotationColorMap: Record<NotionNotation, string> = {
  '++': 'var(--stat-excellent)',
  '+': 'var(--stat-positive)',
  '-': 'var(--stat-attempt)',
  '/': 'var(--stat-error)',
}

export const getNotionColorFromStats = (
  _type: DataType,
  value: NotionNotation,
) => {
  return notionNotationColorMap[value]
}
