import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { InputAction, NotionDataRow, TeamInfo, TeamPlayer } from '@/types'

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
  inputMatchName: string
  inputPlayers: string[]
  inputActions: InputAction[]
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
  inputMatchName: '',
  inputPlayers: [],
  inputActions: [],
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
        matchId: string
        matchName: string
        players: string[]
      }>,
    ) {
      state.inputPhase = 'tracking'
      state.inputTeamId = action.payload.teamId
      state.inputMatchId = action.payload.matchId
      state.inputMatchName = action.payload.matchName
      state.inputPlayers = action.payload.players
      state.inputActions = []
    },
    addInputAction(state, action: PayloadAction<InputAction>) {
      state.inputActions.unshift(action.payload)
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
      state.inputMatchName = ''
      state.inputPlayers = []
      state.inputActions = []
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
  addInputAction,
  removeInputAction,
  updateInputAction,
  clearInputSession,
} = volleySlice.actions
export default volleySlice.reducer
