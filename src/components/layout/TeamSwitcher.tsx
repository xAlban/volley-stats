'use client'

import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { setActiveTeam, setCurrentSection } from '@/store/volleySlice'
import { switchActiveTeam, fetchUserProfile } from '@/app/actions/supabase'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ChevronsUpDown } from 'lucide-react'

export default function TeamSwitcher() {
  const dispatch = useDispatch()
  const { userTeams, activeTeamId } = useSelector(
    (state: RootState) => state.volley,
  )
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const activeTeam = userTeams.find((t) => t.id === activeTeamId)

  // ---- Load teams on mount if not loaded ----
  useEffect(() => {
    if (userTeams.length === 0) {
      fetchUserProfile().then((profile) => {
        if (profile) {
          dispatch(
            setActiveTeam({
              teamId: profile.activeTeamId ?? '',
              teams: profile.teams,
            }),
          )
        }
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Close menu on outside click ----
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function handleSwitch(teamId: string) {
    if (teamId === activeTeamId) {
      setOpen(false)
      return
    }
    setLoading(true)
    try {
      await switchActiveTeam(teamId)
      dispatch(
        setActiveTeam({ teamId, teams: userTeams }),
      )
    } catch {
      // ---- Silently fail ----
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  if (userTeams.length === 0) return null

  // ---- Desktop: icon button with dropdown ----
  // ---- Mobile: rendered inline where needed ----
  return (
    <div className="relative" ref={menuRef}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(!open)}
            disabled={loading}
            className="relative"
          >
            <span className="text-xs font-bold">
              {activeTeam?.name?.slice(0, 2).toUpperCase() ?? '??'}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          {activeTeam?.name ?? 'Switch team'}
        </TooltipContent>
      </Tooltip>

      {open && (
        <div className="absolute left-full top-0 z-50 ml-2 w-48 rounded-md border bg-popover p-1 shadow-md">
          <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
            Teams
          </p>
          {userTeams.map((team) => (
            <button
              key={team.id}
              onClick={() => handleSwitch(team.id)}
              className={`flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent ${
                team.id === activeTeamId ? 'bg-accent font-medium' : ''
              }`}
            >
              <span className="truncate">{team.name}</span>
              <span className="text-xs text-muted-foreground">{team.role}</span>
            </button>
          ))}
          <div className="my-1 h-px bg-border" />
          <button
            onClick={() => {
              setOpen(false)
              dispatch(setCurrentSection('team'))
            }}
            className="flex w-full items-center gap-1 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
          >
            <ChevronsUpDown className="h-3 w-3" />
            Manage teams
          </button>
        </div>
      )}
    </div>
  )
}
