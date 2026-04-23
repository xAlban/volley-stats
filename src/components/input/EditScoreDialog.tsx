'use client'

import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { setScore } from '@/store/volleySlice'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Minus, Plus } from 'lucide-react'

interface EditScoreDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function EditScoreDialog({
  open,
  onOpenChange,
}: EditScoreDialogProps) {
  const dispatch = useDispatch()
  const liveMatch = useSelector((state: RootState) => state.volley.liveMatch)
  const inputTeamId = useSelector(
    (state: RootState) => state.volley.inputTeamId,
  )
  const userTeams = useSelector((state: RootState) => state.volley.userTeams)

  if (!liveMatch) return null

  const teamName = userTeams.find((t) => t.id === inputTeamId)?.name ?? 'Home'
  const { teamScore, opponentScore, opponentName, setsWon, setsLost } =
    liveMatch

  const handleTeamChange = (delta: number) => {
    const newScore = Math.max(0, teamScore + delta)
    dispatch(setScore({ teamScore: newScore, opponentScore }))
  }

  const handleOpponentChange = (delta: number) => {
    const newScore = Math.max(0, opponentScore + delta)
    dispatch(setScore({ teamScore, opponentScore: newScore }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Score</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* ---- Team score ---- */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium uppercase">{teamName}</span>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleTeamChange(-1)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center text-2xl font-bold tabular-nums">
                {teamScore}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleTeamChange(1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* ---- Opponent score ---- */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium uppercase">
              {opponentName || 'Opponent'}
            </span>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleOpponentChange(-1)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center text-2xl font-bold tabular-nums">
                {opponentScore}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleOpponentChange(1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* ---- Sets display ---- */}
          <div className="flex justify-center gap-4 text-sm text-muted-foreground">
            <span>
              Sets: {setsWon} - {setsLost}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
