'use server'

import { createClient } from '@/lib/supabase/server'
import {
  InputAction,
  NotionDataRow,
  NotionNotation,
  DataType,
  TeamInfo,
  TeamPlayer,
  TeamMemberInfo,
  TeamOverview,
  MatchInfo,
  SetResult,
} from '@/types'

const PAGE_SIZE = 1000
const BATCH_SIZE = 500

// ---- Fetch every stats row for every team the user belongs to ----
export async function fetchSupabaseData(): Promise<{
  rows: NotionDataRow[]
  allPlayers: string[]
  allMatches: string[]
}> {
  const supabase = await createClient()
  const players = new Set<string>()
  const matches = new Set<string>()
  const rows: NotionDataRow[] = []

  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('stats')
      .select(
        'player, action_type, quality, team_id, match_id, matches(opponent_name, match_date)',
      )
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw new Error(error.message)

    for (const row of data) {
      const m =
        (row.matches as unknown as {
          opponent_name: string
          match_date: string
        } | null) ?? null
      // ---- Display label: "{opponent} — {date}" (em dash) ----
      const matchLabel = m ? `${m.opponent_name} — ${m.match_date}` : undefined
      players.add(row.player)
      if (matchLabel) matches.add(matchLabel)
      rows.push({
        name: row.player,
        value: row.quality as NotionNotation,
        type: row.action_type as DataType,
        match: matchLabel,
        matchId: (row.match_id as string | null) ?? undefined,
        teamId: (row.team_id as string | null) ?? undefined,
      })
    }

    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return {
    rows,
    allPlayers: Array.from(players),
    allMatches: Array.from(matches),
  }
}

// ---- Shared helper: batch insert stats rows for a given match ----
async function insertStatsBatch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  actions: InputAction[],
  matchId: string,
  teamId: string,
  userId: string,
): Promise<number> {
  let inserted = 0
  for (let i = 0; i < actions.length; i += BATCH_SIZE) {
    const batch = actions.slice(i, i + BATCH_SIZE).map((a) => ({
      player: a.player,
      action_type: a.actionType,
      quality: a.quality,
      match_id: matchId,
      user_id: userId,
      team_id: teamId,
    }))

    const { data, error } = await supabase.from('stats').insert(batch).select()
    if (error) throw new Error(error.message)
    inserted += data?.length ?? 0
  }
  return inserted
}

// ---- Batch insert manually tracked actions for an existing match ----
export async function insertStats(
  actions: InputAction[],
  matchId: string,
  teamId: string,
): Promise<{ inserted: number }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const inserted = await insertStatsBatch(
    supabase,
    actions,
    matchId,
    teamId,
    user.id,
  )
  return { inserted }
}

// ---- Atomic submit: create/update match + insert all stats in one call ----
// ---- Rolls back a freshly-created match if stats insert fails ----
export async function submitMatch(payload: {
  teamId: string
  matchId: string | null
  opponentName: string
  matchDate: string
  actions: InputAction[]
  finalState: {
    teamScore: number
    opponentScore: number
    setsWon: number
    setsLost: number
    completedSets: SetResult[]
  }
}): Promise<{ matchId: string; inserted: number }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { teamId, opponentName, matchDate, actions, finalState } = payload
  let matchId = payload.matchId
  let createdFresh = false

  // ---- Step 1: create or update the match row ----
  if (matchId === null) {
    const { data, error } = await supabase
      .from('matches')
      .insert({
        team_id: teamId,
        created_by: user.id,
        opponent_name: opponentName,
        match_date: matchDate,
        team_score: finalState.teamScore,
        opp_score: finalState.opponentScore,
        sets_won: finalState.setsWon,
        sets_lost: finalState.setsLost,
        completed_sets: finalState.completedSets,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    matchId = data.id as string
    createdFresh = true
  } else {
    const { error } = await supabase
      .from('matches')
      .update({
        team_score: finalState.teamScore,
        opp_score: finalState.opponentScore,
        sets_won: finalState.setsWon,
        sets_lost: finalState.setsLost,
        completed_sets: finalState.completedSets,
      })
      .eq('id', matchId)

    if (error) throw new Error(error.message)
  }

  // ---- Step 2: batch insert stats; roll back fresh match on failure ----
  let inserted = 0
  try {
    inserted = await insertStatsBatch(
      supabase,
      actions,
      matchId,
      teamId,
      user.id,
    )
  } catch (e) {
    if (createdFresh) {
      await supabase.from('matches').delete().eq('id', matchId)
    }
    throw e
  }

  return { matchId, inserted }
}

// ---- Profile actions ----

export async function fetchUserProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, created_at, updated_at')
    .eq('id', user.id)
    .single()

  const { data: memberships } = await supabase
    .from('team_members')
    .select('team_id, role, teams(id, name, invite_code)')
    .eq('user_id', user.id)

  const teams: TeamInfo[] = (memberships ?? []).map((m) => {
    const t = m.teams as unknown as {
      id: string
      name: string
      invite_code: string
    }
    return {
      id: t.id,
      name: t.name,
      role: m.role as 'admin' | 'member',
      inviteCode: t.invite_code,
    }
  })

  return {
    id: user.id,
    email: user.email ?? '',
    username: profile?.username ?? '',
    teams,
  }
}

