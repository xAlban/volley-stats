'use client'

import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { startNextSet, undoLast } from '@/store/volleySlice'
import { LineupDraft } from '@/types'
import { allMatchPlayers, validateLineupDraft } from '@/utils/rotation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Play, Undo2 } from 'lucide-react'
import LineupEditor from '@/components/input/LineupEditor'

// ---- Shown when a set ends: confirm/edit the next set starting lineup ----
// ---- Rendered only while liveMatch.awaitingSetLineup is true, so the draft
//      initialiser runs once per set break ----
export default function SetLineupDialog() {
  const dispatch = useDispatch()
  const liveMatch = useSelector((state: RootState) => state.volley.liveMatch)

  // ---- Default: previous set lineup, serve alternated by the reducer ----
  const [draft, setDraft] = useState<LineupDraft | null>(() =>
    liveMatch
      ? {
          ...liveMatch.setStartDraft,
          isTeamServing: liveMatch.isTeamServing,
        }
      : null,
  )
  const players = useMemo(
    () => (liveMatch ? allMatchPlayers(liveMatch) : []),
    [liveMatch],
  )

  if (!liveMatch || !draft) return null
  const canStart = validateLineupDraft(draft).length === 0
  const lastSet = liveMatch.completedSets[liveMatch.completedSets.length - 1]

  return (
    <Dialog open>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] overflow-y-auto"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Set {liveMatch.currentSet} lineup</DialogTitle>
          <DialogDescription>
            {lastSet
              ? `Set ${lastSet.setNumber} ended ${lastSet.teamScore}-${lastSet.opponentScore}. `
              : ''}
            Confirm the starting lineup for the next set.
          </DialogDescription>
        </DialogHeader>

        <LineupEditor players={players} draft={draft} onChange={setDraft} />

        <div className="flex gap-2">
          {/* ---- Undo the point that ended the set ---- */}
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => dispatch(undoLast())}
          >
            <Undo2 className="mr-2 h-4 w-4" />
            Undo last point
          </Button>
          <Button
            className="flex-1"
            disabled={!canStart}
            onClick={() => dispatch(startNextSet(draft))}
          >
            <Play className="mr-2 h-4 w-4" />
            Start set {liveMatch.currentSet}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
