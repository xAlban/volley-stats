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
import PageHeader from '@/components/dashboard/PageHeader'
import EmptyState from '@/components/dashboard/EmptyState'
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
        // ---- Archived teams are hidden from the home stats ----
        setTeamOverviews(overviews.filter((t) => !t.archivedAt))
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
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <PageHeader title="Home" description="Your teams at a glance." />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading data...</p>
      ) : teamOverviews.length === 0 ? (
        <div className="glass rounded-2xl">
          <EmptyState
            icon={<Users />}
            title="You are not part of any team yet"
            description="Create a team or join one with an invite code to start tracking stats."
            action={
              <Button onClick={() => dispatch(setCurrentSection('team'))}>
                Get started
                <ArrowRight className="h-4 w-4" />
              </Button>
            }
          />
        </div>
      ) : (
        <section>
          <h2 className="mb-3 text-sm font-semibold">Your teams</h2>
          {/* ---- Team cards grid: add new cards here ---- */}
          <div className="grid grid-cols-1 gap-3 md:gap-4 xl:grid-cols-2 2xl:grid-cols-3">
            {teamOverviews.map((team) => {
              const mvp = mvpByTeam.get(team.id)
              return (
                <div
                  key={team.id}
                  role="button"
                  tabIndex={0}
                  className="glass cursor-pointer rounded-2xl p-5 transition-colors hover:bg-accent/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                  onClick={() => dispatch(setCurrentSection('team'))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') dispatch(setCurrentSection('team'))
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate text-base font-semibold tracking-tight">
                      {team.name}
                    </h3>
                    <span className="text-xs text-muted-foreground capitalize">
                      {team.role}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <HomeStat
                      icon={<Trophy />}
                      value={team.matchCount}
                      label="matches"
                    />
                    <HomeStat
                      icon={<Users />}
                      value={team.playerCount}
                      label="players"
                    />
                    <HomeStat
                      icon={<BarChart3 />}
                      value={team.statsCount}
                      label="actions"
                    />
                  </div>
                  {mvp && (
                    <div className="mt-3 flex items-center gap-1.5 text-sm">
                      <Star className="h-3.5 w-3.5 text-warning" />
                      <span className="font-medium">MVP: {mvp}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

// ---- Compact number tile inside a team card ----
function HomeStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: number
  label: string
}) {
  return (
    <div className="glass-inset rounded-xl px-3 py-2">
      <div className="text-muted-foreground [&_svg]:size-3.5">{icon}</div>
      <div className="mt-1 text-xl font-semibold tracking-tight tabular-nums">
        {value}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
