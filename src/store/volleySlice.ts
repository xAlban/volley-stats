import { createSlice, current, PayloadAction } from '@reduxjs/toolkit'
import {
  InputAction,
  InputActionDraft,
  NotionDataRow,
  TeamInfo,
  TeamPlayer,
  LiveMatchState,
  LivePlayer,
  CourtPosition,
  LineupDraft,
  RallyRow,
  RallySource,
  RallyWinner,
} from '@/types'
import {
  allMatchPlayers,
  applySubstitution,
  autoHandleLibero,
  buildLineupFromDraft,
  courtSnapshot,
  currentSetterPosition,
  effectiveLiberoTargets,
  emptyLineup,
  liberoExit,
  referenceStartPosition,
  rotateClockwise,
} from '@/utils/rotation'

type Section = 'home' | 'charts' | 'analysis' | 'input' | 'profile' | 'team'

interface VolleyState {
  currentSection: Section
  // ---- Multi-team state ----
  userTeams: TeamInfo[]
  teamRoster: TeamPlayer[]
  // ---- Supabase data (across all teams user belongs to) ----
  supabaseRows: NotionDataRow[]
  supabaseRallies: RallyRow[]
  supabaseAllPlayers: string[]
  supabaseSelectedPlayers: string[]
  supabaseAllMatches: string[]
  supabaseSelectedMatch: string | 'all'
  supabaseSelectedTeams: string[]
  // ---- Input tracking state ----
  inputPhase: 'setup' | 'tracking'
  inputTeamId: string | null
  inputMatchId: string | null
  inputOpponentName: string
  inputMatchDate: string
  inputPlayers: string[]
  inputActions: InputAction[]
  // ---- Live match state (rotation + scoring) ----
  liveMatch: LiveMatchState | null
  // ---- Snapshots taken before each live-match change, for undo ----
  liveUndoStack: { snapshot: LiveMatchState; actionId: string | null }[]
}

const initialState: VolleyState = {
  currentSection: 'home',
  userTeams: [],
  teamRoster: [],
  supabaseRows: [],
  supabaseRallies: [],
  supabaseAllPlayers: [],
  supabaseSelectedPlayers: [],
  supabaseAllMatches: [],
  supabaseSelectedMatch: 'all',
  supabaseSelectedTeams: [],
  inputPhase: 'setup',
  inputTeamId: null,
  inputMatchId: null,
  inputOpponentName: '',
  inputMatchDate: '',
  inputPlayers: [],
  inputActions: [],
  liveMatch: null,
  liveUndoStack: [],
}

// ---- Snapshot live match before a mutation so it can be undone ----
const MAX_UNDO = 100
function pushUndo(state: VolleyState, actionId: string | null) {
  if (!state.liveMatch) return
  state.liveUndoStack.push({
    snapshot: current(state.liveMatch),
    actionId,
  })
  if (state.liveUndoStack.length > MAX_UNDO) state.liveUndoStack.shift()
}

// ---- Log the rally with the state BEFORE the point is applied ----
function logRally(
  match: LiveMatchState,
  winner: RallyWinner,
  source: RallySource,
) {
  match.rallies.push({
    setNumber: match.currentSet,
    teamScore: match.teamScore,
    opponentScore: match.opponentScore,
    isTeamServing: match.isTeamServing,
    rotationNumber: match.rotationNumber,
    setterPosition: currentSetterPosition(match),
    courtLineup: courtSnapshot(match),
    winner,
    source,
  })
}

// ---- Point won by our team: side-out rotates (flip serve BEFORE rotating so
//      the libero logic sees we now serve and keeps the libero off P1) ----
function applyTeamPoint(match: LiveMatchState, source: RallySource) {
  logRally(match, 'team', source)
  match.teamScore++
  if (!match.isTeamServing) {
    match.isTeamServing = true
    rotateClockwise(match)
  }
  const winner = checkSetWin(match)
  if (winner) finalizeSet(match, winner)
}

// ---- Point won by opponent: we lose the serve, libero may now take P1 ----
function applyOpponentPoint(match: LiveMatchState, source: RallySource) {
  logRally(match, 'opponent', source)
  match.opponentScore++
  if (match.isTeamServing) {
    match.isTeamServing = false
    autoHandleLibero(match)
  }
  const winner = checkSetWin(match)
  if (winner) finalizeSet(match, winner)
}

