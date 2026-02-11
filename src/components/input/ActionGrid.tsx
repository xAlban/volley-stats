'use client'

import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { addInputAction } from '@/store/volleySlice'
import {
  DataType,
  NotionNotation,
  NotionNotationValues,
  InputAction,
} from '@/types'
import { getNotionColorFromStats } from '@/utils/colors'

const qualities: NotionNotation[] = [
  NotionNotationValues.DOUBLE_PLUS,
  NotionNotationValues.PLUS,
  NotionNotationValues.MINUS,
  NotionNotationValues.SLASH,
]

interface ActionGridProps {
  players: string[]
  activeAction: DataType
  qualityLabels: Record<NotionNotation, string>
}

export default function ActionGrid({
  players,
  activeAction,
  qualityLabels,
}: ActionGridProps) {
  const dispatch = useDispatch()
  // ---- Track last tapped cell for visual feedback ----
  const [lastTapped, setLastTapped] = useState<string | null>(null)

  const handleTap = (player: string, quality: NotionNotation) => {
    const action: InputAction = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      player,
      actionType: activeAction,
      quality,
      timestamp: Date.now(),
    }
    dispatch(addInputAction(action))

    // ---- Brief pulse feedback ----
    const key = `${player}-${quality}`
    setLastTapped(key)
    setTimeout(() => setLastTapped(null), 200)
  }

  return (
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
          {players.map((player) => (
            <tr key={player}>
              {/* ---- Player name ---- */}
              <td className="pr-1 text-right text-sm font-medium">{player}</td>
              {/* ---- Quality buttons ---- */}
              {qualities.map((q) => {
                const key = `${player}-${q}`
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
  )
}
