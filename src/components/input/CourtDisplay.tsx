'use client'

import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { selectPlayer, rotateLineup } from '@/store/volleySlice'
import { CourtPosition, LivePlayer } from '@/types'
import { ArrowRightLeft, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import SubstitutionSheet from '@/components/input/SubstitutionSheet'

// ---- Court layout: front row (P4, P3, P2) top, back row (P5, P6, P1) bottom ----
const courtLayout: CourtPosition[][] = [
  [4, 3, 2],
  [5, 6, 1],
]

export default function CourtDisplay() {
  const dispatch = useDispatch()
  const liveMatch = useSelector((state: RootState) => state.volley.liveMatch)
  const [subPosition, setSubPosition] = useState<CourtPosition | null>(null)

  if (!liveMatch) return null

  const { courtLineup, rotationNumber, isTeamServing, selectedPlayerId } =
    liveMatch

  const handlePlayerTap = (player: LivePlayer | null) => {
    if (!player) return
    dispatch(
      selectPlayer(
        player.playerId === selectedPlayerId ? null : player.playerId,
      ),
    )
  }

  const handleSubTap = (
    e: React.MouseEvent,
    position: CourtPosition,
  ) => {
    e.stopPropagation()
    setSubPosition(position)
  }

  return (
    <div className="space-y-2">
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Rotation: {rotationNumber}
        </span>
        <div className="flex items-center gap-2">
          {isTeamServing && (
            <span className="text-xs font-semibold uppercase text-orange-500">
              Serving
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => dispatch(rotateLineup())}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ---- Court grid ---- */}
      <div className="relative rounded-lg border-2 border-blue-200 bg-blue-50 p-1.5">
        {/* ---- Serving indicator bar ---- */}
        {isTeamServing && (
          <div className="absolute right-0 top-0 h-full w-1 rounded-r-lg bg-orange-500" />
        )}

        <div className="grid grid-rows-2 gap-1.5">
          {courtLayout.map((row, rowIdx) => (
            <div key={rowIdx} className="grid grid-cols-3 gap-1.5">
              {row.map((pos) => {
                const player = courtLineup[pos]
                const isSelected = player?.playerId === selectedPlayerId
                return (
                  <button
                    key={pos}
                    onClick={() => handlePlayerTap(player)}
                    className={`relative flex flex-col items-center justify-center rounded-md border bg-blue-100/50 px-1 py-3 transition-all md:py-4 ${
                      isSelected
                        ? 'ring-2 ring-primary border-primary bg-blue-200/70'
                        : 'hover:bg-blue-200/50'
                    }`}
                  >
                    {/* ---- Position label ---- */}
                    <span className="absolute left-1 top-0.5 text-[10px] text-muted-foreground">
                      P{pos}
                    </span>

                    {/* ---- Sub icon ---- */}
                    <button
                      onClick={(e) => handleSubTap(e, pos)}
                      className="absolute right-1 top-0.5 rounded p-0.5 hover:bg-blue-200"
                    >
                      <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                    </button>

                    {player ? (
                      <>
                        {/* ---- Jersey number circle ---- */}
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white md:h-10 md:w-10 md:text-base ${
                            player.isLibero
                              ? 'bg-orange-500'
                              : 'bg-slate-700'
                          }`}
                        >
                          {player.jerseyNumber ?? '?'}
                        </div>
                        {/* ---- Player name ---- */}
                        <span className="mt-1 truncate text-xs font-medium max-w-full">
                          {player.name}
                          {player.isLibero ? ' (L)' : ''}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Empty
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <SubstitutionSheet
        position={subPosition}
        onClose={() => setSubPosition(null)}
      />
    </div>
  )
}
