'use server'

import { createClient } from '@/lib/supabase/server'
import {
  InputAction,
  NotionDataRow,
  NotionNotation,
  DataType,
} from '@/types'

const PAGE_SIZE = 1000
const BATCH_SIZE = 500

// ---- Helper to get authenticated user's id and team_id ----
async function getUserContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('team_id')
    .eq('id', user.id)
    .single()

  return { userId: user.id, teamId: profile?.team_id as string | null }
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
    .select('username, team_id, created_at, updated_at')
    .eq('id', user.id)
    .single()

  // ---- Fetch team info if user has one ----
  let team = null
  if (profile?.team_id) {
    const { data } = await supabase
      .from('teams')
      .select('id, name, invite_code, created_by, created_at')
      .eq('id', profile.team_id)
      .single()
    team = data
  }

  return {
    id: user.id,
    email: user.email ?? '',
    username: profile?.username ?? '',
    teamId: profile?.team_id ?? null,
    team,
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

export async function leaveTeam() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('profiles')
    .update({ team_id: null, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) throw new Error(error.message)
}

export async function getTeamMembers() {
  const supabase = await createClient()
  const { teamId } = await getUserContext(supabase)
  if (!teamId) return []

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, created_at')
    .eq('team_id', teamId)

  if (error) throw new Error(error.message)
  return data ?? []
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
