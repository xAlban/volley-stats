import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { DataRow, NotionDataRow } from '@/types'

interface VolleyState {
  excelRows: DataRow[]
  excelAllPlayers: string[]
  excelSelectedPlayers: string[]
  notionRows: NotionDataRow[]
  notionAllPlayers: string[]
  notionSelectedPlayers: string[]
}

const initialState: VolleyState = {
  excelRows: [],
  excelAllPlayers: [],
  excelSelectedPlayers: [],
  notionRows: [],
  notionAllPlayers: [],
  notionSelectedPlayers: [],
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
      }>,
    ) {
      state.notionRows = action.payload.rows
      state.notionAllPlayers = action.payload.allPlayers
      state.notionSelectedPlayers = action.payload.allPlayers
    },
    setNotionSelectedPlayers(state, action: PayloadAction<string[]>) {
      state.notionSelectedPlayers = action.payload
    },
  },
})

export const {
  setExcelData,
  setExcelSelectedPlayers,
  setNotionData,
  setNotionSelectedPlayers,
} = volleySlice.actions
export default volleySlice.reducer
