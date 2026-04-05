'use client'

import { useQuery } from '@tanstack/react-query'
import type { Device } from '@/types'

export const DEVICES_QUERY_KEY = ['devices'] as const

export function useDevices() {
  return useQuery({
    queryKey: DEVICES_QUERY_KEY,
    queryFn: async (): Promise<Device[]> => {
      const res = await fetch('/api/vsax/devices')
      if (!res.ok) throw new Error('Failed to fetch devices')
      return res.json()
    },
    staleTime: 60_000,
  })
}
