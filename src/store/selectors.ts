import { RootState } from '@/store/store'

// ---- Serving player: the player at P1 when team is serving ----
export const selectServingPlayer = (state: RootState) => {
  const match = state.volley.liveMatch
  if (!match?.isTeamServing) return null
  return match.courtLineup[1]
}

// ---- Can substitute: haven't exceeded sub limit ----
export const selectCanSubstitute = (state: RootState) => {
  const match = state.volley.liveMatch
  if (!match) return false
  return match.subsUsedThisSet < match.maxSubsPerSet
}

// ---- Is match over: one team has won 3 sets ----
export const selectIsMatchOver = (state: RootState) => {
  const match = state.volley.liveMatch
  if (!match) return false
  return match.setsWon >= 3 || match.setsLost >= 3
}

// ---- Selected player on court ----
export const selectSelectedPlayer = (state: RootState) => {
  const match = state.volley.liveMatch
  if (!match?.selectedPlayerId) return null
  for (const pos of [1, 2, 3, 4, 5, 6] as const) {
    const player = match.courtLineup[pos]
    if (player?.playerId === match.selectedPlayerId) return player
  }
  return match.benchPlayers.find(
    (p) => p.playerId === match.selectedPlayerId,
  ) ?? null
}
