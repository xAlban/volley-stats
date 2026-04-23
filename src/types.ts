export type DataType =
  | 'attaque'
  | 'service'
  | 'défense'
  | 'réception'
  | 'bloc'
  | 'passe'

export enum DataTypeValues {
  ATTACK = 'attaque',
  SERVE = 'service',
  DEFENSE = 'défense',
  RECEP = 'réception',
  BLOCK = 'bloc',
  SET = 'passe',
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
  jerseyNumber: number | null
  position: string | null
  isLibero: boolean
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
  teamId: string
  opponentName: string
  matchDate: string
  actionCount: number
  createdAt: string
  teamScore?: number | null
  opponentScore?: number | null
  setsWon?: number | null
  setsLost?: number | null
  completedSets?: SetResult[] | null
}

// ---- Court position types (P1-P6 per volleyball convention) ----

export type CourtPosition = 1 | 2 | 3 | 4 | 5 | 6

export const COURT_POSITIONS: CourtPosition[] = [1, 2, 3, 4, 5, 6]

export interface LivePlayer {
  playerId: string
  name: string
  jerseyNumber: number | null
  position: string | null
  isLibero: boolean
}

export type CourtLineup = Record<CourtPosition, LivePlayer | null>

export interface Substitution {
  id: string
  setNumber: number
  playerIn: string
  playerOut: string
  courtPosition: CourtPosition
  timestamp: number
  isLiberoSub: boolean
}

export interface SetResult {
  setNumber: number
  teamScore: number
  opponentScore: number
}

export interface LiveMatchState {
  // ---- Rotation ----
  courtLineup: CourtLineup
  benchPlayers: LivePlayer[]
  rotationNumber: number
  isTeamServing: boolean
  substitutions: Substitution[]
  subsUsedThisSet: number
  maxSubsPerSet: number
  // ---- Scoring ----
  opponentName: string
  currentSet: number
  teamScore: number
  opponentScore: number
  setsWon: number
  setsLost: number
  completedSets: SetResult[]
  // ---- Libero tracking ----
  liberoReplacedPlayer: LivePlayer | null
  // ---- Selected player for action recording ----
  selectedPlayerId: string | null
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
  passe: {
    '++': 'Perfect',
    '+': 'Good',
    '-': 'Bad',
    '/': 'Error',
  },
}
