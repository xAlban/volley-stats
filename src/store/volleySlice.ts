import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { InputAction, NotionDataRow } from '@/types'

type Section = 'home' | 'charts' | 'analysis' | 'input' | 'profile'

interface VolleyState {
  currentSection: Section
  supabaseRows: NotionDataRow[]
  supabaseAllPlayers: string[]
  supabaseSelectedPlayers: string[]
  supabaseAllMatches: string[]
  supabaseSelectedMatch: string | 'all'
  // ---- Input tracking state ----
  inputPhase: 'setup' | 'tracking'
  inputMatchName: string
  inputPlayers: string[]
  inputActions: InputAction[]
}

const initialState: VolleyState = {
  currentSection: 'home',
  supabaseRows: [],
  supabaseAllPlayers: [],
  supabaseSelectedPlayers: [],
  supabaseAllMatches: [],
  supabaseSelectedMatch: 'all',
  inputPhase: 'setup',
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
    // ---- Input tracking reducers ----
    startTracking(
      state,
      action: PayloadAction<{ matchName: string; players: string[] }>,
    ) {
      state.inputPhase = 'tracking'
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
      state.inputMatchName = ''
      state.inputPlayers = []
      state.inputActions = []
    },
  },
})

export const {
  setCurrentSection,
  setSupabaseData,
  setSupabaseSelectedPlayers,
  setSupabaseSelectedMatch,
  startTracking,
  addInputAction,
  removeInputAction,
  updateInputAction,
  clearInputSession,
} = volleySlice.actions
export default volleySlice.reducer
