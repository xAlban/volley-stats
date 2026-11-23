'use client'

import { useMemo, useState } from 'react'
import { RotateCcw, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CourtPosition, LineupDraft, LivePlayer } from '@/types'
import {
  MAX_LIBEROS,
  effectiveLiberoTargets,
  needsReferenceChoice,
  referenceStartPosition,
  resolveReferencePlayer,
  rotateDraftLineup,
  validateLineupDraft,
} from '@/utils/rotation'

// ---- Court layout: front row (P4, P3, P2) top, back row (P5, P6, P1) bottom ----
const courtLayout: CourtPosition[][] = [
  [4, 3, 2],
  [5, 6, 1],
]

interface LineupEditorProps {
  // ---- Players available for this set. isLibero is only used as a hint
  //      (roster libero); the actual designation is draft.liberoIds ----
  players: LivePlayer[]
  draft: LineupDraft
  onChange: (draft: LineupDraft) => void
}

// ---- Shared editor for the starting lineup of a set: court positions,
//      libero designation, who the libero replaces and first serve ----
export default function LineupEditor({
  players,
  draft,
  onChange,
}: LineupEditorProps) {
  const [selectedPosition, setSelectedPosition] = useState<CourtPosition>(1)

  const byId = useMemo(
    () => new Map(players.map((p) => [p.playerId, p])),
    [players],
  )
  const lineupIds = Object.values(draft.lineup).filter(
    (id): id is string => id !== null,
  )
  const errors = validateLineupDraft(draft, players)
  const targets = effectiveLiberoTargets(draft)
  // ---- Rotation reference: auto with exactly one setter, else user picks ----
  const referenceId = resolveReferencePlayer(draft, players)
  const mustChooseReference = needsReferenceChoice(draft, players)

  // ---- Shift the whole lineup one spot, same players ----
  const handleRotate = (direction: 'forward' | 'back') => {
    onChange({ ...draft, lineup: rotateDraftLineup(draft.lineup, direction) })
  }
  const setterStart = referenceStartPosition(draft, players)

  // ---- Tap a position: select it, or clear it if already selected ----
  const handlePositionTap = (pos: CourtPosition) => {
    if (pos === selectedPosition && draft.lineup[pos]) {
      onChange({ ...draft, lineup: { ...draft.lineup, [pos]: null } })
      return
    }
    setSelectedPosition(pos)
  }

  // ---- Assign a player; a designated libero placed on court plays a
  //      regular role for this set, so drop the libero designation ----
  const handleAssign = (player: LivePlayer) => {
    onChange({
      ...draft,
      lineup: { ...draft.lineup, [selectedPosition]: player.playerId },
      liberoIds: draft.liberoIds.filter((id) => id !== player.playerId),
    })
    // ---- Move to the next empty position, if any ----
    const order: CourtPosition[] = [1, 2, 3, 4, 5, 6]
    const start = order.indexOf(selectedPosition)
    const next = [...order.slice(start + 1), ...order.slice(0, start)].find(
      (pos) => draft.lineup[pos] === null,
    )
    if (next) setSelectedPosition(next)
  }

  // ---- Toggle libero designation (max 2, never a lineup player) ----
  const toggleLibero = (id: string) => {
    const isLib = draft.liberoIds.includes(id)
    if (!isLib && draft.liberoIds.length >= MAX_LIBEROS) return
    onChange({
      ...draft,
      liberoIds: isLib
        ? draft.liberoIds.filter((l) => l !== id)
        : [...draft.liberoIds, id],
    })
  }

  // ---- Toggle whether the libero automatically replaces this player ----
  const toggleTarget = (id: string) => {
    onChange({
      ...draft,
      liberoTargetIds: draft.liberoTargetIds.includes(id)
        ? draft.liberoTargetIds.filter((t) => t !== id)
        : [...draft.liberoTargetIds, id],
    })
  }

  const benchCandidates = players.filter((p) => !lineupIds.includes(p.playerId))

  return (
    <div className="space-y-5">
      {/* ---- Serve toggle ---- */}
      <div className="glass-inset flex items-center justify-between rounded-xl px-3 py-2.5">
        <span className="text-sm font-medium">Your team serves first?</span>
        <button
          type="button"
          onClick={() =>
            onChange({ ...draft, isTeamServing: !draft.isTeamServing })
          }
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            draft.isTeamServing
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {draft.isTeamServing ? 'YES' : 'NO'}
        </button>
      </div>

      {/* ---- Court grid ---- */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Tap a position, then a player. Tap the selected position again to
          clear it. The libero is not part of the lineup: they enter
          automatically in the back row.
        </p>
        {/* ---- Rotate the same lineup instead of re-entering it ---- */}
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={lineupIds.length === 0}
            onClick={() => handleRotate('back')}
          >
            <RotateCcw className="mr-1 h-4 w-4" />
            Back
          </Button>
          <span className="text-xs font-medium text-muted-foreground">
            {setterStart ? `Starts in S${setterStart}` : 'Rotate lineup'}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={lineupIds.length === 0}
            onClick={() => handleRotate('forward')}
          >
            Rotate
            <RotateCw className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <div className="overflow-hidden rounded-2xl border border-court-line bg-court p-2">
          {/* ---- Net: thin line above the front row ---- */}
          <div className="mb-2 h-0.5 w-full rounded-full bg-court-line" />
          <div className="grid h-[220px] grid-rows-2 gap-2">
            {courtLayout.map((row, rowIdx) => (
              <div key={rowIdx} className="grid grid-cols-3 gap-2">
                {row.map((pos) => {
                  const id = draft.lineup[pos]
                  const player = id ? byId.get(id) : undefined
                  const isActive = selectedPosition === pos
                  return (
                    <button
                      type="button"
                      key={pos}
                      onClick={() => handlePositionTap(pos)}
                      className={`flex flex-col items-center justify-center rounded-xl border bg-court-tile px-1 py-3 transition-colors ${
                        isActive
                          ? 'border-primary ring-2 ring-primary'
                          : 'border-court-line'
                      } ${player ? '' : 'border-dashed'}`}
                    >
                      <span className="mb-1 text-[10px] text-muted-foreground">
                        P{pos}
                      </span>
                      {player ? (
                        <>
                          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-player text-sm font-bold text-player-foreground">
                            {player.jerseyNumber ?? '?'}
                            {/* ---- Rotation reference badge ---- */}
                            {player.playerId === referenceId && (
                              <span className="absolute -right-2 -top-1 rounded-full bg-primary px-1 text-[9px] leading-4 text-primary-foreground">
                                S
                              </span>
                            )}
                          </div>
                          <span className="mt-1 max-w-full truncate text-xs font-medium">
                            {player.name}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---- Player picker for the selected position ---- */}
      <div className="space-y-2">
        <label className="text-xs font-medium uppercase text-muted-foreground">
          Assign to P{selectedPosition}
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {players.map((player) => {
            const isAssigned = lineupIds.includes(player.playerId)
            const isLib = draft.liberoIds.includes(player.playerId)
            return (
              <button
                type="button"
                key={player.playerId}
                onClick={() => handleAssign(player)}
                disabled={isAssigned}
                className="glass-inset flex min-h-10 items-center gap-2 rounded-xl px-2 py-1.5 text-left hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isLib
                      ? 'bg-libero text-libero-foreground'
                      : 'bg-player text-player-foreground'
                  }`}
                >
                  {player.jerseyNumber ?? '?'}
                </div>
                <span className="truncate text-sm">
                  {player.name}
                  {player.position ? (
                    <span className="ml-1 text-xs text-muted-foreground">
                      {player.position}
                    </span>
                  ) : null}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ---- Rotation reference (rotations are named S1-S6 after it) ---- */}
      {lineupIds.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Rotation reference</label>
          <p className="text-xs text-muted-foreground">
            {mustChooseReference
              ? 'No single setter in the lineup: choose the player rotations are based on (S1 = this player at P1).'
              : 'Rotations are based on the setter (S1 = setter at P1). Tap another player to change.'}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {lineupIds.map((id) => {
              const player = byId.get(id)
              if (!player) return null
              const isRef = id === referenceId
              return (
                <button
                  type="button"
                  key={id}
                  onClick={() => onChange({ ...draft, referencePlayerId: id })}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    isRef
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'glass-inset hover:bg-accent'
                  }`}
                >
                  {player.name}
                  {player.position ? ` · ${player.position}` : ''}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ---- Libero designation (bench players only) ---- */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Libero{' '}
          <span className="text-xs font-normal text-muted-foreground">
            (max {MAX_LIBEROS}, for this set)
          </span>
        </label>
        {benchCandidates.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No player left on the bench.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {benchCandidates.map((player) => {
              const isLib = draft.liberoIds.includes(player.playerId)
              const full = !isLib && draft.liberoIds.length >= MAX_LIBEROS
              return (
                <button
                  type="button"
                  key={player.playerId}
                  disabled={full}
                  onClick={() => toggleLibero(player.playerId)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 ${
                    isLib
                      ? 'border-libero bg-libero text-libero-foreground'
                      : 'glass-inset hover:bg-accent'
                  }`}
                >
                  {player.jerseyNumber !== null && `#${player.jerseyNumber} `}
                  {player.name}
                  {player.isLibero && !isLib ? ' (roster L)' : ''}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ---- Who the libero replaces ---- */}
      {draft.liberoIds.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Libero replaces</label>
          {lineupIds.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Assign the lineup first.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {lineupIds.map((id) => {
                const player = byId.get(id)
                if (!player) return null
                const isTarget = targets.includes(id)
                return (
                  <button
                    type="button"
                    key={id}
                    onClick={() => toggleTarget(id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      isTarget
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'glass-inset hover:bg-accent'
                    }`}
                  >
                    {player.name}
                    {player.position ? ` · ${player.position}` : ''}
                  </button>
                )
              })}
            </div>
          )}
          {lineupIds.length > 0 && targets.length === 0 && (
            <p className="text-xs text-warning">
              No player selected: the libero will not enter automatically.
            </p>
          )}
        </div>
      )}

      {/* ---- Validation ---- */}
      {errors.length > 0 && (
        <ul className="space-y-0.5 text-xs text-muted-foreground">
          {errors.map((e) => (
            <li key={e}>• {e}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
