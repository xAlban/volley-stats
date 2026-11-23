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
import { NativeSelect } from '@/components/ui/native-select'
import { Pencil, X, Check } from 'lucide-react'

const actionShortLabels: Record<DataType, string> = {
  [DataTypeValues.ATTACK]: 'ATT',
  [DataTypeValues.SERVE]: 'SER',
  [DataTypeValues.DEFENSE]: 'DEF',
  [DataTypeValues.RECEP]: 'REC',
  [DataTypeValues.BLOCK]: 'BLC',
  [DataTypeValues.SET]: 'SET',
}

const allActions: DataType[] = [
  DataTypeValues.ATTACK,
  DataTypeValues.SERVE,
  DataTypeValues.DEFENSE,
  DataTypeValues.RECEP,
  DataTypeValues.BLOCK,
  DataTypeValues.SET,
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
      <div className="glass-inset flex flex-wrap items-center gap-2 rounded-xl px-3 py-2">
        {/* ---- Player select ---- */}
        <NativeSelect
          value={editPlayer}
          onChange={(e) => setEditPlayer(e.target.value)}
          wrapperClassName="min-w-0 flex-1 basis-28"
        >
          {inputPlayers.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </NativeSelect>

        {/* ---- Action type select ---- */}
        <NativeSelect
          value={editAction}
          onChange={(e) => setEditAction(e.target.value as DataType)}
          wrapperClassName="min-w-0 flex-1 basis-28"
        >
          {allActions.map((a) => (
            <option key={a} value={a}>
              {actionShortLabels[a]}
            </option>
          ))}
        </NativeSelect>

        {/* ---- Quality select ---- */}
        <NativeSelect
          value={editQuality}
          onChange={(e) => setEditQuality(e.target.value as NotionNotation)}
          wrapperClassName="min-w-0 flex-1 basis-28"
        >
          {allQualities.map((q) => (
            <option key={q} value={q}>
              {q} — {notionNotationLabels[editAction][q]}
            </option>
          ))}
        </NativeSelect>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleSave}
        >
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setEditing(false)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    )
  }

  return (
    <div className="glass-inset flex items-center gap-2 rounded-xl px-3 py-2">
      {/* ---- Quality badge ---- */}
      <span
        className="inline-flex h-6 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
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
        <span className="ml-1.5 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
          {actionShortLabels[action.actionType]}
        </span>
        <span className="text-muted-foreground"> · {qualityLabel}</span>
      </span>
      {/* ---- Edit / delete buttons ---- */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={() => setEditing(true)}
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
        onClick={() => dispatch(removeInputAction(action.id))}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
