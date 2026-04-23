'use client'

import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { scoreTeamPoint, scoreOpponentPoint } from '@/store/volleySlice'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import EditScoreDialog from '@/components/input/EditScoreDialog'

export default function Scoreboard() {
  const dispatch = useDispatch()
  const liveMatch = useSelector((state: RootState) => state.volley.liveMatch)
  const inputMatchName = useSelector(
    (state: RootState) => state.volley.inputMatchName,
  )
  const [editOpen, setEditOpen] = useState(false)

  if (!liveMatch) return null

  const teamName = inputMatchName
  const {
    opponentName,
    teamScore,
    opponentScore,
    currentSet,
    setsWon,
    setsLost,
  } = liveMatch

  return (
    <>
      {/* ---- Desktop scoreboard ---- */}
      <div className="hidden md:flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Badge
            variant="destructive"
            className="animate-pulse font-semibold"
          >
            LIVE
          </Badge>
          <span className="text-sm text-muted-foreground">
            SET {currentSet}
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-sm font-medium uppercase">{teamName}</div>
            <div className="text-xs text-red-500 font-bold">
              SETS: {setsWon}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => dispatch(scoreTeamPoint())}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <span className="text-4xl font-bold tabular-nums">
              {teamScore}
            </span>
            <span className="text-2xl text-muted-foreground">-</span>
            <span className="text-4xl font-bold tabular-nums">
              {opponentScore}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => dispatch(scoreOpponentPoint())}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-left">
            <div className="text-sm font-medium uppercase">
              {opponentName || 'Opponent'}
            </div>
            <div className="text-xs text-muted-foreground font-bold">
              SETS: {setsLost}
            </div>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil className="mr-1 h-3 w-3" />
          Edit Score
        </Button>
      </div>

      {/* ---- Mobile scoreboard ---- */}
      <div className="flex md:hidden items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <Badge
            variant="destructive"
            className="animate-pulse text-xs px-1.5 py-0"
          >
            LIVE
          </Badge>
          <span className="text-sm font-bold truncate max-w-[200px]">
            {teamName} {teamScore} - {opponentScore}{' '}
            {opponentName || 'OPP'} | SE{currentSet}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="mr-1 h-3 w-3" />
          Edit Score
        </Button>
      </div>

      <EditScoreDialog open={editOpen} onOpenChange={setEditOpen} />
    </>
  )
}
