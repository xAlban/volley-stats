'use client'

import { useEffect, useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { setUserTeams, setTeamRoster } from '@/store/volleySlice'
import { fetchUserProfile, fetchTeamPlayers } from '@/app/actions/supabase'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PageHeader from '@/components/dashboard/PageHeader'
import { cn } from '@/lib/utils'
import TeamOverview from '@/components/team/TeamOverview'
import TeamRoster from '@/components/team/TeamRoster'
import TeamMembers from '@/components/team/TeamMembers'
import TeamMatches from '@/components/team/TeamMatches'
import CreateJoinTeam from '@/components/team/CreateJoinTeam'

export default function TeamSection() {
  const dispatch = useDispatch()
  const { userTeams } = useSelector((state: RootState) => state.volley)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const selectedTeam = userTeams.find((t) => t.id === selectedTeamId) ?? null

  const loadTeams = useCallback(async () => {
    const profile = await fetchUserProfile()
    if (profile) dispatch(setUserTeams(profile.teams))
  }, [dispatch])

  useEffect(() => {
    if (userTeams.length === 0) loadTeams()
  }, [userTeams.length, loadTeams])

  // ---- Auto-select first team when list changes ----
  useEffect(() => {
    if (
      userTeams.length > 0 &&
      !userTeams.find((t) => t.id === selectedTeamId)
    ) {
      setSelectedTeamId(userTeams[0].id)
    }
    if (userTeams.length === 0) setSelectedTeamId(null)
  }, [userTeams, selectedTeamId])

  // ---- Load roster for selected team ----
  useEffect(() => {
    if (!selectedTeamId) return
    setLoading(true)
    fetchTeamPlayers(selectedTeamId)
      .then((roster) => dispatch(setTeamRoster(roster)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedTeamId, dispatch])

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <PageHeader
        title="Teams"
        description="Manage your teams, matches, roster and members."
      />

      {/* ---- Team switcher: segmented pill row ---- */}
      {userTeams.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1 rounded-2xl glass-inset p-1 w-fit max-w-full">
          {userTeams.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTeamId(t.id)}
              className={cn(
                'rounded-xl px-3 py-1.5 text-sm font-medium transition-colors',
                t.id === selectedTeamId
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
                t.archivedAt && t.id !== selectedTeamId && 'opacity-60',
              )}
            >
              {t.name}
              {/* ---- Archived teams stay reachable to unarchive them ---- */}
              {t.archivedAt ? ' (archived)' : ''}
            </button>
          ))}
        </div>
      )}

      {!selectedTeam ? (
        <CreateJoinTeam onChanged={loadTeams} />
      ) : loading ? (
        <p className="text-sm text-muted-foreground">Loading team data...</p>
      ) : (
        <>
          <Tabs defaultValue="overview" className="w-full gap-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="matches">Matches</TabsTrigger>
              <TabsTrigger value="roster">Roster</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <TeamOverview team={selectedTeam} onDeleted={loadTeams} />
            </TabsContent>

            <TabsContent value="matches">
              <TeamMatches team={selectedTeam} />
            </TabsContent>

            <TabsContent value="roster">
              <TeamRoster team={selectedTeam} />
            </TabsContent>

            <TabsContent value="members">
              <TeamMembers team={selectedTeam} onLeft={loadTeams} />
            </TabsContent>
          </Tabs>

          <div className="mt-6">
            <CreateJoinTeam onChanged={loadTeams} />
          </div>
        </>
      )}
    </div>
  )
}
