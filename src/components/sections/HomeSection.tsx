'use client'

import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import {
  setUserTeams,
  setSupabaseData,
  setCurrentSection,
} from '@/store/volleySlice'
import {
  fetchUserTeams,
  fetchUserProfile,
  fetchSupabaseData,
} from '@/app/actions/supabase'
import { TeamOverview } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, Users, Trophy, Star, ArrowRight } from 'lucide-react'
import { weightedGPA } from '@/utils/metrics'

export default function HomeSection() {
  const dispatch = useDispatch()
  const { supabaseRows, userTeams } = useSelector(
    (state: RootState) => state.volley,
  )
  const [loading, setLoading] = useState(false)
  const [teamOverviews, setTeamOverviews] = useState<TeamOverview[]>([])

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        if (userTeams.length === 0) {
          const profile = await fetchUserProfile()
          if (profile) dispatch(setUserTeams(profile.teams))
        }
        const overviews = await fetchUserTeams()
        setTeamOverviews(overviews)
        if (supabaseRows.length === 0) {
          const data = await fetchSupabaseData()
          dispatch(setSupabaseData(data))
        }
      } catch {
        // ---- Silently fail ----
      } finally {
        setLoading(false)
      }
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Compute MVP per team from supabaseRows grouped by teamId ----
  const mvpByTeam = useMemo(() => {
    const result = new Map<string, string>()
    const teamIds = new Set(supabaseRows.map((r) => r.teamId).filter(Boolean))
    for (const teamId of teamIds) {
      const teamRows = supabaseRows.filter((r) => r.teamId === teamId)
      const players = [...new Set(teamRows.map((r) => r.name))]
      let best: string | null = null
      let bestGpa = -Infinity
      for (const player of players) {
        const gpa = weightedGPA(teamRows.filter((r) => r.name === player))
        if (gpa !== null && gpa > bestGpa) {
          bestGpa = gpa
          best = player
        }
      }
      if (best && teamId) result.set(teamId, best)
    }
    return result
  }, [supabaseRows])

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h1 className="mb-6 text-2xl font-bold">Volley Stats</h1>

      {loading ? (
        <p className="text-muted-foreground">Loading data...</p>
      ) : teamOverviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <p className="text-muted-foreground">
              You are not part of any team yet.
            </p>
            <Button
              onClick={() => dispatch(setCurrentSection('team'))}
              className="gap-2"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Your Teams</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {teamOverviews.map((team) => {
              const mvp = mvpByTeam.get(team.id)
              return (
                <Card
                  key={team.id}
                  className="cursor-pointer transition-colors hover:bg-accent/50"
                  onClick={() => dispatch(setCurrentSection('team'))}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{team.name}</CardTitle>
                      <span className="text-xs text-muted-foreground">
                        {team.role}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Trophy className="h-3.5 w-3.5" />
                        {team.matchCount} matches
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {team.playerCount} players
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart3 className="h-3.5 w-3.5" />
                        {team.statsCount} actions
                      </span>
                    </div>
                    {mvp && (
                      <div className="mt-2 flex items-center gap-1 text-sm">
                        <Star className="h-3.5 w-3.5 text-amber-500" />
                        <span className="font-medium">MVP: {mvp}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
