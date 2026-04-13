'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { RootState } from '@/store/store'
import { setActiveTeam, setCurrentSection } from '@/store/volleySlice'
import {
  fetchUserProfile,
  updateUserProfile,
  createTeam,
  joinTeam,
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
import { LogOut, ArrowRight } from 'lucide-react'

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
  activeTeamId: string | null
}

export default function ProfileSection() {
  const router = useRouter()
  const dispatch = useDispatch()
  const { userTeams } = useSelector((state: RootState) => state.volley)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hasTeams = userTeams.length > 0

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
      setProfile({
        id: data.id,
        email: data.email,
        username: data.username,
        activeTeamId: data.activeTeamId,
      })
      profileForm.reset({ username: data.username })
      // ---- Sync teams to Redux ----
      if (data.teams.length > 0 && data.activeTeamId) {
        dispatch(
          setActiveTeam({
            teamId: data.activeTeamId,
            teams: data.teams,
          }),
        )
      }
    }
    setLoading(false)
  }, [profileForm, dispatch])

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

      {/* ---- Teams quick link (if user has teams) ---- */}
      {hasTeams && (
        <Card>
          <CardHeader>
            <CardTitle>Teams</CardTitle>
            <CardDescription>
              You are in {userTeams.length} team{userTeams.length > 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => dispatch(setCurrentSection('team'))}
            >
              Manage teams
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ---- Create/Join team (only if user has no teams) ---- */}
      {!hasTeams && (
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Create a team or join one with an invite code
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
      )}

      {/* ---- Assign existing data (one-time) ---- */}
      {hasTeams && (
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