// ---- Helper: check if the current set is won ----
function checkSetWin(match: LiveMatchState): 'team' | 'opponent' | null {
  const minPoints = match.currentSet >= 5 ? 15 : 25
  const { teamScore, opponentScore } = match

  if (teamScore >= minPoints && teamScore - opponentScore >= 2) return 'team'
  if (opponentScore >= minPoints && opponentScore - teamScore >= 2)
    return 'opponent'
  return null
}

// ---- Helper: finalize set ----
function finalizeSet(match: LiveMatchState, winner: 'team' | 'opponent') {
  match.completedSets.push({
    setNumber: match.currentSet,
    teamScore: match.teamScore,
    opponentScore: match.opponentScore,
  })

  if (winner === 'team') match.setsWon++
  else match.setsLost++

  match.teamScore = 0
  match.opponentScore = 0
  match.currentSet++
  match.subsUsedThisSet = 0

  // ---- Libero leaves: every set starts from a regular 6-player lineup ----
  liberoExit(match)

  // ---- First serve alternates each set: odd sets match set-1, even flip.
  //      (Deciding set is a new toss: user can change it in the dialog) ----
  match.isTeamServing =
    match.currentSet % 2 === 1
      ? match.firstServeIsTeam
      : !match.firstServeIsTeam

  // ---- Ask for the next set lineup unless the match is over ----
  const matchOver = match.setsWon >= 3 || match.setsLost >= 3
  match.awaitingSetLineup = !matchOver
}

// ---- Initialise a set from a lineup draft (match start or between sets) ----
function applySetLineup(
  match: LiveMatchState,
  players: LivePlayer[],
  draft: LineupDraft,
) {
  const { courtLineup, benchPlayers } = buildLineupFromDraft(players, draft)
  match.courtLineup = courtLineup
  match.benchPlayers = benchPlayers
  match.liberoIds = draft.liberoIds
  match.liberoTargetIds = effectiveLiberoTargets(draft)
  match.activeLiberoId = draft.liberoIds[0] ?? null
  match.liberoReplacedPlayer = null
  match.isTeamServing = draft.isTeamServing
  match.rotationNumber = 1
  // ---- Fallback P1 only if the draft skipped validation ----
  match.referenceStartPos = referenceStartPosition(draft, players) ?? 1
  match.setStartDraft = draft
  match.awaitingSetLineup = false
  autoHandleLibero(match)
}

