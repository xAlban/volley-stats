'use client'

import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { clearInputSession, undoLast } from '@/store/volleySlice'
import { selectIsMatchOver } from '@/store/selectors'
import { submitMatch } from '@/app/actions/supabase'
import { Button } from '@/components/ui/button'
import { Square, Send, Loader2, Undo2 } from 'lucide-react'
import Scoreboard from '@/components/input/Scoreboard'
import CourtDisplay from '@/components/input/CourtDisplay'
import BenchPanel from '@/components/input/BenchPanel'
import ActionGrid from '@/components/input/ActionGrid'
import ActionHistory from '@/components/input/ActionHistory'
import SetLineupDialog from '@/components/input/SetLineupDialog'

export default function LiveTracker() {
  const dispatch = useDispatch()
  const {
    inputMatchId,
    inputOpponentName,
    inputMatchDate,
    inputTeamId,
    inputActions,
    liveMatch,
    liveUndoStack,
  } = useSelector((state: RootState) => state.volley)
  const isMatchOver = useSelector(selectIsMatchOver)

  const [submitting, setSubmitting] = useState(false)
  // ---- Something to save: actions or points (manual points have no action) ----
  const hasData =
    inputActions.length > 0 || (liveMatch?.rallies.length ?? 0) > 0
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [showCourt, setShowCourt] = useState(true)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasData) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasData])

  const handleSubmit = async () => {
    if (!hasData || !inputTeamId || !liveMatch) return
    setSubmitting(true)
    try {
      await submitMatch({
        teamId: inputTeamId,
        matchId: inputMatchId,
        opponentName: inputOpponentName,
        matchDate: inputMatchDate,
        actions: inputActions,
        rallies: liveMatch.rallies,
        finalState: {
          teamScore: liveMatch.teamScore,
          opponentScore: liveMatch.opponentScore,
          setsWon: liveMatch.setsWon,
          setsLost: liveMatch.setsLost,
          completedSets: liveMatch.completedSets,
        },
      })
      dispatch(clearInputSession())
    } catch {
      // ---- Keep state on failure so user can retry ----
    } finally {
      setSubmitting(false)
    }
  }

  const handleEnd = () => {
    if (hasData) {
      setShowEndConfirm(true)
    } else {
      dispatch(clearInputSession())
    }
  }

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden p-3 md:p-4">
      {/* ---- Sticky glass bar: scoreboard + undo / end ---- */}
      <div className="glass-strong shrink-0 rounded-2xl md:flex md:items-center">
        <div className="min-w-0 md:flex-1">
          <Scoreboard />
        </div>

        {/* ---- Undo / end match: own row on mobile, inline on desktop ---- */}
        <div className="flex items-center justify-between gap-2 px-3 pb-2 md:pb-0 md:pl-0">
          {isMatchOver ? (
            <span className="text-sm font-bold text-danger">MATCH OVER</span>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-1">
            {/* ---- Undo last point / sub / rotation (and its action) ---- */}
            <Button
              variant="ghost"
              size="sm"
              className="h-9 rounded-xl"
              disabled={liveUndoStack.length === 0}
              onClick={() => dispatch(undoLast())}
            >
              <Undo2 className="mr-1 h-4 w-4" />
              Undo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 rounded-xl"
              onClick={handleEnd}
            >
              <Square className="mr-1 h-4 w-4" />
              End
            </Button>
          </div>
        </div>
      </div>

      {/* ---- Between sets: confirm the next lineup ---- */}
      {liveMatch?.awaitingSetLineup && (
        <SetLineupDialog key={liveMatch.currentSet} />
      )}

      {/* ---- End match confirmation ---- */}
      {showEndConfirm && (
        <div className="flex shrink-0 items-center justify-between rounded-2xl bg-destructive/10 px-4 py-2">
          <span className="text-sm">
            Discard {inputActions.length} actions and{' '}
            {liveMatch?.rallies.length ?? 0} points?
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

      {/* ---- Main content ---- */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto md:flex-row md:gap-4">
        {/* ---- Left panel: Court + Bench (desktop) ---- */}
        <div className="glass hidden rounded-2xl md:flex md:flex-2 md:flex-col md:gap-4 md:self-start md:overflow-auto md:p-4">
          <CourtDisplay />
          <BenchPanel />
        </div>

        {/* ---- Right panel: Actions + History ---- */}
        <div className="flex min-h-0 flex-3 flex-col gap-3 overflow-auto">
          {/* ---- Action grid ---- */}
          <div className="glass shrink-0 rounded-2xl p-3 md:p-4">
            <ActionGrid />
          </div>

          {/* ---- Mobile: collapsible court ---- */}
          <div className="glass rounded-2xl md:hidden">
            <button
              onClick={() => setShowCourt(!showCourt)}
              className="flex min-h-10 w-full items-center justify-between rounded-2xl px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:bg-accent"
            >
              Current Rotation
              <span>{showCourt ? '−' : '+'}</span>
            </button>
            {showCourt && (
              <div className="px-3 pb-3 space-y-3">
                <CourtDisplay />
                <BenchPanel />
              </div>
            )}
          </div>

          {/* ---- Mobile: collapsible history ---- */}
          <div className="glass rounded-2xl md:hidden">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex min-h-10 w-full items-center justify-between rounded-2xl px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:bg-accent"
            >
              History ({inputActions.length})
              <span>{showHistory ? '−' : '+'}</span>
            </button>
            {showHistory && (
              <div>
                <ActionHistory />
              </div>
            )}
          </div>

          {/* ---- Desktop: history always visible ---- */}
          <div className="glass hidden rounded-2xl md:flex md:min-h-48 md:flex-1 md:flex-col">
            <ActionHistory />
          </div>
        </div>
      </div>

      {/* ---- Submit button ---- */}
      <div className="glass-strong shrink-0 rounded-2xl p-2">
        <Button
          className="h-11 w-full rounded-xl"
          size="lg"
          disabled={!hasData || submitting}
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
