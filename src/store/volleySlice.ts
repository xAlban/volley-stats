import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { DataRow, NotionDataRow, NotionDataRowWithId } from '@/types'

type Section = 'home' | 'charts' | 'analysis' | 'old'

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
} = volleySlice.actions
export default volleySlice.reducer
