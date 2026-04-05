'use client'

import { useState } from 'react'
import { useDevices } from '@/hooks/useDevices'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { DeviceStatus } from '@/types'

const statusStyles: Record<DeviceStatus, string> = {
  online:  'bg-green-100 text-green-800 border-green-200',
  offline: 'bg-red-100 text-red-800 border-red-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  unknown: 'bg-gray-100 text-gray-600 border-gray-200',
}

export function DeviceTable() {
  const { data: devices, isLoading, error } = useDevices()
  const [search, setSearch] = useState('')

  const filtered = devices?.filter(
    (d) =>
      d.hostname.toLowerCase().includes(search.toLowerCase()) ||
      (d.orgName ?? '').toLowerCase().includes(search.toLowerCase())
  ) ?? []

  if (error) {
    return (
      <p className="text-sm text-destructive">
        Failed to load devices. Check your VSA X credentials in Settings.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by hostname or organisation…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hostname</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>OS</TableHead>
              <TableHead>Organisation</TableHead>
              <TableHead>Agent Version</TableHead>
              <TableHead>Last Seen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {search ? 'No devices match your search.' : 'No devices found.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((device) => (
                <TableRow key={device.id}>
                  <TableCell className="font-medium">{device.hostname}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn('capitalize text-xs', statusStyles[device.status])}
                    >
                      {device.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{device.osType ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{device.orgName ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{device.agentVersion ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {device.lastSeen
                      ? new Date(device.lastSeen).toLocaleString()
                      : '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
