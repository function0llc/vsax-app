'use client'

import { useQuery } from '@tanstack/react-query'
import type { BackupDomain, BackupSeat } from '@/types'

export const BACKUP_DOMAINS_QUERY_KEY = ['backup-domains'] as const
export const BACKUP_SEATS_QUERY_KEY = (domainId: string) => ['backup-seats', domainId] as const

export function useBackupDomains() {
  return useQuery({
    queryKey: BACKUP_DOMAINS_QUERY_KEY,
    queryFn: async (): Promise<BackupDomain[]> => {
      const res = await fetch('/api/datto/domains')
      if (!res.ok) throw new Error('Failed to fetch backup domains')
      return res.json()
    },
    staleTime: 60_000,
  })
}

export function useBackupSeats(domainId: string) {
  return useQuery({
    queryKey: BACKUP_SEATS_QUERY_KEY(domainId),
    queryFn: async (): Promise<BackupSeat[]> => {
      const res = await fetch(`/api/datto/seats?domainId=${domainId}`)
      if (!res.ok) throw new Error('Failed to fetch backup seats')
      return res.json()
    },
    enabled: !!domainId,
    staleTime: 60_000,
  })
}
