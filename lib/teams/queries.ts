import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchTeams } from './client'
import { getSocket, subscribeRooms, unsubscribeRooms } from '@/lib/socket'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const teamKeys = {
  list: (tid: string) => ['teams', tid] as const,
}

// ─── Query ────────────────────────────────────────────────────────────────────

export function useTeams(tournamentId: string) {
  return useQuery({
    queryKey: teamKeys.list(tournamentId),
    queryFn: () => fetchTeams(tournamentId),
  })
}

// ─── Realtime invalidation ────────────────────────────────────────────────────

/**
 * Subscribes to the tournament Socket.IO room and invalidates the teams query
 * whenever `registration:updated` fires — keeps approved team list current
 * without manual refresh.
 */
export function useTeamsRealtime(tournamentId: string): void {
  const qc = useQueryClient()

  useEffect(() => {
    const room = `tournament:${tournamentId}`
    subscribeRooms([room])

    const socket = getSocket()
    function handleUpdate() {
      qc.invalidateQueries({ queryKey: teamKeys.list(tournamentId) })
    }
    socket.on('registration:updated', handleUpdate)

    return () => {
      socket.off('registration:updated', handleUpdate)
      unsubscribeRooms([room])
    }
  }, [tournamentId, qc])
}
