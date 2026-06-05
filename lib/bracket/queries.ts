import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchBracket, createSkeleton, drawBracket, type SkeletonGroupKoBody } from './client'
import { getSocket, subscribeRooms, unsubscribeRooms } from '@/lib/socket'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const bracketKeys = {
  detail: (categoryId: string) => ['bracket', categoryId] as const,
}

// ─── Query ────────────────────────────────────────────────────────────────────

/** Returns null when no bracket exists yet for the category. */
export function useBracket(categoryId: string) {
  return useQuery({
    queryKey: bracketKeys.detail(categoryId),
    queryFn: () => fetchBracket(categoryId),
    // null is a valid success value — do not retry on SKELETON_NOT_FOUND
    retry: false,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateSkeleton(categoryId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body?: SkeletonGroupKoBody) => createSkeleton(categoryId, body),
    meta: { success: 'Đã dựng khung thi đấu' },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: bracketKeys.detail(categoryId) })
    },
  })
}

export function useDrawBracket(categoryId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => drawBracket(categoryId),
    meta: { success: 'Đã bốc thăm thành công' },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: bracketKeys.detail(categoryId) })
    },
  })
}

// ─── Realtime invalidation ─────────────────────────────────────────────────────

/**
 * Subscribes to the category Socket.IO room and invalidates the bracket query
 * when the server emits bracket:skeleton or bracket:drawn events.
 */
export function useBracketRealtime(categoryId: string): void {
  const qc = useQueryClient()

  useEffect(() => {
    const room = `category:${categoryId}`
    subscribeRooms([room])

    const socket = getSocket()

    function handleUpdate() {
      void qc.invalidateQueries({ queryKey: bracketKeys.detail(categoryId) })
    }

    socket.on('bracket:skeleton', handleUpdate)
    socket.on('bracket:drawn', handleUpdate)

    return () => {
      socket.off('bracket:skeleton', handleUpdate)
      socket.off('bracket:drawn', handleUpdate)
      unsubscribeRooms([room])
    }
  }, [categoryId, qc])
}
