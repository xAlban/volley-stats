'use client'

import { useEffect, useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { setUserTeams, setTeamRoster } from '@/store/volleySlice'
import { fetchUserProfile, fetchTeamPlayers } from '@/app/actions/supabase'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
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
      <h1 className="mb-4 text-2xl font-bold">Teams</h1>

      {/* ---- Team switcher ---- */}
      {userTeams.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {userTeams.map((t) => (
            <Button
              key={t.id}
              variant={t.id === selectedTeamId ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTeamId(t.id)}
            >
              {t.name}
            </Button>
          ))}
        </div>
      )}

      {!selectedTeam ? (
        <CreateJoinTeam onChanged={loadTeams} />
      ) : loading ? (
        <p className="text-muted-foreground">Loading team data...</p>
      ) : (
        <>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-4">
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

          <div className="mt-8">
            <CreateJoinTeam onChanged={loadTeams} />
          </div>
        </>
      )}
    </div>
  )
}
