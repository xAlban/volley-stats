'use client'

import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { rotateLineup, toggleServing } from '@/store/volleySlice'
import { CourtPosition } from '@/types'
import { currentSetterPosition } from '@/utils/rotation'
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

  const { courtLineup, isTeamServing, liberoReplacedPlayer } = liveMatch

  const handleSubTap = (e: React.MouseEvent, position: CourtPosition) => {
    e.stopPropagation()
    setSubPosition(position)
  }

  return (
    <div className="space-y-2">
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Rotation: S{currentSetterPosition(liveMatch)}
        </span>
        <div className="flex items-center gap-2">
          {/* ---- Manual correction of who serves ---- */}
          <button
            onClick={() => dispatch(toggleServing())}
            title="Toggle serving team"
            className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase transition-colors ${
              isTeamServing
                ? 'bg-warning/15 text-warning'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {isTeamServing ? 'Serving' : 'Receiving'}
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="Rotate (manual correction)"
            onClick={() => dispatch(rotateLineup())}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ---- Court grid ---- */}
      <div className="relative overflow-hidden rounded-2xl border border-court-line bg-court p-2">
        {/* ---- Net: thin line above the front row ---- */}
        <div className="mx-auto mb-2 h-0.5 w-full rounded-full bg-court-line" />
        {/* ---- Serving indicator bar ---- */}
        {isTeamServing && (
          <div className="absolute right-0 top-0 h-full w-1 bg-warning" />
        )}

        <div className="grid grid-rows-2 gap-1.5">
          {courtLayout.map((row, rowIdx) => (
            <div key={rowIdx} className="grid grid-cols-3 gap-1.5">
              {row.map((pos) => {
                const player = courtLineup[pos]
                return (
                  <div
                    key={pos}
                    className={`relative flex flex-col items-center justify-center rounded-xl border border-court-line bg-court-tile px-1 py-3 md:py-4`}
                  >
                    {/* ---- Position label ---- */}
                    <span className="absolute left-1 top-0.5 text-[10px] text-muted-foreground">
                      P{pos}
                    </span>

                    {/* ---- Sub icon ---- */}
                    <button
                      onClick={(e) => handleSubTap(e, pos)}
                      className="absolute right-1 top-0.5 rounded-lg p-0.5 hover:bg-accent"
                    >
                      <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
                    </button>

                    {player ? (
                      <>
                        {/* ---- Jersey number circle ---- */}
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold md:h-10 md:w-10 md:text-base ${
                            player.isLibero
                              ? 'bg-libero text-libero-foreground'
                              : 'bg-player text-player-foreground'
                          }`}
                        >
                          {player.jerseyNumber ?? '?'}
                        </div>
                        {/* ---- Player name ---- */}
                        <span className="mt-1 truncate text-xs font-medium max-w-full">
                          {player.name}
                          {player.isLibero ? ' (L)' : ''}
                        </span>
                        {/* ---- Who the libero is replacing ---- */}
                        {player.isLibero && liberoReplacedPlayer && (
                          <span className="max-w-full truncate text-[10px] text-muted-foreground">
                            for {liberoReplacedPlayer.name}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Empty
                      </span>
                    )}
                  </div>
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