export async function updateUserProfile({ username }: { username: string }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('profiles')
    .update({ username, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) throw new Error(error.message)
}

// ---- Team actions ----

export async function createTeam(name: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: teamId, error } = await supabase.rpc('create_team_for_user', {
    team_name: name,
  })

  if (error) throw new Error(error.message)

  return { id: teamId as string }
}

export async function joinTeam(inviteCode: string) {
  const supabase = await createClient()

  const { data: teamId, error } = await supabase.rpc(
    'join_team_by_invite_code',
    { code: inviteCode },
  )

  if (error) throw new Error(error.message)

  return { id: teamId as string }
}

export async function leaveTeam(teamId: string) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('leave_team', {
    target_team_id: teamId,
  })

  if (error) throw new Error(error.message)
}

export async function deleteTeam(teamId: string) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('delete_team', {
    target_team_id: teamId,
  })

  if (error) throw new Error(error.message)
}

export async function getTeamMembers(
  teamId: string,
): Promise<TeamMemberInfo[]> {
  const supabase = await createClient()

  const { data: members, error } = await supabase
    .from('team_members')
    .select('id, user_id, role, joined_at')
    .eq('team_id', teamId)

  if (error) throw new Error(error.message)
  if (!members || members.length === 0) return []

  // ---- Separate query: no FK between team_members and profiles in PostgREST cache ----
  const userIds = members.map((m) => m.user_id)
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, username')
    .in('id', userIds)

  if (profErr) throw new Error(profErr.message)

  const usernameById = new Map(
    (profiles ?? []).map((p) => [p.id as string, p.username as string]),
  )

  return members.map((m) => ({
    id: m.id,
    userId: m.user_id,
    username: usernameById.get(m.user_id) ?? 'Unknown',
    role: m.role as 'admin' | 'member',
    joinedAt: m.joined_at,
  }))
}

export async function setMemberRole(
  userId: string,
  teamId: string,
  role: 'admin' | 'member',
) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('set_member_role', {
    target_user_id: userId,
    target_team_id: teamId,
    new_role: role,
  })

  if (error) throw new Error(error.message)
}

export async function updateTeamName(teamId: string, name: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('teams')
    .update({ name })
    .eq('id', teamId)

  if (error) throw new Error(error.message)
}

// ---- Player roster actions ----

export async function fetchTeamPlayers(teamId: string): Promise<TeamPlayer[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('players')
    .select('id, team_id, name, is_active, jersey_number, position, is_libero')
    .eq('team_id', teamId)
    .order('name')

  if (error) throw new Error(error.message)

  return (data ?? []).map((p) => ({
    id: p.id,
    teamId: p.team_id,
    name: p.name,
    isActive: p.is_active,
    jerseyNumber: p.jersey_number as number | null,
    position: p.position as string | null,
    isLibero: p.is_libero as boolean,
  }))
}

