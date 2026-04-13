'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createTeam, joinTeam } from '@/app/actions/supabase'
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

const createSchema = z.object({
  teamName: z.string().min(2, 'Team name must be at least 2 characters'),
})
type CreateValues = z.infer<typeof createSchema>

const joinSchema = z.object({
  inviteCode: z.string().min(1, 'Enter an invite code'),
})
type JoinValues = z.infer<typeof joinSchema>

export default function CreateJoinTeam({
  onChanged,
}: {
  onChanged: () => void | Promise<void>
}) {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { teamName: '' },
  })
  const joinForm = useForm<JoinValues>({
    resolver: zodResolver(joinSchema),
    defaultValues: { inviteCode: '' },
  })

  function notify(msg: string, kind: 'ok' | 'err' = 'ok') {
    if (kind === 'ok') {
      setMessage(msg)
      setError(null)
      setTimeout(() => setMessage(null), 3000)
    } else {
      setError(msg)
      setMessage(null)
      setTimeout(() => setError(null), 5000)
    }
  }

  async function onCreate(values: CreateValues) {
    try {
      await createTeam(values.teamName)
      createForm.reset()
      await onChanged()
      notify('Team created')
    } catch (e) {
      notify((e as Error).message, 'err')
    }
  }

  async function onJoin(values: JoinValues) {
    try {
      await joinTeam(values.inviteCode)
      joinForm.reset()
      await onChanged()
      notify('Joined team')
    } catch (e) {
      notify((e as Error).message, 'err')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add another team</CardTitle>
        <CardDescription>Create a new team or join one</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
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

        <Form {...createForm}>
          <form
            onSubmit={createForm.handleSubmit(onCreate)}
            className="flex flex-col gap-3"
          >
            <FormField
              control={createForm.control}
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

        <Form {...joinForm}>
          <form
            onSubmit={joinForm.handleSubmit(onJoin)}
            className="flex flex-col gap-3"
          >
            <FormField
              control={joinForm.control}
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
  )
}
