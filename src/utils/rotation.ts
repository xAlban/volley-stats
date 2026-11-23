import {
  COURT_POSITIONS,
  CourtLineup,
  CourtPosition,
  LineupDraft,
  LiveMatchState,
  LivePlayer,
} from '@/types'

// ---- Rotation & libero rules (FIVB based) ----
// ---- - Front row: P2, P3, P4. Back row: P1, P5, P6. P1 is the server. ----
// ---- - The libero is a per-match designation (not a roster attribute): a
//        player flagged "libero" in the roster may play a regular role. ----
// ---- - The libero may only play in the back row and may never serve. ----
// ---- - The libero replaces back-row players without counting as a sub, and
//        can only be replaced by the player they replaced (or the second
//        libero). ----
// ---- - Max 2 liberos per match, only one on court at a time. ----

export const MAX_LIBEROS = 2
export const FRONT_ROW: CourtPosition[] = [2, 3, 4]
export const BACK_ROW: CourtPosition[] = [1, 5, 6]

export const emptyLineup = (): CourtLineup => ({
  1: null,
  2: null,
  3: null,
  4: null,
  5: null,
  6: null,
})

export function isFrontRow(pos: CourtPosition): boolean {
  return FRONT_ROW.includes(pos)
}

// ---- Libero can play at a back-row spot, except P1 while we serve ----
export function canLiberoPlayAt(
  pos: CourtPosition,
  isTeamServing: boolean,
): boolean {
  if (isFrontRow(pos)) return false
  return !(pos === 1 && isTeamServing)
}

// ---- Position of the libero currently on court (null if none) ----
export function findLiberoOnCourt(match: LiveMatchState): CourtPosition | null {
  for (const pos of COURT_POSITIONS) {
    if (match.courtLineup[pos]?.isLibero) return pos
  }
  return null
}

// ---- Apply the per-match libero designation to a player ----
export function withLiberoFlag(
  player: LivePlayer,
  liberoIds: string[],
): LivePlayer {
  return { ...player, isLibero: liberoIds.includes(player.playerId) }
}

// ---- Swap a bench player with a court player (no rule checks) ----
function swap(
  match: LiveMatchState,
  pos: CourtPosition,
  benchPlayer: LivePlayer,
): LivePlayer | null {
  const out = match.courtLineup[pos]
  match.courtLineup[pos] = benchPlayer
  match.benchPlayers = match.benchPlayers.filter(
    (p) => p.playerId !== benchPlayer.playerId,
  )
  if (out) match.benchPlayers.push(out)
  return out
}

// ---- Rotate clockwise: P2→P1, P3→P2 ... P1→P6 ----
export function rotateClockwise(match: LiveMatchState) {
  const old = { ...match.courtLineup }
  match.courtLineup[1] = old[2]
  match.courtLineup[2] = old[3]
  match.courtLineup[3] = old[4]
  match.courtLineup[4] = old[5]
  match.courtLineup[5] = old[6]
  match.courtLineup[6] = old[1]
  match.rotationNumber = (match.rotationNumber % 6) + 1
  autoHandleLibero(match)
}

// ---- Bring the libero out and the replaced player back at the same spot ----
export function liberoExit(match: LiveMatchState) {
  const pos = findLiberoOnCourt(match)
  if (pos === null) return
  const replaced = match.liberoReplacedPlayer
  // ---- Defensive: without a known replaced player we cannot legally swap ----
  if (!replaced) return
  const benchReplaced = match.benchPlayers.find(
    (p) => p.playerId === replaced.playerId,
  )
  if (!benchReplaced) return
  swap(match, pos, benchReplaced)
  match.liberoReplacedPlayer = null
}

// ---- Auto libero management, run after every rotation / serve change ----
// ---- 1. Libero in an illegal spot (front row, or P1 while serving) → out.
//      2. No libero on court → enter for a libero-target player standing in
//         a legal back-row spot (preferring the last libero used). ----
export function autoHandleLibero(match: LiveMatchState) {
  const liberoPos = findLiberoOnCourt(match)
  if (liberoPos !== null) {
    if (canLiberoPlayAt(liberoPos, match.isTeamServing)) return
    liberoExit(match)
    // ---- Still on court means exit was impossible: leave as is ----
    if (findLiberoOnCourt(match) !== null) return
  }

  const benchLiberos = match.benchPlayers.filter((p) => p.isLibero)
  if (benchLiberos.length === 0) return
  const libero =
    benchLiberos.find((p) => p.playerId === match.activeLiberoId) ??
    benchLiberos[0]

  for (const pos of BACK_ROW) {
    if (!canLiberoPlayAt(pos, match.isTeamServing)) continue
    const player = match.courtLineup[pos]
    if (
      player &&
      !player.isLibero &&
      match.liberoTargetIds.includes(player.playerId)
    ) {
      swap(match, pos, libero)
      match.liberoReplacedPlayer = player
      match.activeLiberoId = libero.playerId
      return
    }
  }
}

// ---- Bench players that may legally come in at a given court position ----
export type SubKind = 'regular' | 'libero-in' | 'libero-out' | 'libero-switch'

export interface SubOption {
  player: LivePlayer
  kind: SubKind
  allowed: boolean
  reason?: string
}

