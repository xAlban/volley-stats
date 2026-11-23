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
  // ---- Match state at the moment of the action (undefined for legacy rows) ----
  setNumber?: number
  rotationNumber?: number
  // ---- Rotation reference (setter) position 1-6; undefined = legacy row ----
  setterPosition?: number
  // ---- Court layout P1..P6 at the moment of the action ----
  courtLineup?: CourtSnapshot
  isTeamServing?: boolean
  teamScore?: number
  opponentScore?: number
}

export interface NotionChartData {
  name: string
  '++': number
  '+': number
  '-': number
  '/': number
}

// ---- What the UI emits when the user taps a quality button ----
export interface InputActionDraft {
  id: string
  player: string
  actionType: DataType
  quality: NotionNotation
  timestamp: number
}

// ---- What the reducer stores: draft + match state captured at record time ----
// ---- Court layout snapshot stored with each action: index 0 = P1 ... 5 = P6 ----
export type CourtSnapshotEntry = { name: string; libero: boolean } | null
export type CourtSnapshot = CourtSnapshotEntry[]

// ---- One point played, recorded live (state BEFORE the point) ----
export type RallyWinner = 'team' | 'opponent'
export type RallySource = 'action' | 'manual'

export interface RallyRecord {
  setNumber: number
  teamScore: number
  opponentScore: number
  isTeamServing: boolean
  rotationNumber: number
  setterPosition: number
  courtLineup: CourtSnapshot
  winner: RallyWinner
  source: RallySource
}

// ---- Rally as loaded for analysis ----
export interface RallyRow extends RallyRecord {
  match?: string
  matchId: string
  teamId: string
}

export interface InputAction extends InputActionDraft {
  setNumber: number
  rotationNumber: number
  setterPosition: number | null
  courtLineup: CourtSnapshot | null
  isTeamServing: boolean
  teamScore: number
  opponentScore: number
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
  // ---- Recorded before setter-based rotation tracking ----
  isLegacy: boolean
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

// ---- Lineup draft (player ids) used by match setup and between sets ----
export interface LineupDraft {
  lineup: Record<CourtPosition, string | null>
  // ---- Players designated libero for this set (max 2, never in lineup) ----
  liberoIds: string[]
  // ---- Players the libero automatically replaces in the back row ----
  liberoTargetIds: string[]
  // ---- Rotation reference (setter). null = auto when exactly one setter ----
  referencePlayerId: string | null
  isTeamServing: boolean
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
  // ---- Court position of the rotation reference (setter) at set start.
  //      Its current spot is derived from rotationNumber, so subs and
  //      libero swaps never break it ----
  referenceStartPos: CourtPosition
  isTeamServing: boolean
  // ---- Whether OUR team served first in set 1 — drives serve alternation
  //      between sets (set N+1 first serve flips) ----
  firstServeIsTeam: boolean
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
  // ---- Every point played (actions and manual scoreboard taps) ----
  rallies: RallyRecord[]
  // ---- Libero tracking ----
  // ---- Per-match libero designation (a roster libero may play another role) ----
  liberoIds: string[]
  // ---- Players the libero auto-replaces in the back row; a substitute
  //      inherits this role from the player they replace ----
  liberoTargetIds: string[]
  // ---- Last libero used, preferred when the libero re-enters ----
  activeLiberoId: string | null
  liberoReplacedPlayer: LivePlayer | null
  // ---- Starting lineup of the current set (default for the next set) ----
  setStartDraft: LineupDraft
  // ---- Set finished, waiting for the user to confirm next set lineup ----
  awaitingSetLineup: boolean
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
