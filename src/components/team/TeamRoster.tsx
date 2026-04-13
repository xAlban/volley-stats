'use client'

import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { RootState } from '@/store/store'
import { setTeamRoster } from '@/store/volleySlice'
import {
  addTeamPlayer,
  removeTeamPlayer,
  updateTeamPlayer,
  fetchTeamPlayers,
} from '@/app/actions/supabase'
import { TeamInfo } from '@/types'
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
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, UserCheck, UserX } from 'lucide-react'
import { toast } from 'sonner'

const addPlayerSchema = z.object({
  name: z.string().min(1, 'Player name required'),
})
type AddPlayerValues = z.infer<typeof addPlayerSchema>

export default function TeamRoster({ team }: { team: TeamInfo }) {
  const dispatch = useDispatch()
  const { teamRoster } = useSelector((state: RootState) => state.volley)
  const isAdmin = team.role === 'admin'

  const form = useForm<AddPlayerValues>({
    resolver: zodResolver(addPlayerSchema),
    defaultValues: { name: '' },
  })

  function showMessage(msg: string) {
    toast.success(msg, {
      position: 'bottom-center',
      style: { color: 'white', background: 'var(--stat-positive)' },
    })
  }

  function showError(msg: string) {
    toast.error(msg, {
      position: 'bottom-center',
      style: { color: 'white', background: 'var(--stat-error)' },
    })
  }

  async function refreshRoster() {
    const roster = await fetchTeamPlayers(team.id)
    dispatch(setTeamRoster(roster))
  }

  async function onAddPlayer(values: AddPlayerValues) {
    try {
      await addTeamPlayer(team.id, values.name.trim())
      form.reset()
      showMessage('Player added')
      await refreshRoster()
    } catch (e) {
      showError((e as Error).message)
    }
  }

  async function handleToggleActive(playerId: string, isActive: boolean) {
    try {
      await updateTeamPlayer(playerId, { isActive: !isActive })
      showMessage(isActive ? 'Player deactivated' : 'Player activated')
      await refreshRoster()
    } catch (e) {
      showError((e as Error).message)
    }
  }

  async function handleRemove(playerId: string) {
    try {
      await removeTeamPlayer(playerId)
      showMessage('Player removed')
      await refreshRoster()
    } catch (e) {
      showError((e as Error).message)
    }
  }

  const activePlayers = teamRoster.filter((p) => p.isActive)
  const inactivePlayers = teamRoster.filter((p) => !p.isActive)

  return (
    <div className="flex flex-col gap-6">
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Add Player</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onAddPlayer)}
                className="flex gap-2"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="Player name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Active Players ({activePlayers.length})</CardTitle>
          <CardDescription>
            Players available for match tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activePlayers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active players. {isAdmin ? 'Add players above.' : ''}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {activePlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 hover:outline-2"
                >
                  <span className="text-sm font-medium">{player.name}</span>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          handleToggleActive(player.id, player.isActive)
                        }
                        title="Deactivate player"
                      >
                        <UserX className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleRemove(player.id)}
                        title="Remove player"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {inactivePlayers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Inactive Players ({inactivePlayers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {inactivePlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2 opacity-60"
                >
                  <span className="text-sm">{player.name}</span>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          handleToggleActive(player.id, player.isActive)
                        }
                        title="Activate player"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleRemove(player.id)}
                        title="Remove player"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
