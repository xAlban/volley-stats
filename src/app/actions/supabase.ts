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
      .select('player, action_type, quality, team_id, match_id, matches(name)')
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw new Error(error.message)

    for (const row of data) {
      const matchName =
        (row.matches as unknown as { name: string } | null)?.name ?? undefined
      players.add(row.player)
      if (matchName) matches.add(matchName)
      rows.push({
        name: row.player,
        value: row.quality as NotionNotation,
        type: row.action_type as DataType,
        match: matchName,
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

// ---- Batch insert manually tracked actions for a given match ----
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

  let inserted = 0

  for (let i = 0; i < actions.length; i += BATCH_SIZE) {
    const batch = actions.slice(i, i + BATCH_SIZE).map((a) => ({
      player: a.player,
      action_type: a.actionType,
      quality: a.quality,
      match_id: matchId,
      user_id: user.id,
      team_id: teamId,
    }))

    const { data, error } = await supabase.from('stats').insert(batch).select()

    if (error) throw new Error(error.message)
    inserted += data?.length ?? 0
  }

  return { inserted }
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

export async function getTeamMembers(teamId: string): Promise<TeamMemberInfo[]> {
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

export async function fetchTeamPlayers(
  teamId: string,
): Promise<TeamPlayer[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('players')
    .select('id, team_id, name, is_active')
    .eq('team_id', teamId)
    .order('name')

  if (error) throw new Error(error.message)

  return (data ?? []).map((p) => ({
    id: p.id,
    teamId: p.team_id,
    name: p.name,
    isActive: p.is_active,
  }))
}

export async function addTeamPlayer(
  teamId: string,
  name: string,
): Promise<TeamPlayer> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('players')
    .insert({ team_id: teamId, name })
    .select()
    .single()

  if (error) throw new Error(error.message)

  return {
    id: data.id,
    teamId: data.team_id,
    name: data.name,
    isActive: data.is_active,
  }
}

export async function updateTeamPlayer(
  playerId: string,
  updates: { name?: string; isActive?: boolean },
) {
  const supabase = await createClient()

  const dbUpdates: Record<string, unknown> = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive

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

export async function fetchTeamMatches(teamId: string): Promise<MatchInfo[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('matches')
    .select('id, name, team_id, action_count, created_at')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    teamId: m.team_id,
    actionCount: m.action_count,
    createdAt: m.created_at,
  }))
}

export async function fetchAllMatches(): Promise<MatchInfo[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('matches')
    .select('id, name, team_id, action_count, created_at')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    teamId: m.team_id,
    actionCount: m.action_count,
    createdAt: m.created_at,
  }))
}

export async function createMatch(
  teamId: string,
  name: string,
): Promise<MatchInfo> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('matches')
    .insert({ team_id: teamId, name, created_by: user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)

  return {
    id: data.id,
    name: data.name,
    teamId: data.team_id,
    actionCount: data.action_count,
    createdAt: data.created_at,
  }
}

export async function renameMatch(matchId: string, name: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('matches')
    .update({ name })
    .eq('id', matchId)
  if (error) throw new Error(error.message)
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
  const { error } = await supabase
    .from('matches')
    .delete()
    .eq('id', matchId)
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
