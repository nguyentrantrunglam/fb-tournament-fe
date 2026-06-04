import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getSocket, subscribeRooms, unsubscribeRooms } from '@/lib/socket'
import { registrationKeys } from './queries'

/**
 * Subscribes to the tournament Socket.IO room and invalidates the registrations
 * query whenever the server emits `registration:updated`. Call inside any
 * component that displays live registration data for a tournament.
 */
export function useRegistrationsRealtime(tournamentId: string): void {
  const qc = useQueryClient()

  useEffect(() => {
    const room = `tournament:${tournamentId}`
    subscribeRooms([room])

    const socket = getSocket()
    function handleUpdate() {
      qc.invalidateQueries({ queryKey: registrationKeys.list(tournamentId) })
    }
    socket.on('registration:updated', handleUpdate)

    return () => {
      socket.off('registration:updated', handleUpdate)
      unsubscribeRooms([room])
    }
  }, [tournamentId, qc])
}
