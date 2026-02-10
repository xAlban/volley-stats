import { DataType, Notation, NotionNotation } from '../types'

const notationColorMap: Record<Notation, string> = {
  '#': 'var(--stat-excellent)',
  '+': 'var(--stat-positive)',
  '!': 'var(--stat-neutral)',
  '-': 'var(--stat-attempt)',
  '/': 'var(--stat-negative)',
  '=': 'var(--stat-error)',
}

const notionNotationColorMap: Record<NotionNotation, string> = {
  '++': 'var(--stat-excellent)',
  '+': 'var(--stat-positive)',
  '-': 'var(--stat-attempt)',
  '/': 'var(--stat-error)',
}

export const getColorFromStats = (_type: DataType, value: Notation) => {
  return notationColorMap[value]
}

export const getNotionColorFromStats = (
  _type: DataType,
  value: NotionNotation,
) => {
  return notionNotationColorMap[value]
}
