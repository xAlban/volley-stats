import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  InputAction,
  InputActionDraft,
  NotionDataRow,
  TeamInfo,
  TeamPlayer,
  LiveMatchState,
  LivePlayer,
  CourtLineup,
  CourtPosition,
} from '@/types'

type Section = 'home' | 'charts' | 'analysis' | 'input' | 'profile' | 'team'

interface VolleyState {
  currentSection: Section
  // ---- Multi-team state ----
  userTeams: TeamInfo[]
  teamRoster: TeamPlayer[]
  // ---- Supabase data (across all teams user belongs to) ----
  supabaseRows: NotionDataRow[]
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
}

const initialState: VolleyState = {
  currentSection: 'home',
  userTeams: [],
  teamRoster: [],
  supabaseRows: [],
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
}

// ---- Helper: rotate lineup clockwise (volleyball convention) ----
function rotateLineupHelper(match: LiveMatchState) {
  const old = { ...match.courtLineup }
  match.courtLineup[1] = old[2]
  match.courtLineup[2] = old[3]
  match.courtLineup[3] = old[4]
  match.courtLineup[4] = old[5]
  match.courtLineup[5] = old[6]
  match.courtLineup[6] = old[1]
  match.rotationNumber = (match.rotationNumber % 6) + 1
  autoHandleLibero(match)
}

