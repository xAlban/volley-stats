import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { DataRow, NotionDataRow } from '@/types'

interface VolleyState {
  activeTab: 'notion' | 'excel'
  excelRows: DataRow[]
  excelAllPlayers: string[]
  excelSelectedPlayers: string[]
  notionRows: NotionDataRow[]
  notionAllPlayers: string[]
  notionSelectedPlayers: string[]
  notionAllMatches: string[]
  notionSelectedMatch: string | 'all'
}

const initialState: VolleyState = {
  activeTab: 'notion',
  excelRows: [],
  excelAllPlayers: [],
  excelSelectedPlayers: [],
  notionRows: [],
  notionAllPlayers: [],
  notionSelectedPlayers: [],
  notionAllMatches: [],
  notionSelectedMatch: 'all',
}

const volleySlice = createSlice({
  name: 'volley',
  initialState,
  reducers: {
    setActiveTab(state, action: PayloadAction<'notion' | 'excel'>) {
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
        rows: NotionDataRow[]
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
  },
})

export const {
  setActiveTab,
  setExcelData,
  setExcelSelectedPlayers,
  setNotionData,
  setNotionSelectedPlayers,
  setNotionSelectedMatch,
} = volleySlice.actions
export default volleySlice.reducer
