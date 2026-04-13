'use client'

import { useEffect, useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import {
  setActiveTeam,
  setSupabaseData,
  setTeamRoster,
} from '@/store/volleySlice'
import {
  fetchUserProfile,
  fetchSupabaseData,
  fetchTeamPlayers,
} from '@/app/actions/supabase'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import TeamOverview from '@/components/team/TeamOverview'
import TeamRoster from '@/components/team/TeamRoster'
import TeamMembers from '@/components/team/TeamMembers'

export default function TeamSection() {
  const dispatch = useDispatch()
  const { activeTeamId, userTeams, supabaseRows } = useSelector(
    (state: RootState) => state.volley,
  )
  const [loading, setLoading] = useState(false)

  const activeTeam = userTeams.find((t) => t.id === activeTeamId)

  // ---- Load data if not loaded ----
  const loadData = useCallback(async () => {
    if (!activeTeamId) {
      // ---- Fetch profile to get teams ----
      const profile = await fetchUserProfile()
      if (profile && profile.activeTeamId) {
        dispatch(
          setActiveTeam({
            teamId: profile.activeTeamId,
            teams: profile.teams,
          }),
        )
      }
      return
    }

    setLoading(true)
    try {
      const [data, roster] = await Promise.all([
        supabaseRows.length === 0 ? fetchSupabaseData() : null,
        fetchTeamPlayers(activeTeamId),
      ])
      if (data) dispatch(setSupabaseData(data))
      dispatch(setTeamRoster(roster))
    } catch {
      // ---- Silently fail ----
    } finally {
      setLoading(false)
    }
  }, [activeTeamId, supabaseRows.length, dispatch])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (!activeTeam) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-muted-foreground">
          No team selected. Create or join a team from your profile.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <h1 className="mb-4 text-2xl font-bold">{activeTeam.name}</h1>

      {loading ? (
        <p className="text-muted-foreground">Loading team data...</p>
      ) : (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="roster">Roster</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <TeamOverview />
          </TabsContent>

          <TabsContent value="roster">
            <TeamRoster />
          </TabsContent>

          <TabsContent value="members">
            <TeamMembers />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
