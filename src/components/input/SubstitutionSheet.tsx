'use client'

import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { substitutePlayer } from '@/store/volleySlice'
import { selectCanSubstitute } from '@/store/selectors'
import { CourtPosition } from '@/types'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface SubstitutionSheetProps {
  position: CourtPosition | null
  onClose: () => void
}

export default function SubstitutionSheet({
  position,
  onClose,
}: SubstitutionSheetProps) {
  const dispatch = useDispatch()
  const liveMatch = useSelector((state: RootState) => state.volley.liveMatch)
  const canSub = useSelector(selectCanSubstitute)

  if (!liveMatch || position === null) return null

  const courtPlayer = liveMatch.courtLineup[position]
  const { benchPlayers } = liveMatch

  const handleSub = (benchPlayerId: string) => {
    dispatch(substitutePlayer({ courtPosition: position, benchPlayerId }))
    onClose()
  }

  return (
    <Sheet open={position !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="max-h-[50vh]">
        <SheetHeader>
          <SheetTitle>
            Substitute P{position}
            {courtPlayer ? ` — ${courtPlayer.name}` : ''}
          </SheetTitle>
        </SheetHeader>

        {!canSub && !benchPlayers.some((p) => p.isLibero) ? (
          <p className="py-4 text-sm text-muted-foreground">
            No substitutions remaining this set.
          </p>
        ) : benchPlayers.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            No players on bench.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 py-4">
            {benchPlayers.map((player) => {
              // ---- Libero subs don't count, so always allow ----
              const allowed = canSub || player.isLibero
              return (
                <button
                  key={player.playerId}
                  disabled={!allowed}
                  onClick={() => handleSub(player.playerId)}
                  className="flex items-center gap-2 rounded-md border px-3 py-2 hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white ${
                      player.isLibero ? 'bg-orange-500' : 'bg-slate-700'
                    }`}
                  >
                    {player.jerseyNumber ?? '?'}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium">{player.name}</div>
                    {player.position && (
                      <div className="text-xs text-muted-foreground">
                        {player.position}
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
