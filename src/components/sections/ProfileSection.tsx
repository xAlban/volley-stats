'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import {
  fetchUserProfile,
  updateUserProfile,
  createTeam,
  joinTeam,
  leaveTeam,
  getTeamMembers,
  assignExistingDataToUser,
} from '@/app/actions/supabase'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { LogOut, Users, Copy, Check } from 'lucide-react'

// ---- Profile form schema ----
const profileSchema = z.object({
  username: z.string().min(2, 'Username must be at least 2 characters'),
})
type ProfileValues = z.infer<typeof profileSchema>

// ---- Team creation schema ----
const createTeamSchema = z.object({
  teamName: z.string().min(2, 'Team name must be at least 2 characters'),
})
type CreateTeamValues = z.infer<typeof createTeamSchema>

// ---- Join team schema ----
const joinTeamSchema = z.object({
  inviteCode: z.string().min(1, 'Enter an invite code'),
})
type JoinTeamValues = z.infer<typeof joinTeamSchema>

// ---- Password change schema ----
const passwordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
type PasswordValues = z.infer<typeof passwordSchema>

interface Profile {
  id: string
  email: string
  username: string
  teamId: string | null
  team: {
    id: string
    name: string
    invite_code: string
    created_by: string
    created_at: string
  } | null
}

interface TeamMember {
  id: string
  username: string
  created_at: string
}

export default function ProfileSection() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { username: '' },
  })

  const createTeamForm = useForm<CreateTeamValues>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: { teamName: '' },
  })

  const joinTeamForm = useForm<JoinTeamValues>({
    resolver: zodResolver(joinTeamSchema),
    defaultValues: { inviteCode: '' },
  })

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const loadProfile = useCallback(async () => {
    setLoading(true)
    const data = await fetchUserProfile()
    if (data) {
      setProfile(data)
      profileForm.reset({ username: data.username })
      if (data.teamId) {
        const teamMembers = await getTeamMembers()
        setMembers(teamMembers)
      }
    }
    setLoading(false)
  }, [profileForm])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

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

  async function onUpdateProfile(values: ProfileValues) {
    try {
      await updateUserProfile({ username: values.username })
      showMessage('Profile updated')
      await loadProfile()
    } catch (e) {
      showError((e as Error).message)
    }
  }

  async function onCreateTeam(values: CreateTeamValues) {
    try {
      await createTeam(values.teamName)
      createTeamForm.reset()
      showMessage('Team created')
      await loadProfile()
    } catch (e) {
      showError((e as Error).message)
    }
  }

  async function onJoinTeam(values: JoinTeamValues) {
    try {
      await joinTeam(values.inviteCode)
      joinTeamForm.reset()
      showMessage('Joined team')
      await loadProfile()
    } catch (e) {
      showError((e as Error).message)
    }
  }

  async function onLeaveTeam() {
    try {
      await leaveTeam()
      showMessage('Left team')
      setMembers([])
      await loadProfile()
    } catch (e) {
      showError((e as Error).message)
    }
  }

  async function onChangePassword(values: PasswordValues) {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      })
      if (error) throw error
      passwordForm.reset()
      showMessage('Password updated')
    } catch (e) {
      showError((e as Error).message)
    }
  }

  async function onAssignData() {
    try {
      const { updated } = await assignExistingDataToUser()
      showMessage(`Assigned ${updated} existing records to your team`)
      await loadProfile()
    } catch (e) {
      showError((e as Error).message)
    }
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  async function copyInviteCode() {
    if (profile?.team?.invite_code) {
      await navigator.clipboard.writeText(profile.team.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 overflow-y-auto p-6">
      {/* ---- Status messages ---- */}
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

      {/* ---- Profile info ---- */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>{profile?.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form
              onSubmit={profileForm.handleSubmit(onUpdateProfile)}
              className="flex flex-col gap-4"
            >
              <FormField
                control={profileForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-fit">
                Save
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* ---- Team section ---- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {profile?.team ? (
            <>
              <div className="flex flex-col gap-2">
                <p className="font-medium">{profile.team.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Invite code:
                  </span>
                  <code className="rounded bg-muted px-2 py-1 text-sm">
                    {profile.team.invite_code}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={copyInviteCode}
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* ---- Team members ---- */}
              {members.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">
                    Members ({members.length})
                  </p>
                  <div className="flex flex-col gap-1">
                    {members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm"
                      >
                        <span>{m.username}</span>
                        {m.id === profile.id && (
                          <span className="text-xs text-muted-foreground">
                            (you)
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button variant="outline" onClick={onLeaveTeam} className="w-fit">
                Leave team
              </Button>
            </>
          ) : (
            <div className="flex flex-col gap-6">
              <p className="text-sm text-muted-foreground">
                You are not part of a team. Create one or join with an invite
                code.
              </p>

              {/* ---- Create team ---- */}
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

              {/* ---- Join team ---- */}
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---- Assign existing data (one-time) ---- */}
      {profile?.team && (
        <Card>
          <CardHeader>
            <CardTitle>Import existing data</CardTitle>
            <CardDescription>
              Assign any unowned stats records to your team. Use this once after
              creating your first account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={onAssignData}>
              Assign existing data to my team
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ---- Change password ---- */}
      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form
              onSubmit={passwordForm.handleSubmit(onChangePassword)}
              className="flex flex-col gap-4"
            >
              <FormField
                control={passwordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm new password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-fit">
                Update password
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* ---- Logout ---- */}
      <Button
        variant="destructive"
        onClick={handleLogout}
        className="w-fit gap-2"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
    </div>
  )
}
