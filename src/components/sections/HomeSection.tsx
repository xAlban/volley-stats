'use client'

import { useEffect, useState, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { setActiveTeam, setSupabaseData, setCurrentSection } from '@/store/volleySlice'
import {
  fetchUserTeams,
  fetchUserProfile,
  fetchSupabaseData,
  switchActiveTeam,
} from '@/app/actions/supabase'
import { TeamOverview } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, Users, Trophy, Star, ArrowRight } from 'lucide-react'
import { weightedGPA } from '@/utils/metrics'

export default function HomeSection() {
  const dispatch = useDispatch()
  const { supabaseRows, supabaseAllMatches, activeTeamId, userTeams } =
    useSelector((state: RootState) => state.volley)
  const [loading, setLoading] = useState(false)
  const [teamOverviews, setTeamOverviews] = useState<TeamOverview[]>([])

  // ---- Load teams and data on mount ----
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        // ---- Ensure we have teams loaded ----
        if (userTeams.length === 0) {
          const profile = await fetchUserProfile()
          if (profile && profile.activeTeamId) {
            dispatch(
              setActiveTeam({
                teamId: profile.activeTeamId,
                teams: profile.teams,
              }),
            )
          }
        }

        // ---- Fetch team overviews for the cards ----
        const overviews = await fetchUserTeams()
        setTeamOverviews(overviews)

        // ---- Fetch active team stats if not loaded ----
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

  // ---- Compute MVP for active team ----
  const mvp = useMemo(() => {
    const players = [...new Set(supabaseRows.map((r) => r.name))]
    let best: string | null = null
    let bestGpa = -Infinity
    for (const player of players) {
      const playerRows = supabaseRows.filter((r) => r.name === player)
      const gpa = weightedGPA(playerRows)
      if (gpa !== null && gpa > bestGpa) {
        bestGpa = gpa
        best = player
      }
    }
    return best
  }, [supabaseRows])

  const recentMatches = supabaseAllMatches.slice(-5).reverse()

  async function handleTeamClick(teamId: string) {
    if (teamId !== activeTeamId) {
      await switchActiveTeam(teamId)
      const profile = await fetchUserProfile()
      if (profile) {
        dispatch(
          setActiveTeam({ teamId, teams: profile.teams }),
        )
      }
    }
    dispatch(setCurrentSection('team'))
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h1 className="mb-6 text-2xl font-bold">Volley Stats</h1>

      {loading ? (
        <p className="text-muted-foreground">Loading data...</p>
      ) : (
        <>
          {/* ---- Team cards ---- */}
          {teamOverviews.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-3 text-lg font-semibold">Your Teams</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {teamOverviews.map((team) => (
                  <Card
                    key={team.id}
                    className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                      team.id === activeTeamId
                        ? 'border-primary'
                        : ''
                    }`}
                    onClick={() => handleTeamClick(team.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {team.name}
                        </CardTitle>
                        {team.id === activeTeamId && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                            Active
                          </span>
                        )}
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
                      {/* ---- Show MVP for active team ---- */}
                      {team.id === activeTeamId && mvp && (
                        <div className="mt-2 flex items-center gap-1 text-sm">
                          <Star className="h-3.5 w-3.5 text-amber-500" />
                          <span className="font-medium">MVP: {mvp}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ---- No teams state ---- */}
          {teamOverviews.length === 0 && (
            <Card className="mb-8">
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
          )}

          {/* ---- Active team stats summary ---- */}
          {activeTeamId && (
            <>
              <div className="mb-8 grid gap-4 sm:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Stats
                    </CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {supabaseRows.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      recorded actions
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Players
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {new Set(supabaseRows.map((r) => r.name)).size}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      tracked players
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Matches
                    </CardTitle>
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {supabaseAllMatches.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      recorded matches
                    </p>
                  </CardContent>
                </Card>
              </div>

              {recentMatches.length > 0 && (
                <div>
                  <h2 className="mb-3 text-lg font-semibold">
                    Recent Matches
                  </h2>
                  <div className="space-y-2">
                    {recentMatches.map((match) => {
                      const count = supabaseRows.filter(
                        (r) => r.match === match,
                      ).length
                      return (
                        <Card key={match}>
                          <CardContent className="flex items-center justify-between py-3">
                            <span className="font-medium">{match}</span>
                            <span className="text-sm text-muted-foreground">
                              {count} actions
                            </span>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