export function getSubOptions(
  match: LiveMatchState,
  pos: CourtPosition,
): SubOption[] {
  const courtPlayer = match.courtLineup[pos]
  if (!courtPlayer) return []
  const liberoOnCourt = findLiberoOnCourt(match) !== null
  const subsLeft = match.subsUsedThisSet < match.maxSubsPerSet
  const replacedId = match.liberoReplacedPlayer?.playerId

  return match.benchPlayers.map((player): SubOption => {
    // ---- Court player is the libero: only the replaced player or the
    //      other libero may take their place ----
    if (courtPlayer.isLibero) {
      if (player.isLibero)
        return { player, kind: 'libero-switch', allowed: true }
      if (player.playerId === replacedId)
        return { player, kind: 'libero-out', allowed: true }
      return {
        player,
        kind: 'regular',
        allowed: false,
        reason: 'Only the replaced player',
      }
    }

    // ---- Libero coming in for a regular player ----
    if (player.isLibero) {
      if (liberoOnCourt)
        return {
          player,
          kind: 'libero-in',
          allowed: false,
          reason: 'Libero already on court',
        }
      if (!canLiberoPlayAt(pos, match.isTeamServing))
        return {
          player,
          kind: 'libero-in',
          allowed: false,
          reason: isFrontRow(pos) ? 'Front row' : 'Cannot serve',
        }
      return { player, kind: 'libero-in', allowed: true }
    }

    // ---- The player replaced by the libero can only return for the libero ----
    if (player.playerId === replacedId)
      return {
        player,
        kind: 'regular',
        allowed: false,
        reason: 'Replaced by libero',
      }

    if (!subsLeft)
      return {
        player,
        kind: 'regular',
        allowed: false,
        reason: 'No subs left',
      }
    return { player, kind: 'regular', allowed: true }
  })
}

// ---- Apply a substitution, returns the kind applied (null if illegal) ----
export function applySubstitution(
  match: LiveMatchState,
  pos: CourtPosition,
  benchPlayerId: string,
): { kind: SubKind; playerIn: LivePlayer; playerOut: LivePlayer } | null {
  const option = getSubOptions(match, pos).find(
    (o) => o.player.playerId === benchPlayerId,
  )
  const playerOut = match.courtLineup[pos]
  if (!option || !option.allowed || !playerOut) return null
  const playerIn = option.player

  swap(match, pos, playerIn)

  switch (option.kind) {
    case 'libero-in':
      match.liberoReplacedPlayer = playerOut
      match.activeLiberoId = playerIn.playerId
      break
    case 'libero-out':
      match.liberoReplacedPlayer = null
      break
    case 'libero-switch':
      // ---- Replaced player stays the same, only the libero changes ----
      match.activeLiberoId = playerIn.playerId
      break
    case 'regular':
      match.subsUsedThisSet++
      // ---- The substitute inherits the libero-target role of the player
      //      they replace (same rotational slot) ----
      if (match.liberoTargetIds.includes(playerOut.playerId)) {
        match.liberoTargetIds = match.liberoTargetIds
          .filter((id) => id !== playerOut.playerId)
          .concat(playerIn.playerId)
      }
      break
  }
  return { kind: option.kind, playerIn, playerOut }
}

// ---- All players taking part in the match (court + bench) ----
export function allMatchPlayers(match: LiveMatchState): LivePlayer[] {
  const onCourt = COURT_POSITIONS.map((pos) => match.courtLineup[pos]).filter(
    (p): p is LivePlayer => p !== null,
  )
  return [...onCourt, ...match.benchPlayers]
}

// ---- Validation messages for a draft (empty array = valid) ----
export function validateLineupDraft(draft: LineupDraft): string[] {
  const errors: string[] = []
  const ids = COURT_POSITIONS.map((pos) => draft.lineup[pos])
  if (ids.some((id) => id === null)) errors.push('Fill all 6 positions')
  if (ids.some((id) => id !== null && draft.liberoIds.includes(id)))
    errors.push('A libero cannot be in the starting lineup')
  if (draft.liberoIds.length > MAX_LIBEROS)
    errors.push(`Max ${MAX_LIBEROS} liberos`)
  return errors
}

// ---- Libero targets restricted to the players actually in the lineup ----
export function effectiveLiberoTargets(draft: LineupDraft): string[] {
  const lineupIds = COURT_POSITIONS.map((pos) => draft.lineup[pos]).filter(
    (id): id is string => id !== null,
  )
  return draft.liberoTargetIds.filter((id) => lineupIds.includes(id))
}

// ---- Build court + bench from a draft, applying libero designation ----
export function buildLineupFromDraft(
  players: LivePlayer[],
  draft: LineupDraft,
): { courtLineup: CourtLineup; benchPlayers: LivePlayer[] } {
  const byId = new Map(players.map((p) => [p.playerId, p]))
  const courtLineup = emptyLineup()
  for (const pos of COURT_POSITIONS) {
    const id = draft.lineup[pos]
    const player = id ? byId.get(id) : undefined
    courtLineup[pos] = player ? withLiberoFlag(player, draft.liberoIds) : null
  }
  const onCourtIds = COURT_POSITIONS.map((pos) => draft.lineup[pos])
  const benchPlayers = players
    .filter((p) => !onCourtIds.includes(p.playerId))
    .map((p) => withLiberoFlag(p, draft.liberoIds))
  return { courtLineup, benchPlayers }
}

// ---- Default libero targets: middle blockers ----
export function defaultLiberoTargets(players: LivePlayer[]): string[] {
  return players.filter((p) => p.position === 'MB').map((p) => p.playerId)
}
