'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'

interface PlayerCheckboxFilterProps {
  allPlayers: string[]
  selectedPlayers: string[]
  onPlayerToggle: (player: string) => void
  onSelectAll: () => void
}

export default function PlayerCheckboxFilter({
  allPlayers,
  selectedPlayers,
  onPlayerToggle,
  onSelectAll,
}: PlayerCheckboxFilterProps) {
  if (allPlayers.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Players</h3>
        <Button variant="ghost" size="sm" onClick={onSelectAll}>
          All
        </Button>
      </div>
      <div className="space-y-1">
        {allPlayers.map((player) => (
          <label
            key={player}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
          >
            <Checkbox
              checked={selectedPlayers.includes(player)}
              onCheckedChange={() => onPlayerToggle(player)}
            />
            <span className="text-sm">{player}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
