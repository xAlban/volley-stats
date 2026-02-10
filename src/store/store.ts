import { configureStore } from '@reduxjs/toolkit'
import volleyReducer from './volleySlice'

export const store = configureStore({
  reducer: {
    volley: volleyReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
