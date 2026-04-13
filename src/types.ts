export type DataType = 'attaque' | 'service' | 'défense' | 'réception' | 'bloc'

export enum DataTypeValues {
  ATTACK = 'attaque',
  SERVE = 'service',
  DEFENSE = 'défense',
  RECEP = 'réception',
  BLOCK = 'bloc',
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
  match?: string
  matchId?: string
  teamId?: string
}

export interface NotionChartData {
  name: string
  '++': number
  '+': number
  '-': number
  '/': number
}

export interface InputAction {
  id: string
  player: string
  actionType: DataType
  quality: NotionNotation
  timestamp: number
}

// ---- Multi-team types ----

export interface TeamInfo {
  id: string
  name: string
  role: 'admin' | 'member'
  inviteCode: string
}

export interface TeamPlayer {
  id: string
  teamId: string
  name: string
  isActive: boolean
}

export interface TeamMemberInfo {
  id: string
  userId: string
  username: string
  role: 'admin' | 'member'
  joinedAt: string
}

export interface TeamOverview {
  id: string
  name: string
  role: 'admin' | 'member'
  matchCount: number
  statsCount: number
  playerCount: number
}

export interface MatchInfo {
  id: string
  name: string
  teamId: string
  actionCount: number
  createdAt: string
}

export const notionNotationLabels: Record<
  DataType,
  Record<NotionNotation, string>
> = {
  attaque: {
    '++': 'Kill',
    '+': 'Good',
    '-': 'Too easy',
    '/': 'Error',
  },
  défense: {
    '++': 'Perfect',
    '+': 'Good',
    '-': 'Difficult',
    '/': 'Error',
  },
  réception: {
    '++': 'Perfect',
    '+': 'Good',
    '-': 'Bad',
    '/': 'Error',
  },
  service: {
    '++': 'Ace',
    '+': 'Good',
    '-': 'Too easy',
    '/': 'Error',
  },
  bloc: {
    '++': 'Kill',
    '+': 'Touch',
    '-': 'Poor',
    '/': 'Error',
  },
}
