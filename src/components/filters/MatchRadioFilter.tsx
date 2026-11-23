'use client'

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

interface MatchRadioFilterProps {
  allMatches: string[]
  selectedMatch: string | 'all'
  onMatchChange: (match: string | 'all') => void
}

export default function MatchRadioFilter({
  allMatches,
  selectedMatch,
  onMatchChange,
}: MatchRadioFilterProps) {
  if (allMatches.length === 0) return null

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Match
      </h3>
      <RadioGroup
        value={selectedMatch}
        onValueChange={onMatchChange}
        className="gap-0"
      >
        <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent">
          <RadioGroupItem value="all" id="match-all" />
          <Label htmlFor="match-all" className="cursor-pointer text-sm">
            All matches
          </Label>
        </label>
        {allMatches.map((match) => (
          <label
            key={match}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent"
          >
            <RadioGroupItem value={match} id={`match-${match}`} />
            <Label
              htmlFor={`match-${match}`}
              className="cursor-pointer text-sm"
            >
              {match}
            </Label>
          </label>
        ))}
      </RadioGroup>
    </div>
  )
}