export async function addTeamPlayer(
  teamId: string,
  name: string,
  opts?: {
    jerseyNumber?: number | null
    position?: string | null
    isLibero?: boolean
  },
): Promise<TeamPlayer> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('players')
    .insert({
      team_id: teamId,
      name,
      jersey_number: opts?.jerseyNumber ?? null,
      position: opts?.position ?? null,
      is_libero: opts?.isLibero ?? false,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  return {
    id: data.id,
    teamId: data.team_id,
    name: data.name,
    isActive: data.is_active,
    jerseyNumber: data.jersey_number as number | null,
    position: data.position as string | null,
    isLibero: data.is_libero as boolean,
  }
}

export async function updateTeamPlayer(
  playerId: string,
  updates: {
    name?: string
    isActive?: boolean
    jerseyNumber?: number | null
    position?: string | null
    isLibero?: boolean
  },
) {
  const supabase = await createClient()

  const dbUpdates: Record<string, unknown> = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive
  if (updates.jerseyNumber !== undefined)
    dbUpdates.jersey_number = updates.jerseyNumber
  if (updates.position !== undefined) dbUpdates.position = updates.position
  if (updates.isLibero !== undefined) dbUpdates.is_libero = updates.isLibero

  const { error } = await supabase
    .from('players')
    .update(dbUpdates)
    .eq('id', playerId)

  if (error) throw new Error(error.message)
}

export async function removeTeamPlayer(playerId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('players').delete().eq('id', playerId)

  if (error) throw new Error(error.message)
}

// ---- Match actions ----

// ---- Columns needed to hydrate a MatchInfo, incl. final-state fields ----
const MATCH_SELECT =
  'id, team_id, opponent_name, match_date, action_count, created_at, team_score, opp_score, sets_won, sets_lost, completed_sets'

function rowToMatchInfo(m: Record<string, unknown>): MatchInfo {
  return {
    id: m.id as string,
    teamId: m.team_id as string,
    opponentName: m.opponent_name as string,
    matchDate: m.match_date as string,
    actionCount: m.action_count as number,
    createdAt: m.created_at as string,
    teamScore: (m.team_score as number | null) ?? null,
    opponentScore: (m.opp_score as number | null) ?? null,
    setsWon: (m.sets_won as number | null) ?? null,
    setsLost: (m.sets_lost as number | null) ?? null,
    completedSets: (m.completed_sets as SetResult[] | null) ?? null,
  }
}

export async function fetchTeamMatches(teamId: string): Promise<MatchInfo[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('matches')
    .select(MATCH_SELECT)
    .eq('team_id', teamId)
    .order('match_date', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map(rowToMatchInfo)
}

export async function fetchAllMatches(): Promise<MatchInfo[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('matches')
    .select(MATCH_SELECT)
    .order('match_date', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map(rowToMatchInfo)
}

export async function updateMatchTeam(matchId: string, teamId: string) {
  const supabase = await createClient()
  // ---- Update match + all its stats rows to the new team ----
  const { error: mErr } = await supabase
    .from('matches')
    .update({ team_id: teamId })
    .eq('id', matchId)
  if (mErr) throw new Error(mErr.message)

  const { error: sErr } = await supabase
    .from('stats')
    .update({ team_id: teamId })
    .eq('match_id', matchId)
  if (sErr) throw new Error(sErr.message)
}

export async function deleteMatch(matchId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('matches').delete().eq('id', matchId)
  if (error) throw new Error(error.message)
}

// ---- Multi-team overview for homepage ----

export async function fetchUserTeams(): Promise<TeamOverview[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data: memberships, error: memErr } = await supabase
    .from('team_members')
    .select('team_id, role, teams(id, name)')
    .eq('user_id', user.id)

  if (memErr) throw new Error(memErr.message)
  if (!memberships || memberships.length === 0) return []

  const teamIds = memberships.map((m) => m.team_id)

  // ---- Counts from matches + players tables (no full stats scan) ----
  const { data: matchRows } = await supabase
    .from('matches')
    .select('team_id, action_count')
    .in('team_id', teamIds)

  const { data: playerRows } = await supabase
    .from('players')
    .select('team_id')
    .in('team_id', teamIds)

  const matchCountMap = new Map<string, number>()
  const actionCountMap = new Map<string, number>()
  for (const r of matchRows ?? []) {
    matchCountMap.set(r.team_id, (matchCountMap.get(r.team_id) ?? 0) + 1)
    actionCountMap.set(
      r.team_id,
      (actionCountMap.get(r.team_id) ?? 0) + (r.action_count ?? 0),
    )
  }

  const playerCountMap = new Map<string, number>()
  for (const p of playerRows ?? []) {
    playerCountMap.set(p.team_id, (playerCountMap.get(p.team_id) ?? 0) + 1)
  }

  return memberships.map((m) => {
    const t = m.teams as unknown as { id: string; name: string }
    return {
      id: t.id,
      name: t.name,
      role: m.role as 'admin' | 'member',
      matchCount: matchCountMap.get(m.team_id) ?? 0,
      statsCount: actionCountMap.get(m.team_id) ?? 0,
      playerCount: playerCountMap.get(m.team_id) ?? 0,
    }
  })
}
