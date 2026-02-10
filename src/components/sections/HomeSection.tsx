'use client'

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { setSupabaseData } from '@/store/volleySlice'
import { fetchSupabaseData } from '@/app/actions/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Users, Trophy } from 'lucide-react'

export default function HomeSection() {
  const dispatch = useDispatch()
  const { supabaseRows, supabaseAllPlayers, supabaseAllMatches } = useSelector(
    (state: RootState) => state.volley,
  )
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (supabaseRows.length === 0) {
      setLoading(true)
      fetchSupabaseData()
        .then((data) => dispatch(setSupabaseData(data)))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const recentMatches = supabaseAllMatches.slice(-5).reverse()

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h1 className="mb-6 text-2xl font-bold">Volley Stats</h1>

      {loading ? (
        <p className="text-muted-foreground">Loading data...</p>
      ) : (
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
                <div className="text-2xl font-bold">{supabaseRows.length}</div>
                <p className="text-xs text-muted-foreground">
                  recorded actions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Players</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {supabaseAllPlayers.length}
                </div>
                <p className="text-xs text-muted-foreground">tracked players</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Matches</CardTitle>
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
              <h2 className="mb-3 text-lg font-semibold">Recent Matches</h2>
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
    </div>
  )
}