// ---- Helper: auto-sub libero for MB in back row ----
// ---- P1 is the server slot. The libero may not serve, so when we are
//      serving the libero must NOT be at P1 (MB stays in to serve). When we
//      are receiving, the libero may take P1 from the MB. ----
function autoHandleLibero(match: LiveMatchState) {
  const liberoForbidden: CourtPosition[] = match.isTeamServing
    ? [1, 2, 3, 4]
    : [2, 3, 4]
  const liberoAllowed: CourtPosition[] = match.isTeamServing
    ? [5, 6]
    : [1, 5, 6]

  // ---- Sub libero out of any forbidden position ----
  for (const pos of liberoForbidden) {
    const player = match.courtLineup[pos]
    if (player?.isLibero && match.liberoReplacedPlayer) {
      match.courtLineup[pos] = match.liberoReplacedPlayer
      match.benchPlayers.push(player)
      match.benchPlayers = match.benchPlayers.filter(
        (p) => p.playerId !== match.liberoReplacedPlayer!.playerId,
      )
      match.liberoReplacedPlayer = null
    }
  }

  // ---- If MB is in an allowed slot and libero is on bench, swap in ----
  if (!match.liberoReplacedPlayer) {
    const libero = match.benchPlayers.find((p) => p.isLibero)
    if (libero) {
      for (const pos of liberoAllowed) {
        const player = match.courtLineup[pos]
        if (player && player.position === 'MB' && !player.isLibero) {
          match.liberoReplacedPlayer = player
          match.courtLineup[pos] = libero
          match.benchPlayers = match.benchPlayers.filter(
            (p) => p.playerId !== libero.playerId,
          )
          match.benchPlayers.push(player)
          break
        }
      }
    }
  }
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

  // ---- First serve alternates each set: odd sets match set-1, even flip ----
  match.isTeamServing =
    match.currentSet % 2 === 1
      ? match.firstServeIsTeam
      : !match.firstServeIsTeam
  // ---- Re-evaluate libero placement under the new serving state ----
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
        allPlayers: string[]
        allMatches: string[]
      }>,
    ) {
      state.supabaseRows = action.payload.rows
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
        players: string[]
        courtLineup: CourtLineup
        benchPlayers: LivePlayer[]
        isTeamServing: boolean
      }>,
    ) {
      state.inputPhase = 'tracking'
      state.inputTeamId = action.payload.teamId
      state.inputMatchId = action.payload.matchId
      state.inputOpponentName = action.payload.opponentName
      state.inputMatchDate = action.payload.matchDate
      state.inputPlayers = action.payload.players
      state.inputActions = []
      state.liveMatch = {
        courtLineup: action.payload.courtLineup,
        benchPlayers: action.payload.benchPlayers,
        rotationNumber: 1,
        isTeamServing: action.payload.isTeamServing,
        firstServeIsTeam: action.payload.isTeamServing,
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
        liberoReplacedPlayer: null,
        selectedPlayerId: null,
      }
      // ---- Auto-handle libero for initial lineup ----
      autoHandleLibero(state.liveMatch)
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
        isTeamServing: lm?.isTeamServing ?? true,
        teamScore: lm?.teamScore ?? 0,
        opponentScore: lm?.opponentScore ?? 0,
      }
      state.inputActions.unshift(enriched)

      if (!lm) return
      const { actionType, quality } = action.payload

      // ---- Auto-score: direct points ----
      if (
        quality === '++' &&
        (actionType === 'attaque' ||
          actionType === 'service' ||
          actionType === 'bloc')
      ) {
        lm.teamScore++
        // ---- Side-out: team wins point while receiving → rotate ----
        // ---- Flip serving BEFORE rotating so autoHandleLibero (called from
        //      rotateLineupHelper) sees the new serving state and pulls the
        //      libero out of P1 if needed ----
        if (!lm.isTeamServing) {
          lm.isTeamServing = true
          rotateLineupHelper(lm)
        }
        const winner = checkSetWin(lm)
        if (winner) finalizeSet(lm, winner)
      } else if (quality === '/') {
        // ---- Team error → opponent point ----
        lm.opponentScore++
        if (lm.isTeamServing) {
          lm.isTeamServing = false
          // ---- Lost serve: libero may now come in for MB at P1 ----
          autoHandleLibero(lm)
        }
        const winner = checkSetWin(lm)
        if (winner) finalizeSet(lm, winner)
      }
    },

    // ---- Keep addInputAction for backward compat ----
    addInputAction(state, action: PayloadAction<InputActionDraft>) {
      const lm = state.liveMatch
      const enriched: InputAction = {
        ...action.payload,
        setNumber: lm?.currentSet ?? 1,
        rotationNumber: lm?.rotationNumber ?? 1,
        isTeamServing: lm?.isTeamServing ?? true,
        teamScore: lm?.teamScore ?? 0,
        opponentScore: lm?.opponentScore ?? 0,
      }
      state.inputActions.unshift(enriched)
    },

    removeInputAction(state, action: PayloadAction<string>) {
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

    clearInputSession(state) {
      state.inputPhase = 'setup'
      state.inputTeamId = null
      state.inputMatchId = null
      state.inputOpponentName = ''
      state.inputMatchDate = ''
      state.inputPlayers = []
      state.inputActions = []
      state.liveMatch = null
    },

    // ---- Live match reducers ----
    selectPlayer(state, action: PayloadAction<string | null>) {
      if (state.liveMatch) {
        state.liveMatch.selectedPlayerId = action.payload
      }
    },

    scoreTeamPoint(state) {
      if (!state.liveMatch) return
      state.liveMatch.teamScore++
      if (!state.liveMatch.isTeamServing) {
        // ---- Flip BEFORE rotate so autoHandleLibero sees we're now serving ----
        state.liveMatch.isTeamServing = true
        rotateLineupHelper(state.liveMatch)
      }
      const winner = checkSetWin(state.liveMatch)
      if (winner) finalizeSet(state.liveMatch, winner)
    },

    scoreOpponentPoint(state) {
      if (!state.liveMatch) return
      state.liveMatch.opponentScore++
      if (state.liveMatch.isTeamServing) {
        state.liveMatch.isTeamServing = false
        // ---- Lost serve: libero may now come in for MB at P1 ----
        autoHandleLibero(state.liveMatch)
      }
      const winner = checkSetWin(state.liveMatch)
      if (winner) finalizeSet(state.liveMatch, winner)
    },

    setScore(
      state,
      action: PayloadAction<{ teamScore: number; opponentScore: number }>,
    ) {
      if (!state.liveMatch) return
      state.liveMatch.teamScore = action.payload.teamScore
      state.liveMatch.opponentScore = action.payload.opponentScore
    },

    rotateLineup(state) {
      if (!state.liveMatch) return
      rotateLineupHelper(state.liveMatch)
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
      const courtPlayer = state.liveMatch.courtLineup[courtPosition]
      const benchPlayer = state.liveMatch.benchPlayers.find(
        (p) => p.playerId === benchPlayerId,
      )
      if (!courtPlayer || !benchPlayer) return

      // ---- Check if this is a libero sub (doesn't count) ----
      const isLiberoSub = courtPlayer.isLibero || benchPlayer.isLibero

      // ---- Swap players ----
      state.liveMatch.courtLineup[courtPosition] = benchPlayer
      state.liveMatch.benchPlayers = state.liveMatch.benchPlayers.filter(
        (p) => p.playerId !== benchPlayerId,
      )
      state.liveMatch.benchPlayers.push(courtPlayer)

      if (!isLiberoSub) {
        state.liveMatch.subsUsedThisSet++
      }

      // ---- Record substitution ----
      state.liveMatch.substitutions.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        setNumber: state.liveMatch.currentSet,
        playerIn: benchPlayer.name,
        playerOut: courtPlayer.name,
        courtPosition,
        timestamp: Date.now(),
        isLiberoSub,
      })

      // ---- Update libero tracking ----
      if (benchPlayer.isLibero) {
        state.liveMatch.liberoReplacedPlayer = courtPlayer
      } else if (courtPlayer.isLibero) {
        state.liveMatch.liberoReplacedPlayer = null
      }
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
  substitutePlayer,
} = volleySlice.actions
export default volleySlice.reducer
