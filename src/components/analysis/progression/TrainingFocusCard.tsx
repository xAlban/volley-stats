import { CircleCheck, Target } from 'lucide-react'
import ChartCard from '@/components/dashboard/ChartCard'
import { Insight } from '@/utils/progression'

function InsightList({
  items,
  good,
  empty,
}: {
  items: Insight[]
  good: boolean
  empty: string
}) {
  const Icon = good ? CircleCheck : Target
  return (
    <div className="min-w-0 space-y-2">
      <h3
        className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${good ? 'text-success' : 'text-danger'}`}
      >
        <Icon className="size-4" />
        {good ? 'Strengths' : 'Work on'}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((i) => (
            <li
              key={`${i.statId}-${i.kind}`}
              className="glass-inset rounded-xl px-3 py-2"
            >
              <div className="text-sm font-medium">{i.title}</div>
              <div className="text-xs text-muted-foreground tabular-nums">
                {i.text}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ---- Rule-based summary of clear changes and gaps for training ----
export default function TrainingFocusCard({
  concerns,
  strengths,
  isPlayer,
}: {
  concerns: Insight[]
  strengths: Insight[]
  isPlayer: boolean
}) {
  return (
    <ChartCard
      title="Training focus"
      description={
        isPlayer
          ? 'Clear changes over the last matches and clear gaps vs the rest of the team (≥90% confidence, enough actions). All statistics are checked, not only the selected ones.'
          : 'Clear changes over the last matches (≥90% confidence, enough actions). All statistics are checked, not only the selected ones.'
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <InsightList
          items={concerns}
          good={false}
          empty="Nothing stands out: differences are within normal match-to-match variation."
        />
        <InsightList
          items={strengths}
          good
          empty="No clear improvement or advantage yet."
        />
      </div>
    </ChartCard>
  )
}
