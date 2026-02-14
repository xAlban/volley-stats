'use client'

import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { clearInputSession } from '@/store/volleySlice'
import { insertStats } from '@/app/actions/supabase'
import { DataType, DataTypeValues, notionNotationLabels } from '@/types'
import { Button } from '@/components/ui/button'
import { Square, Send, Loader2 } from 'lucide-react'
import ActionGrid from '@/components/input/ActionGrid'
import ActionHistory from '@/components/input/ActionHistory'

const actionTabs: { key: DataType; label: string }[] = [
  { key: DataTypeValues.ATTACK, label: 'ATT' },
  { key: DataTypeValues.SERVE, label: 'SER' },
  { key: DataTypeValues.DEFENSE, label: 'DEF' },
  { key: DataTypeValues.RECEP, label: 'REC' },
  { key: DataTypeValues.BLOCK, label: 'BLC' },
]

export default function LiveTracker() {
  const dispatch = useDispatch()
  const { inputMatchName, inputActions, inputPlayers } = useSelector(
    (state: RootState) => state.volley,
  )

  const [activeAction, setActiveAction] = useState<DataType>(
    DataTypeValues.ATTACK,
  )
  const [submitting, setSubmitting] = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)

  const qualityLabels = notionNotationLabels[activeAction]

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (inputActions.length > 0) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [inputActions.length])

  const handleSubmit = async () => {
    if (inputActions.length === 0) return
    setSubmitting(true)
    try {
      await insertStats(inputActions, inputMatchName)
      dispatch(clearInputSession())
    } catch {
      // ---- Keep state on failure so user can retry ----
    } finally {
      setSubmitting(false)
    }
  }

  const handleEnd = () => {
    if (inputActions.length > 0) {
      setShowEndConfirm(true)
    } else {
      dispatch(clearInputSession())
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ---- Header ---- */}
      <header className="flex items-center justify-between border-b px-4 py-2">
        <h1 className="truncate text-lg font-bold">{inputMatchName}</h1>
        <Button variant="ghost" size="sm" onClick={handleEnd}>
          <Square className="mr-1 h-4 w-4" />
          End
        </Button>
      </header>

      {/* ---- End match confirmation ---- */}
      {showEndConfirm && (
        <div className="flex items-center justify-between border-b bg-destructive/10 px-4 py-2">
          <span className="text-sm">
            Discard {inputActions.length} unsaved actions?
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEndConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => dispatch(clearInputSession())}
            >
              Discard
            </Button>
          </div>
        </div>
      )}

      {/* ---- Action type tabs ---- */}
      <div className="flex border-b">
        {actionTabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveAction(key)}
            className={`flex-1 py-3 text-center text-sm font-semibold transition-colors ${
              activeAction === key
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ---- Main content: grid + history ---- */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        {/* ---- Grid area ---- */}
        <div className="shrink-0 border-b px-2 py-3 md:w-1/2 md:border-b-0 md:border-r md:px-4 md:py-4">
          <ActionGrid
            players={inputPlayers}
            activeAction={activeAction}
            qualityLabels={qualityLabels}
          />
        </div>

        {/* ---- History area ---- */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <ActionHistory />
        </div>
      </div>

      {/* ---- Submit button ---- */}
      <div className="border-t p-3">
        <Button
          className="w-full"
          size="lg"
          disabled={inputActions.length === 0 || submitting}
          onClick={handleSubmit}
        >
          {submitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Submit All ({inputActions.length} actions)
        </Button>
      </div>
    </div>
  )
}
