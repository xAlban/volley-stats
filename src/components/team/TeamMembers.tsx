'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  getTeamMembers,
  setMemberRole,
  leaveTeam,
  fetchUserProfile,
} from '@/app/actions/supabase'
import { TeamInfo, TeamMemberInfo } from '@/types'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Shield, User, LogOut } from 'lucide-react'

interface Props {
  team: TeamInfo
  onLeft: () => void | Promise<void>
}

export default function TeamMembers({ team, onLeft }: Props) {
  const isAdmin = team.role === 'admin'

  const [members, setMembers] = useState<TeamMemberInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  function showMessage(msg: string) {
    setMessage(msg)
    setError(null)
    setTimeout(() => setMessage(null), 3000)
  }

  function showError(msg: string) {
    setError(msg)
    setMessage(null)
    setTimeout(() => setError(null), 5000)
  }

  const loadMembers = useCallback(async () => {
    setLoading(true)
    try {
      const [list, profile] = await Promise.all([
        getTeamMembers(team.id),
        fetchUserProfile(),
      ])
      setMembers(list)
      if (profile) setCurrentUserId(profile.id)
    } catch (e) {
      showError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [team.id])

  useEffect(() => {
    loadMembers()
  }, [loadMembers])

  async function handleRoleChange(userId: string, newRole: 'admin' | 'member') {
    try {
      await setMemberRole(userId, team.id, newRole)
      showMessage('Role updated')
      await loadMembers()
    } catch (e) {
      showError((e as Error).message)
    }
  }

  async function handleLeaveTeam() {
    try {
      await leaveTeam(team.id)
      showMessage('Left team')
      await onLeft()
    } catch (e) {
      showError((e as Error).message)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {message && (
        <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Members ({members.length})</CardTitle>
          <CardDescription>Team members and their roles</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <div className="flex flex-col gap-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    {member.role === 'admin' ? (
                      <Shield className="h-4 w-4 text-amber-500" />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">
                      {member.username}
                    </span>
                    {member.userId === currentUserId && (
                      <span className="text-xs text-muted-foreground">
                        (you)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {member.role}
                    </span>
                    {isAdmin && member.userId !== currentUserId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() =>
                          handleRoleChange(
                            member.userId,
                            member.role === 'admin' ? 'member' : 'admin',
                          )
                        }
                      >
                        {member.role === 'admin' ? 'Demote' : 'Promote'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <Separator className="my-4" />

          <Button variant="outline" className="gap-2" onClick={handleLeaveTeam}>
            <LogOut className="h-4 w-4" />
            Leave team
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
