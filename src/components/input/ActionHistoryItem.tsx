'use client'

import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { removeInputAction, updateInputAction } from '@/store/volleySlice'
import {
  InputAction,
  DataType,
  DataTypeValues,
  NotionNotation,
  NotionNotationValues,
  notionNotationLabels,
} from '@/types'
import { getNotionColorFromStats } from '@/utils/colors'
import { Button } from '@/components/ui/button'
import { Pencil, X, Check } from 'lucide-react'

const actionShortLabels: Record<DataType, string> = {
  [DataTypeValues.ATTACK]: 'ATT',
  [DataTypeValues.SERVE]: 'SER',
  [DataTypeValues.DEFENSE]: 'DEF',
  [DataTypeValues.RECEP]: 'REC',
  [DataTypeValues.BLOCK]: 'BLC',
}

const allActions: DataType[] = [
  DataTypeValues.ATTACK,
  DataTypeValues.SERVE,
  DataTypeValues.DEFENSE,
  DataTypeValues.RECEP,
  DataTypeValues.BLOCK,
]

const allQualities: NotionNotation[] = [
  NotionNotationValues.DOUBLE_PLUS,
  NotionNotationValues.PLUS,
  NotionNotationValues.MINUS,
  NotionNotationValues.SLASH,
]

interface ActionHistoryItemProps {
  action: InputAction
}

export default function ActionHistoryItem({ action }: ActionHistoryItemProps) {
  const dispatch = useDispatch()
  const inputPlayers = useSelector(
    (state: RootState) => state.volley.inputPlayers,
  )
  const [editing, setEditing] = useState(false)
  const [editPlayer, setEditPlayer] = useState(action.player)
  const [editAction, setEditAction] = useState(action.actionType)
  const [editQuality, setEditQuality] = useState(action.quality)

  const qualityLabel = notionNotationLabels[action.actionType][action.quality]
  const color = getNotionColorFromStats(action.actionType, action.quality)

  const handleSave = () => {
    dispatch(
      updateInputAction({
        id: action.id,
        player: editPlayer,
        actionType: editAction,
        quality: editQuality,
      }),
    )
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex flex-wrap items-center gap-2 px-3 py-2">
        {/* ---- Player select ---- */}
        <select
          value={editPlayer}
          onChange={(e) => setEditPlayer(e.target.value)}
          className="rounded border bg-background px-2 py-1 text-sm"
        >
          {inputPlayers.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        {/* ---- Action type select ---- */}
        <select
          value={editAction}
          onChange={(e) => setEditAction(e.target.value as DataType)}
          className="rounded border bg-background px-2 py-1 text-sm"
        >
          {allActions.map((a) => (
            <option key={a} value={a}>
              {actionShortLabels[a]}
            </option>
          ))}
        </select>

        {/* ---- Quality select ---- */}
        <select
          value={editQuality}
          onChange={(e) => setEditQuality(e.target.value as NotionNotation)}
          className="rounded border bg-background px-2 py-1 text-sm"
        >
          {allQualities.map((q) => (
            <option key={q} value={q}>
              {q} — {notionNotationLabels[editAction][q]}
            </option>
          ))}
        </select>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleSave}
        >
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setEditing(false)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      {/* ---- Quality badge ---- */}
      <span
        className="inline-flex h-6 w-8 shrink-0 items-center justify-center rounded text-xs font-bold text-white"
        style={{
          backgroundColor: color,
          textShadow: '0 1px 2px rgba(0,0,0,0.3)',
        }}
      >
        {action.quality}
      </span>
      {/* ---- Player + action label ---- */}
      <span className="min-w-0 flex-1 truncate text-sm">
        <span className="font-medium">{action.player}</span>
        <span className="text-muted-foreground">
          {' '}
          · {actionShortLabels[action.actionType]} · {qualityLabel}
        </span>
      </span>
      {/* ---- Edit / delete buttons ---- */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        onClick={() => setEditing(true)}
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
        onClick={() => dispatch(removeInputAction(action.id))}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
