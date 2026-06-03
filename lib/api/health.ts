import { useQuery } from '@tanstack/react-query'
import { api } from './client'

export interface HealthStatus {
  ok: boolean
  ts: string
  mongo: 'up' | 'down'
}

export const apiKeys = {
  health: ['api', 'health'] as const,
}

/** Probes badminton-api GET /health — used to confirm REST connectivity. */
export function useApiHealth() {
  return useQuery({
    queryKey: apiKeys.health,
    queryFn: () => api.get<HealthStatus>('/health'),
    staleTime: 30_000,
  })
}
