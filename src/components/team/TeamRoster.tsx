'use client'

import { useState } from 'react'
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
import { TeamInfo, TeamPlayer } from '@/types'
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
import { Plus, Trash2, UserCheck, UserX, Pencil, Check, X } from 'lucide-react'
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
                <PlayerRow
                  key={player.id}
                  player={player}
                  isAdmin={isAdmin}
                  onToggleActive={() =>
                    handleToggleActive(player.id, player.isActive)
                  }
                  onRemove={() => handleRemove(player.id)}
                  onUpdate={async (updates) => {
                    try {
                      await updateTeamPlayer(player.id, updates)
                      await refreshRoster()
                    } catch (e) {
                      showError((e as Error).message)
                    }
                  }}
                />
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

// ---- Inline editable player row with jersey, position, libero ----
function PlayerRow({
  player,
  isAdmin,
  onToggleActive,
  onRemove,
  onUpdate,
}: {
  player: TeamPlayer
  isAdmin: boolean
  onToggleActive: () => void
  onRemove: () => void
  onUpdate: (updates: {
    jerseyNumber?: number | null
    position?: string | null
    isLibero?: boolean
  }) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [jersey, setJersey] = useState(player.jerseyNumber?.toString() ?? '')
  const [position, setPosition] = useState(player.position ?? '')
  const [isLibero, setIsLibero] = useState(player.isLibero)

  const handleSave = async () => {
    await onUpdate({
      jerseyNumber: jersey ? parseInt(jersey, 10) : null,
      position: position || null,
      isLibero,
    })
    setEditing(false)
  }

  const handleCancel = () => {
    setJersey(player.jerseyNumber?.toString() ?? '')
    setPosition(player.position ?? '')
    setIsLibero(player.isLibero)
    setEditing(false)
  }

  return (
    <div className="rounded-md bg-muted/50 px-3 py-2 hover:outline-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {player.jerseyNumber !== null && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-white">
              {player.jerseyNumber}
            </span>
          )}
          <span className="text-sm font-medium">{player.name}</span>
          {player.position && (
            <span className="text-xs text-muted-foreground">
              {player.position}
            </span>
          )}
          {player.isLibero && (
            <span className="text-[10px] font-bold text-orange-500">L</span>
          )}
        </div>
        {isAdmin && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setEditing(!editing)}
              title="Edit player details"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onToggleActive}
              title="Deactivate player"
            >
              <UserX className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={onRemove}
              title="Remove player"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {editing && (
        <div className="mt-2 flex flex-wrap items-center gap-2 border-t pt-2">
          <Input
            type="number"
            placeholder="#"
            value={jersey}
            onChange={(e) => setJersey(e.target.value)}
            className="h-8 w-16 text-sm"
          />
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="h-8 rounded-md border bg-background px-2 text-sm"
          >
            <option value="">Pos</option>
            <option value="OH">OH</option>
            <option value="MB">MB</option>
            <option value="S">S</option>
            <option value="OP">OP</option>
            <option value="L">L</option>
            <option value="DS">DS</option>
          </select>
          <label className="flex items-center gap-1 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={isLibero}
              onChange={(e) => setIsLibero(e.target.checked)}
            />
            Libero
          </label>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleSave}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleCancel}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}
