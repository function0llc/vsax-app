'use client'

import { useQuery } from '@tanstack/react-query'
import type { Alert } from '@/types'

export const ALERTS_QUERY_KEY = ['alerts'] as const

export function useAlerts() {
  return useQuery({
    queryKey: ALERTS_QUERY_KEY,
    queryFn: async (): Promise<Alert[]> => {
      const res = await fetch('/api/vsax/alerts')
      if (!res.ok) throw new Error('Failed to fetch alerts')
      return res.json()
    },
    staleTime: 30_000,
  })
}
