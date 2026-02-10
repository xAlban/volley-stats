'use client'

import { useCallback } from 'react'

export function usePlayerToggle(
  allPlayers: string[],
  selectedPlayers: string[],
  setSelectedPlayers: (players: string[]) => void,
) {
  const handleToggle = useCallback(
    (player: string) => {
      if (selectedPlayers.length === allPlayers.length) {
        setSelectedPlayers([player])
        return
      }

      if (selectedPlayers.includes(player)) {
        setSelectedPlayers(
          selectedPlayers.length === 1
            ? allPlayers
            : selectedPlayers.filter((v) => v !== player),
        )
        return
      }

      setSelectedPlayers([...selectedPlayers, player])
    },
    [allPlayers, selectedPlayers, setSelectedPlayers],
  )

  const handleSelectAll = useCallback(() => {
    setSelectedPlayers(allPlayers)
  }, [allPlayers, setSelectedPlayers])

  return { handleToggle, handleSelectAll }
}
