'use client'

import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { LineChart as LineChartIcon } from 'lucide-react'
import { RootState } from '@/store/store'
import { NativeSelect } from '@/components/ui/native-select'
import EmptyState from '@/components/dashboard/EmptyState'
import {
  STATS,
  STAT_BY_ID,
  STAT_GROUP_LABELS,
  StatDef,
} from '@/utils/statCatalog'
import {
  Period,
  buildSeries,
  byMatch,
  defaultStatIds,
  matchTimeline,
  statsForScope,
  trainingInsights,
} from '@/utils/progression'
import StatSeriesCard, {
  GROUP_COLOR,
} from '@/components/analysis/progression/StatSeriesCard'
import TrainingFocusCard from '@/components/analysis/progression/TrainingFocusCard'
import ComparePlayersCard, {
  COMPARE_COLORS,
} from '@/components/analysis/progression/ComparePlayersCard'
import { cn } from '@/lib/utils'

const TEAM_SCOPE = '__team__'
const MAX_STATS = 8
const MAX_COMPARE = 4
const STORAGE_PREFIX = 'progression:stats:'

// ---- Remembered chip selection (per team / player), per device ----
function readStored(key: string): string[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key)
    const ids = raw ? (JSON.parse(raw) as string[]) : null
    return ids ? ids.filter((id) => STAT_BY_ID[id]) : null
  } catch {
    return null
  }
}
function writeStored(key: string, ids: string[]) {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(ids))
  } catch {
    // ---- Storage unavailable (private mode): selection just isn't kept ----
  }
}

// ---- Small segmented control ----
function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="glass-inset inline-flex h-9 rounded-xl p-0.5"
    >
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-[0.6rem] px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
            value === o.value && 'glass text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ---- Progression tab: statistics per match over time, team or player ----
