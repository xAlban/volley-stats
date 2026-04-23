'use client'

import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { recordAction } from '@/store/volleySlice'
import {
  InputAction,
  DataType,
  DataTypeValues,
  NotionNotation,
  NotionNotationValues,
  notionNotationLabels,
  LivePlayer,
} from '@/types'
import { getNotionColorFromStats } from '@/utils/colors'

const actionTabs: { key: DataType; label: string }[] = [
  { key: DataTypeValues.ATTACK, label: 'ATT' },
  { key: DataTypeValues.SERVE, label: 'SER' },
  { key: DataTypeValues.DEFENSE, label: 'DEF' },
  { key: DataTypeValues.RECEP, label: 'REC' },
  { key: DataTypeValues.BLOCK, label: 'BLC' },
  { key: DataTypeValues.SET, label: 'SET' },
]

const qualities: NotionNotation[] = [
  NotionNotationValues.DOUBLE_PLUS,
  NotionNotationValues.PLUS,
  NotionNotationValues.MINUS,
  NotionNotationValues.SLASH,
]

export default function ActionGrid() {
  const dispatch = useDispatch()
  const liveMatch = useSelector((state: RootState) => state.volley.liveMatch)
  const [activeAction, setActiveAction] = useState<DataType>(
    DataTypeValues.ATTACK,
  )
  const [lastTapped, setLastTapped] = useState<string | null>(null)

  const qualityLabels = notionNotationLabels[activeAction]

  // ---- Build player list from court + bench ----
  const allPlayers: LivePlayer[] = useMemo(() => {
    return liveMatch
      ? [
          ...([1, 2, 3, 4, 5, 6] as const)
            .map((pos) => liveMatch.courtLineup[pos])
            .filter((p): p is LivePlayer => p !== null),
          ...liveMatch.benchPlayers,
        ].sort((a, b) => (a.name <= b.name ? -1 : 1))
      : []
  }, [liveMatch])

  const handleTap = (player: LivePlayer, quality: NotionNotation) => {
    const action: InputAction = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      player: player.name,
      actionType: activeAction,
      quality,
      timestamp: Date.now(),
    }
    dispatch(recordAction(action))

    // ---- Brief pulse feedback ----
    const key = `${player.playerId}-${quality}`
    setLastTapped(key)
    setTimeout(() => setLastTapped(null), 200)
  }

  return (
    <div className="space-y-2">
      {/* ---- Action type tabs ---- */}
      <div className="flex border-b">
        {actionTabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveAction(key)}
            className={`flex-1 py-2 text-center text-xs font-semibold transition-colors ${
              activeAction === key
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ---- Player x Quality matrix ---- */}
      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse">
          {/* ---- Quality column headers ---- */}
          <thead>
            <tr>
              <th className="w-16 md:w-24" />
              {qualities.map((q) => (
                <th key={q} className="px-1 pb-2 text-center">
                  <div className="text-xs font-bold">{q}</div>
                  <div className="truncate text-[10px] text-muted-foreground">
                    {qualityLabels[q]}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allPlayers.map((player) => (
              <tr key={player.playerId}>
                {/* ---- Player name ---- */}
                <td className="pr-1 text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-1">
                    {player.isLibero && (
                      <span className="text-[10px] font-bold text-orange-500">
                        L
                      </span>
                    )}
                    <span className="truncate">{player.name}</span>
                  </div>
                </td>
                {/* ---- Quality buttons ---- */}
                {qualities.map((q) => {
                  const key = `${player.playerId}-${q}`
                  const color = getNotionColorFromStats(activeAction, q)
                  const isTapped = lastTapped === key
                  return (
                    <td key={q} className="p-0.5 md:p-1">
                      <button
                        onClick={() => handleTap(player, q)}
                        className={`h-11 w-full rounded-md border font-semibold text-sm transition-all active:scale-95 md:h-12 ${
                          isTapped
                            ? 'scale-95 ring-2 ring-primary'
                            : 'hover:brightness-110'
                        }`}
                        style={{
                          backgroundColor: color,
                          color: 'white',
                          textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                        }}
                      >
                        {q}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
