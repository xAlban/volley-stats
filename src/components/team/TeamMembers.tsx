'use client'

import { useEffect, useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { RootState } from '@/store/store'
import { setActiveTeam } from '@/store/volleySlice'
import {
  getTeamMembers,
  setMemberRole,
  leaveTeam,
  createTeam,
  joinTeam,
  fetchUserProfile,
} from '@/app/actions/supabase'
import { TeamMemberInfo } from '@/types'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Shield, User, LogOut } from 'lucide-react'

// ---- Schemas for create/join team ----
const createTeamSchema = z.object({
  teamName: z.string().min(2, 'Team name must be at least 2 characters'),
})
type CreateTeamValues = z.infer<typeof createTeamSchema>

const joinTeamSchema = z.object({
  inviteCode: z.string().min(1, 'Enter an invite code'),
})
type JoinTeamValues = z.infer<typeof joinTeamSchema>

export default function TeamMembers() {
  const dispatch = useDispatch()
  const { activeTeamId, userTeams } = useSelector(
    (state: RootState) => state.volley,
  )
  const activeTeam = userTeams.find((t) => t.id === activeTeamId)
  const isAdmin = activeTeam?.role === 'admin'

  const [members, setMembers] = useState<TeamMemberInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const createTeamForm = useForm<CreateTeamValues>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: { teamName: '' },
  })

  const joinTeamForm = useForm<JoinTeamValues>({
    resolver: zodResolver(joinTeamSchema),
    defaultValues: { inviteCode: '' },
  })

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
      const [membersList, profile] = await Promise.all([
        getTeamMembers(),
        fetchUserProfile(),
      ])
      setMembers(membersList)
      if (profile) setCurrentUserId(profile.id)
    } catch {
      // ---- Silently fail ----
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTeamId) loadMembers()
    else setLoading(false)
  }, [activeTeamId, loadMembers])

  async function handleRoleChange(userId: string, newRole: 'admin' | 'member') {
    if (!activeTeamId) return
    try {
      await setMemberRole(userId, activeTeamId, newRole)
      showMessage('Role updated')
      await loadMembers()
    } catch (e) {
      showError((e as Error).message)
    }
  }

  async function handleLeaveTeam() {
    if (!activeTeamId) return
    try {
      await leaveTeam(activeTeamId)
      // ---- Reload profile to get updated teams ----
      const profile = await fetchUserProfile()
      if (profile) {
        dispatch(
          setActiveTeam({
            teamId: profile.activeTeamId ?? '',
            teams: profile.teams,
          }),
        )
      }
      showMessage('Left team')
    } catch (e) {
      showError((e as Error).message)
    }
  }

  async function onCreateTeam(values: CreateTeamValues) {
    try {
      await createTeam(values.teamName)
      createTeamForm.reset()
      const profile = await fetchUserProfile()
      if (profile) {
        dispatch(
          setActiveTeam({
            teamId: profile.activeTeamId ?? '',
            teams: profile.teams,
          }),
        )
      }
      showMessage('Team created')
    } catch (e) {
      showError((e as Error).message)
    }
  }

  async function onJoinTeam(values: JoinTeamValues) {
    try {
      await joinTeam(values.inviteCode)
      joinTeamForm.reset()
      const profile = await fetchUserProfile()
      if (profile) {
        dispatch(
          setActiveTeam({
            teamId: profile.activeTeamId ?? '',
            teams: profile.teams,
          }),
        )
      }
      showMessage('Joined team')
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

      {/* ---- Current team members ---- */}
      {activeTeamId && (
        <Card>
          <CardHeader>
            <CardTitle>Members ({members.length})</CardTitle>
            <CardDescription>
              Team members and their roles
            </CardDescription>
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

            <Button
              variant="outline"
              className="gap-2"
              onClick={handleLeaveTeam}
            >
              <LogOut className="h-4 w-4" />
              Leave team
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ---- Create / Join team ---- */}
      <Card>
        <CardHeader>
          <CardTitle>Add another team</CardTitle>
          <CardDescription>
            Create a new team or join an existing one
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <Form {...createTeamForm}>
            <form
              onSubmit={createTeamForm.handleSubmit(onCreateTeam)}
              className="flex flex-col gap-3"
            >
              <FormField
                control={createTeamForm.control}
                name="teamName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Create a team</FormLabel>
                    <FormControl>
                      <Input placeholder="Team name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-fit">
                Create team
              </Button>
            </form>
          </Form>

          <Separator />

          <Form {...joinTeamForm}>
            <form
              onSubmit={joinTeamForm.handleSubmit(onJoinTeam)}
              className="flex flex-col gap-3"
            >
              <FormField
                control={joinTeamForm.control}
                name="inviteCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Join a team</FormLabel>
                    <FormControl>
                      <Input placeholder="Invite code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" variant="outline" className="w-fit">
                Join team
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