export default function ProgressionPanel() {
  const {
    supabaseRows,
    supabaseRallies,
    supabaseMatches,
    supabaseSelectedTeams,
    userTeams,
    teamRoster,
  } = useSelector((state: RootState) => state.volley)

  // ---- Teams that actually have stats (archived teams are not loaded) ----
  const teams = useMemo(() => {
    const withData = new Set(supabaseRows.map((r) => r.teamId))
    return userTeams.filter((t) => !t.archivedAt && withData.has(t.id))
  }, [supabaseRows, userTeams])

  const [teamChoice, setTeamChoice] = useState<string | null>(null)
  const teamId =
    teamChoice && teams.some((t) => t.id === teamChoice)
      ? teamChoice
      : (teams.find((t) => supabaseSelectedTeams.includes(t.id)) ?? teams[0])
          ?.id

  const [scope, setScope] = useState<string>(TEAM_SCOPE)
  const [period, setPeriod] = useState<Period>(10)
  const [showRolling, setShowRolling] = useState(false)
  const [mode, setMode] = useState<'stats' | 'compare'>('stats')
  const [selectedByScope, setSelectedByScope] = useState<
    Record<string, string[]>
  >({})
  const [compareStatId, setCompareStatId] = useState('attack_eff')
  const [comparePicked, setComparePicked] = useState<string[] | null>(null)

  // ---- Team rows / rallies, grouped by match ----
  const teamRows = useMemo(
    () => supabaseRows.filter((r) => r.teamId === teamId),
    [supabaseRows, teamId],
  )
  const timeline = useMemo(
    () =>
      teamId
        ? matchTimeline(supabaseMatches, teamId, supabaseRows, period)
        : [],
    [supabaseMatches, teamId, supabaseRows, period],
  )
  const timelineIds = useMemo(
    () => new Set(timeline.map((m) => m.id)),
    [timeline],
  )

  // ---- Players of this team, most involved first ----
  const players = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of teamRows) counts.set(r.name, (counts.get(r.name) ?? 0) + 1)
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, n]) => ({ name, n }))
  }, [teamRows])

  const isPlayer = scope !== TEAM_SCOPE && players.some((p) => p.name === scope)
  const scopeKind = isPlayer ? 'player' : 'team'
  const scopeKey = isPlayer ? `${teamId}:${scope}` : `${teamId}:team`

  // ---- Default chips from the roster position when known ----
  const position = isPlayer
    ? (teamRoster.find((p) => p.teamId === teamId && p.name === scope)
        ?.position ?? null)
    : null
  const available = useMemo(() => statsForScope(scopeKind), [scopeKind])
  const selectedIds = (
    selectedByScope[scopeKey] ??
    readStored(scopeKey) ??
    defaultStatIds(scopeKind, position)
  ).filter((id) => available.some((s) => s.id === id))

  const toggleStat = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((s) => s !== id)
      : selectedIds.length >= MAX_STATS
        ? selectedIds
        : [...selectedIds, id]
    setSelectedByScope((prev) => ({ ...prev, [scopeKey]: next }))
    writeStored(scopeKey, next)
  }

  // ---- Series for every statistic of the scope (focus checks them all) ----
  const scopeRows = useMemo(
    () =>
      teamRows.filter(
        (r) =>
          timelineIds.has(r.matchId ?? '') && (!isPlayer || r.name === scope),
      ),
    [teamRows, timelineIds, isPlayer, scope],
  )
  const allSeries = useMemo(() => {
    const rowsByMatch = byMatch(scopeRows)
    const ralliesByMatch = isPlayer
      ? new Map()
      : byMatch(supabaseRallies.filter((r) => timelineIds.has(r.matchId)))
    return available.map((def) =>
      buildSeries(def, timeline, rowsByMatch, ralliesByMatch),
    )
  }, [scopeRows, isPlayer, supabaseRallies, timelineIds, available, timeline])

  const insights = useMemo(
    () =>
      trainingInsights({
        stats: available,
        series: allSeries,
        playerRows: isPlayer ? scopeRows : undefined,
        othersRows: isPlayer
          ? teamRows.filter(
              (r) => timelineIds.has(r.matchId ?? '') && r.name !== scope,
            )
          : undefined,
      }),
    [available, allSeries, isPlayer, scopeRows, teamRows, timelineIds, scope],
  )

  const selectedSeries = selectedIds
    .map((id) => allSeries.find((s) => s.def.id === id))
    .filter((s): s is (typeof allSeries)[number] => s !== undefined)

  // ---- Compare mode: one statistic, up to 4 players ----
  const compareDef: StatDef =
    STAT_BY_ID[compareStatId]?.scope === 'both'
      ? STAT_BY_ID[compareStatId]
      : STAT_BY_ID.attack_eff
  // ---- Actions per player for the compared statistic in the period ----
  const compareCounts = useMemo(() => {
    const counts = new Map<string, number>()
    if (compareDef.source !== 'actions') return counts
    for (const r of teamRows) {
      if (!timelineIds.has(r.matchId ?? '') || !compareDef.filter(r)) continue
      counts.set(r.name, (counts.get(r.name) ?? 0) + 1)
    }
    return counts
  }, [compareDef, teamRows, timelineIds])
  // ---- Default: the 3 players with the most actions for this statistic ----
  const comparePlayers = (
    comparePicked ??
    [...players]
      .filter((p) => (compareCounts.get(p.name) ?? 0) > 0)
      .sort(
        (a, b) =>
          (compareCounts.get(b.name) ?? 0) - (compareCounts.get(a.name) ?? 0),
      )
      .slice(0, 3)
      .map((p) => p.name)
  ).filter((n) => players.some((p) => p.name === n))
  const compareSeries = useMemo(
    () =>
      comparePlayers.map((name) =>
        buildSeries(
          compareDef,
          timeline,
          byMatch(
            teamRows.filter(
              (r) => r.name === name && timelineIds.has(r.matchId ?? ''),
            ),
          ),
          new Map(),
        ),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [comparePlayers.join('|'), compareDef, timeline, teamRows, timelineIds],
  )
  const toggleComparePlayer = (name: string) => {
    const next = comparePlayers.includes(name)
      ? comparePlayers.filter((n) => n !== name)
      : comparePlayers.length >= MAX_COMPARE
        ? comparePlayers
        : [...comparePlayers, name]
    setComparePicked(next)
  }

  if (!teamId || timeline.length === 0) {
    return (
      <EmptyState
        icon={<LineChartIcon />}
        title="No matches to show yet"
        description="Record or import matches to see how statistics evolve over time."
      />
    )
  }

  // ---- Chips grouped by skill ----
  const groups = Array.from(new Set(available.map((s) => s.group)))
  const lowSample = timeline.length < 4

  return (
    <div className="space-y-4">
      {/* ---- Controls ---- */}
      <section className="glass space-y-4 rounded-2xl p-4">
        <div className="flex flex-wrap items-end gap-3">
          {teams.length > 1 && (
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                Team
              </span>
              <NativeSelect
                wrapperClassName="w-44"
                value={teamId}
                onChange={(e) => {
                  setTeamChoice(e.target.value)
                  setScope(TEAM_SCOPE)
                  setComparePicked(null)
                }}
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </NativeSelect>
            </label>
          )}
          <Segmented
            label="View"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'stats', label: 'Statistics' },
              { value: 'compare', label: 'Compare players' },
            ]}
          />
          {mode === 'stats' && (
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                Who
              </span>
              <NativeSelect
                wrapperClassName="w-56"
                value={isPlayer ? scope : TEAM_SCOPE}
                onChange={(e) => setScope(e.target.value)}
              >
                <option value={TEAM_SCOPE}>Whole team</option>
                {players.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name} · {p.n} actions
                  </option>
                ))}
              </NativeSelect>
            </label>
          )}
          {mode === 'compare' && (
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                Statistic
              </span>
              <NativeSelect
                wrapperClassName="w-56"
                value={compareDef.id}
                onChange={(e) => setCompareStatId(e.target.value)}
              >
                {STATS.filter((s) => s.scope === 'both').map((s) => (
                  <option key={s.id} value={s.id}>
                    {STAT_GROUP_LABELS[s.group]} · {s.label}
                  </option>
                ))}
              </NativeSelect>
            </label>
          )}
          <Segmented
            label="Period"
            value={period}
            onChange={setPeriod}
            options={[
              { value: 5, label: 'Last 5' },
              { value: 10, label: 'Last 10' },
              { value: 'all', label: 'All' },
            ]}
          />
          {mode === 'stats' && (
            <label className="flex h-9 cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-[var(--primary)]"
                checked={showRolling}
                onChange={(e) => setShowRolling(e.target.checked)}
              />
              3-match average
            </label>
          )}
        </div>

        {/* ---- Statistic chips (stats mode) / player chips (compare) ---- */}
        {mode === 'stats' ? (
          <div className="space-y-2">
            {groups.map((g) => (
              <div key={g} className="flex flex-wrap items-center gap-1.5">
                <span className="w-full shrink-0 text-xs font-medium tracking-wide text-muted-foreground uppercase sm:w-24">
                  {STAT_GROUP_LABELS[g]}
                </span>
                {available
                  .filter((s) => s.group === g)
                  .map((s) => {
                    const on = selectedIds.includes(s.id)
                    return (
                      <button
                        key={s.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleStat(s.id)}
                        title={s.description}
                        className={cn(
                          'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors',
                          on
                            ? 'glass font-medium text-foreground'
                            : 'border-transparent text-muted-foreground hover:bg-accent hover:text-foreground',
                        )}
                      >
                        <span
                          className={cn(
                            'size-2 rounded-full',
                            !on && 'opacity-40',
                          )}
                          style={{ background: GROUP_COLOR[s.group] }}
                        />
                        {s.label}
                      </button>
                    )
                  })}
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              {selectedIds.length}/{MAX_STATS} selected. Hollow points: too few
              actions in that match, not counted in averages or trends.
              {!isPlayer &&
                ' Team statistics (side-out, break-point) only exist for matches recorded with the rally log.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="w-full shrink-0 text-xs font-medium tracking-wide text-muted-foreground uppercase sm:w-24">
              Players
            </span>
            {players.map((p) => {
              const idx = comparePlayers.indexOf(p.name)
              const on = idx >= 0
              return (
                <button
                  key={p.name}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleComparePlayer(p.name)}
                  className={cn(
                    'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors',
                    on
                      ? 'glass font-medium text-foreground'
                      : 'border-transparent text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  {on && (
                    <span
                      className="size-2 rounded-full"
                      style={{ background: COMPARE_COLORS[idx] }}
                    />
                  )}
                  {p.name}
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {compareCounts.get(p.name) ?? 0}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {lowSample && (
        <p className="glass-inset rounded-xl px-3 py-2 text-sm text-muted-foreground">
          Only {timeline.length} match{timeline.length > 1 ? 'es' : ''} in this
          period: trends need at least 4.
        </p>
      )}

      {mode === 'stats' ? (
        <>
          <TrainingFocusCard
            concerns={insights.concerns}
            strengths={insights.strengths}
            isPlayer={isPlayer}
          />
          {selectedSeries.length === 0 ? (
            <EmptyState
              icon={<LineChartIcon />}
              title="Pick statistics to chart"
              description="Toggle the statistics above to see their evolution."
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {selectedSeries.map((s) => (
                <StatSeriesCard
                  key={s.def.id}
                  series={s}
                  showRolling={showRolling}
                />
              ))}
            </div>
          )}
        </>
      ) : comparePlayers.length === 0 ? (
        <EmptyState
          icon={<LineChartIcon />}
          title="Pick players to compare"
          description={`Select up to ${MAX_COMPARE} players above.`}
        />
      ) : (
        <ComparePlayersCard
          def={compareDef}
          players={comparePlayers}
          series={compareSeries}
        />
      )}
    </div>
  )
}
