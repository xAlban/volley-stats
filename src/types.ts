export type Notation = '#' | '+' | '-' | '=' | '!' | '/'
export type DataType = 'attaque' | 'service' | 'défense' | 'réception' | 'bloc'

export enum NotationValues {
  HASHTAG = '#',
  PLUS = '+',
  MINUS = '-',
  EQUAL = '=',
  EXCLAMATION = '!',
  SLASH = '/',
}
export enum DataTypeValues {
  ATTACK = 'attaque',
  SERVE = 'service',
  DEFENSE = 'défense',
  RECEP = 'réception',
  BLOCK = 'bloc',
}

export interface DataRow {
  name: string
  value: Notation
  type: DataType
}

export interface ChartData {
  name: string
  '#': number
  '+': number
  '-': number
  '=': number
  '!': number
  '/': number
}

export type NotionNotation = '++' | '+' | '-' | '/'

export enum NotionNotationValues {
  DOUBLE_PLUS = '++',
  PLUS = '+',
  MINUS = '-',
  SLASH = '/',
}

export interface NotionDataRow {
  name: string
  value: NotionNotation
  type: DataType
}

export interface NotionChartData {
  name: string
  '++': number
  '+': number
  '-': number
  '/': number
}

export const actionNameMap: Record<string, DataType> = {
  attaque: 'attaque',
  attack: 'attaque',
  defense: 'défense',
  défense: 'défense',
  reception: 'réception',
  réception: 'réception',
  service: 'service',
  block: 'bloc',
  bloc: 'bloc',
}
