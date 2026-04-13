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
} from '@/types'

const PAGE_SIZE = 1000
const BATCH_SIZE = 500

// ---- Helper to get authenticated user's id and active_team_id ----
async function getUserContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('active_team_id')
    .eq('id', user.id)
    .single()

  return { userId: user.id, teamId: profile?.active_team_id as string | null }
}

export async function fetchSupabaseData(): Promise<{
  rows: NotionDataRow[]
  allPlayers: string[]
  allMatches: string[]
}> {
  const supabase = await createClient()
  const players = new Set<string>()
  const matches = new Set<string>()
  const rows: NotionDataRow[] = []

  // ---- RLS filters by team automatically ----
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('stats')
      .select('player, action_type, quality, match')
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw new Error(error.message)

    for (const row of data) {
      players.add(row.player)
      if (row.match) matches.add(row.match)
      rows.push({
        name: row.player,
        value: row.quality as NotionNotation,
        type: row.action_type as DataType,
        match: row.match ?? undefined,
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

// ---- Batch insert manually tracked actions ----
export async function insertStats(
  actions: InputAction[],
  matchName: string,
): Promise<{ inserted: number }> {
  const supabase = await createClient()
  const { userId, teamId } = await getUserContext(supabase)
  if (!teamId) throw new Error('You must join a team before inserting data')

  let inserted = 0

  for (let i = 0; i < actions.length; i += BATCH_SIZE) {
    const batch = actions.slice(i, i + BATCH_SIZE).map((a) => ({
      player: a.player,
      action_type: a.actionType,
      quality: a.quality,
      match: matchName,
      user_id: userId,
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
    .select('username, active_team_id, created_at, updated_at')
    .eq('id', user.id)
    .single()

  // ---- Fetch all teams user belongs to ----
  const { data: memberships } = await supabase
    .from('team_members')
    .select('team_id, role, teams(id, name, invite_code, created_by, created_at)')
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

  // ---- Active team info ----
  const activeTeam = teams.find((t) => t.id === profile?.active_team_id) ?? null

  return {
    id: user.id,
    email: user.email ?? '',
    username: profile?.username ?? '',
    activeTeamId: profile?.active_team_id ?? null,
    teams,
    activeTeam,
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

  // ---- Uses SECURITY DEFINER function to create team + assign atomically ----
  const { data: teamId, error } = await supabase.rpc('create_team_for_user', {
    team_name: name,
  })

  if (error) throw new Error(error.message)

  return { id: teamId as string }
}

export async function joinTeam(inviteCode: string) {
  const supabase = await createClient()

  // ---- Uses SECURITY DEFINER function to bypass RLS for team lookup ----
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

export async function switchActiveTeam(teamId: string) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('switch_active_team', {
    target_team_id: teamId,
  })

  if (error) throw new Error(error.message)
}

export async function getTeamMembers(): Promise<TeamMemberInfo[]> {
  const supabase = await createClient()
  const { teamId } = await getUserContext(supabase)
  if (!teamId) return []

  const { data, error } = await supabase
    .from('team_members')
    .select('id, user_id, role, joined_at, profiles(username)')
    .eq('team_id', teamId)

  if (error) throw new Error(error.message)

  return (data ?? []).map((m) => ({
    id: m.id,
    userId: m.user_id,
    username:
      (m.profiles as unknown as { username: string })?.username ?? 'Unknown',
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

// ---- Multi-team overview for homepage ----

export async function fetchUserTeams(): Promise<TeamOverview[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  // ---- Get all teams the user belongs to ----
  const { data: memberships, error: memErr } = await supabase
    .from('team_members')
    .select('team_id, role, teams(id, name)')
    .eq('user_id', user.id)

  if (memErr) throw new Error(memErr.message)
  if (!memberships || memberships.length === 0) return []

  const teamIds = memberships.map((m) => m.team_id)

  // ---- Get stats counts per team ----
  const { data: statsCounts, error: statsErr } = await supabase
    .from('stats')
    .select('team_id')
    .in('team_id', teamIds)

  if (statsErr) throw new Error(statsErr.message)

  // ---- Get match counts per team ----
  const { data: matchData, error: matchErr } = await supabase
    .from('stats')
    .select('team_id, match')
    .in('team_id', teamIds)

  if (matchErr) throw new Error(matchErr.message)

  // ---- Get player counts per team ----
  const { data: playerCounts, error: playerErr } = await supabase
    .from('players')
    .select('team_id')
    .in('team_id', teamIds)

  if (playerErr) throw new Error(playerErr.message)

  // ---- Aggregate counts ----
  const statsCountMap = new Map<string, number>()
  for (const s of statsCounts ?? []) {
    statsCountMap.set(s.team_id, (statsCountMap.get(s.team_id) ?? 0) + 1)
  }

  const matchCountMap = new Map<string, Set<string>>()
  for (const m of matchData ?? []) {
    if (m.match) {
      if (!matchCountMap.has(m.team_id)) matchCountMap.set(m.team_id, new Set())
      matchCountMap.get(m.team_id)!.add(m.match)
    }
  }

  const playerCountMap = new Map<string, number>()
  for (const p of playerCounts ?? []) {
    playerCountMap.set(p.team_id, (playerCountMap.get(p.team_id) ?? 0) + 1)
  }

  return memberships.map((m) => {
    const t = m.teams as unknown as { id: string; name: string }
    return {
      id: t.id,
      name: t.name,
      role: m.role as 'admin' | 'member',
      matchCount: matchCountMap.get(m.team_id)?.size ?? 0,
      statsCount: statsCountMap.get(m.team_id) ?? 0,
      playerCount: playerCountMap.get(m.team_id) ?? 0,
    }
  })
}

// ---- One-time migration: assign existing data to first user ----
export async function assignExistingDataToUser() {
  const supabase = await createClient()
  const { userId, teamId } = await getUserContext(supabase)
  if (!teamId) throw new Error('You must have a team first')

  // ---- Uses SECURITY DEFINER function to access orphaned rows ----
  const { data: updated, error } = await supabase.rpc('assign_orphaned_stats', {
    target_user_id: userId,
    target_team_id: teamId,
  })

  if (error) throw new Error(error.message)
  return { updated: (updated as number) ?? 0 }
}
