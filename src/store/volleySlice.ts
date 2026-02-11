import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  DataRow,
  InputAction,
  NotionDataRow,
  NotionDataRowWithId,
} from '@/types'

type Section = 'home' | 'charts' | 'analysis' | 'input' | 'old'

interface VolleyState {
  currentSection: Section
  activeTab: 'notion' | 'excel' | 'supabase'
  excelRows: DataRow[]
  excelAllPlayers: string[]
  excelSelectedPlayers: string[]
  notionRows: NotionDataRowWithId[]
  notionAllPlayers: string[]
  notionSelectedPlayers: string[]
  notionAllMatches: string[]
  notionSelectedMatch: string | 'all'
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
  activeTab: 'supabase',
  excelRows: [],
  excelAllPlayers: [],
  excelSelectedPlayers: [],
  notionRows: [],
  notionAllPlayers: [],
  notionSelectedPlayers: [],
  notionAllMatches: [],
  notionSelectedMatch: 'all',
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
    setActiveTab(
      state,
      action: PayloadAction<'notion' | 'excel' | 'supabase'>,
    ) {
      state.activeTab = action.payload
    },
    setExcelData(
      state,
      action: PayloadAction<{ rows: DataRow[]; allPlayers: string[] }>,
    ) {
      state.excelRows = action.payload.rows
      state.excelAllPlayers = action.payload.allPlayers
      state.excelSelectedPlayers = action.payload.allPlayers
    },
    setExcelSelectedPlayers(state, action: PayloadAction<string[]>) {
      state.excelSelectedPlayers = action.payload
    },
    setNotionData(
      state,
      action: PayloadAction<{
        rows: NotionDataRowWithId[]
        allPlayers: string[]
        allMatches: string[]
      }>,
    ) {
      state.notionRows = action.payload.rows
      state.notionAllPlayers = action.payload.allPlayers
      state.notionSelectedPlayers = action.payload.allPlayers
      state.notionAllMatches = action.payload.allMatches
      state.notionSelectedMatch = 'all'
    },
    setNotionSelectedPlayers(state, action: PayloadAction<string[]>) {
      state.notionSelectedPlayers = action.payload
    },
    setNotionSelectedMatch(state, action: PayloadAction<string | 'all'>) {
      state.notionSelectedMatch = action.payload
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
  setActiveTab,
  setExcelData,
  setExcelSelectedPlayers,
  setNotionData,
  setNotionSelectedPlayers,
  setNotionSelectedMatch,
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