const volleySlice = createSlice({
  name: 'volley',
  initialState,
  reducers: {
    setCurrentSection(state, action: PayloadAction<Section>) {
      state.currentSection = action.payload
    },

    // ---- Multi-team reducers ----
    setUserTeams(state, action: PayloadAction<TeamInfo[]>) {
      state.userTeams = action.payload
    },
    setTeamRoster(state, action: PayloadAction<TeamPlayer[]>) {
      state.teamRoster = action.payload
    },

    // ---- Supabase data reducers ----
    setSupabaseData(
      state,
      action: PayloadAction<{
        rows: NotionDataRow[]
        rallies: RallyRow[]
        allPlayers: string[]
        allMatches: string[]
      }>,
    ) {
      state.supabaseRows = action.payload.rows
      state.supabaseRallies = action.payload.rallies
      state.supabaseAllPlayers = action.payload.allPlayers
      state.supabaseSelectedPlayers = action.payload.allPlayers
      state.supabaseAllMatches = action.payload.allMatches
      state.supabaseSelectedMatch = 'all'
    },
    setSupabaseSelectedPlayers(state, action: PayloadAction<string[]>) {
      state.supabaseSelectedPlayers = action.payload
    },
    setSupabaseSelectedMatch(state, action: PayloadAction<string | 'all'>) {
      state.supabaseSelectedMatch = action.payload
    },
    setSupabaseSelectedTeams(state, action: PayloadAction<string[]>) {
      state.supabaseSelectedTeams = action.payload
    },

    // ---- Input tracking reducers ----
    startTracking(
      state,
      action: PayloadAction<{
        teamId: string
        matchId: string | null
        opponentName: string
        matchDate: string
        // ---- All players taking part in the match (libero flag ignored,
        //      designation comes from the draft) ----
        players: LivePlayer[]
        draft: LineupDraft
      }>,
    ) {
      const { players, draft } = action.payload
      state.inputPhase = 'tracking'
      state.inputTeamId = action.payload.teamId
      state.inputMatchId = action.payload.matchId
      state.inputOpponentName = action.payload.opponentName
      state.inputMatchDate = action.payload.matchDate
      state.inputPlayers = players.map((p) => p.name).sort()
      state.inputActions = []
      state.liveUndoStack = []
      const match: LiveMatchState = {
        courtLineup: emptyLineup(),
        benchPlayers: [],
        rotationNumber: 1,
        referenceStartPos: 1,
        isTeamServing: draft.isTeamServing,
        firstServeIsTeam: draft.isTeamServing,
        substitutions: [],
        subsUsedThisSet: 0,
        maxSubsPerSet: 12,
        opponentName: action.payload.opponentName,
        currentSet: 1,
        teamScore: 0,
        opponentScore: 0,
        setsWon: 0,
        setsLost: 0,
        completedSets: [],
        rallies: [],
        liberoIds: [],
        liberoTargetIds: [],
        activeLiberoId: null,
        liberoReplacedPlayer: null,
        setStartDraft: draft,
        awaitingSetLineup: false,
        selectedPlayerId: null,
      }
      // ---- Build court/bench + auto-handle libero for initial lineup ----
      applySetLineup(match, players, draft)
      state.liveMatch = match
    },

    // ---- Confirm the lineup of the next set ----
    startNextSet(state, action: PayloadAction<LineupDraft>) {
      const lm = state.liveMatch
      if (!lm) return
      pushUndo(state, null)
      applySetLineup(lm, allMatchPlayers(lm), action.payload)
    },

    // ---- Record action with auto-scoring and auto-rotation ----
    // ---- Captures match state BEFORE applying side effects so each action
    //      reflects the situation at the moment it was tapped ----
    recordAction(state, action: PayloadAction<InputActionDraft>) {
      const lm = state.liveMatch
      const enriched: InputAction = {
        ...action.payload,
        setNumber: lm?.currentSet ?? 1,
        rotationNumber: lm?.rotationNumber ?? 1,
        setterPosition: lm ? currentSetterPosition(lm) : null,
        courtLineup: lm ? courtSnapshot(lm) : null,
        isTeamServing: lm?.isTeamServing ?? true,
        teamScore: lm?.teamScore ?? 0,
        opponentScore: lm?.opponentScore ?? 0,
      }
      pushUndo(state, enriched.id)
      state.inputActions.unshift(enriched)

      if (!state.liveMatch) return
      const { actionType, quality } = action.payload

      // ---- Auto-score: direct points ----
      if (
        quality === '++' &&
        (actionType === 'attaque' ||
          actionType === 'service' ||
          actionType === 'bloc')
      ) {
        applyTeamPoint(state.liveMatch, 'action')
      } else if (quality === '/') {
        // ---- Team error → opponent point ----
        applyOpponentPoint(state.liveMatch, 'action')
      }
    },

    // ---- Keep addInputAction for backward compat ----
    addInputAction(state, action: PayloadAction<InputActionDraft>) {
      const lm = state.liveMatch
      const enriched: InputAction = {
        ...action.payload,
        setNumber: lm?.currentSet ?? 1,
        rotationNumber: lm?.rotationNumber ?? 1,
        setterPosition: lm ? currentSetterPosition(lm) : null,
        courtLineup: lm ? courtSnapshot(lm) : null,
        isTeamServing: lm?.isTeamServing ?? true,
        teamScore: lm?.teamScore ?? 0,
        opponentScore: lm?.opponentScore ?? 0,
      }
      state.inputActions.unshift(enriched)
    },

    // ---- Removing the latest action also reverts the score/rotation it
    //      caused; older actions only remove the stat ----
    removeInputAction(state, action: PayloadAction<string>) {
      const top = state.liveUndoStack[state.liveUndoStack.length - 1]
      if (top && top.actionId === action.payload) {
        state.liveUndoStack.pop()
        state.liveMatch = top.snapshot
      } else {
        // ---- Drop the action id from older undo entries so undo won't
        //      try to remove it again ----
        for (const entry of state.liveUndoStack) {
          if (entry.actionId === action.payload) entry.actionId = null
        }
      }
      state.inputActions = state.inputActions.filter(
        (a) => a.id !== action.payload,
      )
    },
    updateInputAction(
      state,
      action: PayloadAction<{ id: string } & Partial<InputAction>>,
    ) {
      const { id, ...updates } = action.payload
      const idx = state.inputActions.findIndex((a) => a.id === id)
      if (idx !== -1) {
        state.inputActions[idx] = { ...state.inputActions[idx], ...updates }
      }
    },

    // ---- Undo the last live-match change (point, sub, rotation, set) ----
    undoLast(state) {
      const entry = state.liveUndoStack.pop()
      if (!entry) return
      state.liveMatch = entry.snapshot
      if (entry.actionId) {
        state.inputActions = state.inputActions.filter(
          (a) => a.id !== entry.actionId,
        )
      }
    },

    clearInputSession(state) {
      state.inputPhase = 'setup'
      state.inputTeamId = null
      state.inputMatchId = null
      state.inputOpponentName = ''
      state.inputMatchDate = ''
      state.inputPlayers = []
      state.inputActions = []
      state.liveMatch = null
      state.liveUndoStack = []
    },

    // ---- Live match reducers ----
    selectPlayer(state, action: PayloadAction<string | null>) {
      if (state.liveMatch) {
        state.liveMatch.selectedPlayerId = action.payload
      }
    },

    scoreTeamPoint(state) {
      if (!state.liveMatch) return
      pushUndo(state, null)
      applyTeamPoint(state.liveMatch, 'manual')
    },

    scoreOpponentPoint(state) {
      if (!state.liveMatch) return
      pushUndo(state, null)
      applyOpponentPoint(state.liveMatch, 'manual')
    },

    setScore(
      state,
      action: PayloadAction<{ teamScore: number; opponentScore: number }>,
    ) {
      if (!state.liveMatch) return
      pushUndo(state, null)
      state.liveMatch.teamScore = action.payload.teamScore
      state.liveMatch.opponentScore = action.payload.opponentScore
    },

    // ---- Manual correction: rotate without changing the score ----
    rotateLineup(state) {
      if (!state.liveMatch) return
      pushUndo(state, null)
      rotateClockwise(state.liveMatch)
    },

    // ---- Manual correction: toggle who is serving ----
    toggleServing(state) {
      if (!state.liveMatch) return
      pushUndo(state, null)
      state.liveMatch.isTeamServing = !state.liveMatch.isTeamServing
      autoHandleLibero(state.liveMatch)
    },

    substitutePlayer(
      state,
      action: PayloadAction<{
        courtPosition: CourtPosition
        benchPlayerId: string
      }>,
    ) {
      if (!state.liveMatch) return
      const { courtPosition, benchPlayerId } = action.payload
      const snapshot = current(state.liveMatch)
      // ---- Rule checks + swap + libero tracking live in the rule engine ----
      const result = applySubstitution(
        state.liveMatch,
        courtPosition,
        benchPlayerId,
      )
      if (!result) return
      state.liveUndoStack.push({ snapshot, actionId: null })
      if (state.liveUndoStack.length > MAX_UNDO) state.liveUndoStack.shift()

      state.liveMatch.substitutions.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        setNumber: state.liveMatch.currentSet,
        playerIn: result.playerIn.name,
        playerOut: result.playerOut.name,
        courtPosition,
        timestamp: Date.now(),
        isLiberoSub: result.kind !== 'regular',
      })
    },
  },
})

export const {
  setCurrentSection,
  setUserTeams,
  setTeamRoster,
  setSupabaseData,
  setSupabaseSelectedPlayers,
  setSupabaseSelectedMatch,
  setSupabaseSelectedTeams,
  startTracking,
  recordAction,
  addInputAction,
  removeInputAction,
  updateInputAction,
  clearInputSession,
  selectPlayer,
  scoreTeamPoint,
  scoreOpponentPoint,
  setScore,
  rotateLineup,
  toggleServing,
  substitutePlayer,
  startNextSet,
  undoLast,
} = volleySlice.actions
export default volleySlice.reducer
