import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { DataRow, NotionDataRow } from '@/types'

interface VolleyState {
  excelRows: DataRow[]
  excelAllPlayers: string[]
  excelSelectedPlayers: string[]
  notionRows: NotionDataRow[]
  notionAllPlayers: string[]
  notionSelectedPlayers: string[]
  notionAllMatches: string[]
  notionSelectedMatches: string[]
}

const initialState: VolleyState = {
  excelRows: [],
  excelAllPlayers: [],
  excelSelectedPlayers: [],
  notionRows: [],
  notionAllPlayers: [],
  notionSelectedPlayers: [],
  notionAllMatches: [],
  notionSelectedMatches: [],
}

const volleySlice = createSlice({
  name: 'volley',
  initialState,
  reducers: {
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
      state.notionSelectedMatches = action.payload.allMatches
    },
    setNotionSelectedPlayers(state, action: PayloadAction<string[]>) {
      state.notionSelectedPlayers = action.payload
    },
    setNotionSelectedMatches(state, action: PayloadAction<string[]>) {
      state.notionSelectedMatches = action.payload
    },
  },
})

export const {
  setExcelData,
  setExcelSelectedPlayers,
  setNotionData,
  setNotionSelectedPlayers,
  setNotionSelectedMatches,
} = volleySlice.actions
export default volleySlice.reducer
