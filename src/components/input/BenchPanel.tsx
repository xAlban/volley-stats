'use client'

import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { selectCanSubstitute } from '@/store/selectors'
import { ArrowRightLeft } from 'lucide-react'

interface BenchPanelProps {
  onSubRequest?: (benchPlayerId: string) => void
}

export default function BenchPanel({ onSubRequest }: BenchPanelProps) {
  const liveMatch = useSelector((state: RootState) => state.volley.liveMatch)
  const canSub = useSelector(selectCanSubstitute)

  if (!liveMatch) return null

  const { benchPlayers, subsUsedThisSet, maxSubsPerSet } = liveMatch

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Bench
        </span>
        <span className="text-xs text-muted-foreground">
          Subs: {subsUsedThisSet}/{maxSubsPerSet}
        </span>
      </div>

      {benchPlayers.length === 0 ? (
        <p className="text-xs text-muted-foreground px-1">No bench players</p>
      ) : (
        <div className="space-y-1">
          {benchPlayers.map((player) => (
            <div
              key={player.playerId}
              className="flex items-center justify-between rounded-md border px-2 py-1.5"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
                    player.isLibero ? 'bg-orange-500' : 'bg-slate-700'
                  }`}
                >
                  {player.jerseyNumber ?? '?'}
                </div>
                <div>
                  <span className="text-sm font-medium">{player.name}</span>
                  {player.position && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      {player.position}
                    </span>
                  )}
                </div>
              </div>
              {canSub && onSubRequest && (
                <button
                  onClick={() => onSubRequest(player.playerId)}
                  className="rounded p-1 hover:bg-accent"
                >
                  <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
