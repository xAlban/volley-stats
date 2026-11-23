'use client'

import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { substitutePlayer } from '@/store/volleySlice'
import { getSubOptions } from '@/utils/rotation'
import { CourtPosition } from '@/types'
import {
  Sheet,
  SheetContent,
  SheetDescription,
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

  if (!liveMatch || position === null) return null

  const courtPlayer = liveMatch.courtLineup[position]
  // ---- Legal options per volleyball rules (libero, sub limit) ----
  const options = getSubOptions(liveMatch, position)

  const handleSub = (benchPlayerId: string) => {
    dispatch(substitutePlayer({ courtPosition: position, benchPlayerId }))
    onClose()
  }

  return (
    <Sheet open={position !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="max-h-[60vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            Substitute P{position}
            {courtPlayer ? ` — ${courtPlayer.name}` : ''}
          </SheetTitle>
          <SheetDescription>
            Subs used: {liveMatch.subsUsedThisSet}/{liveMatch.maxSubsPerSet}.
            Libero replacements don&apos;t count.
          </SheetDescription>
        </SheetHeader>

        {options.length === 0 ? (
          <p className="px-4 py-4 text-sm text-muted-foreground">
            No players on bench.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 px-4 py-4">
            {options.map(({ player, kind, allowed, reason }) => (
              <button
                key={player.playerId}
                disabled={!allowed}
                onClick={() => handleSub(player.playerId)}
                className="glass-inset flex items-center gap-2 rounded-xl px-3 py-2.5 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    player.isLibero
                      ? 'bg-libero text-libero-foreground'
                      : 'bg-player text-player-foreground'
                  }`}
                >
                  {player.jerseyNumber ?? '?'}
                </div>
                <div className="min-w-0 text-left">
                  <div className="truncate text-sm font-medium">
                    {player.name}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {!allowed && reason
                      ? reason
                      : kind === 'regular'
                        ? (player.position ?? 'Sub')
                        : kind === 'libero-out'
                          ? 'Back from libero'
                          : 'Libero'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
