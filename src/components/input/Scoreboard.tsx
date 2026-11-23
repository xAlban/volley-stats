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
  const inputTeamId = useSelector(
    (state: RootState) => state.volley.inputTeamId,
  )
  const userTeams = useSelector((state: RootState) => state.volley.userTeams)
  const [editOpen, setEditOpen] = useState(false)

  if (!liveMatch) return null

  const teamName = userTeams.find((t) => t.id === inputTeamId)?.name ?? 'Home'
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
      <div className="hidden items-center justify-between px-4 py-2 md:flex">
        <div className="flex items-center gap-3">
          <Badge variant="destructive" className="font-semibold">
            LIVE
          </Badge>
          <span className="text-sm text-muted-foreground">
            SET {currentSet}
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-sm font-medium uppercase">{teamName}</div>
            <div className="text-xs font-semibold text-muted-foreground">
              SETS: {setsWon}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl"
              onClick={() => dispatch(scoreTeamPoint())}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <span className="text-4xl font-bold tabular-nums">{teamScore}</span>
            <span className="text-2xl text-muted-foreground">-</span>
            <span className="text-4xl font-bold tabular-nums">
              {opponentScore}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl"
              onClick={() => dispatch(scoreOpponentPoint())}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-left">
            <div className="text-sm font-medium uppercase">
              {opponentName || 'Opponent'}
            </div>
            <div className="text-xs font-semibold text-muted-foreground">
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
      <div className="flex items-center gap-2 px-3 py-2 md:hidden">
        <div className="flex shrink-0 flex-col items-center gap-0.5">
          <Badge variant="destructive" className="px-1.5 py-0 text-[10px]">
            LIVE
          </Badge>
          <span className="text-[10px] font-medium text-muted-foreground">
            SET {currentSet}
          </span>
        </div>
        <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto_1fr] items-center gap-2">
          <span className="truncate text-right text-xs font-medium uppercase">
            {teamName}
          </span>
          <span className="text-2xl font-bold tabular-nums leading-none">
            {teamScore} - {opponentScore}
          </span>
          <span className="truncate text-xs font-medium uppercase">
            {opponentName || 'OPP'}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-xl"
          title="Edit score"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>

      <EditScoreDialog open={editOpen} onOpenChange={setEditOpen} />
    </>
  )
}
