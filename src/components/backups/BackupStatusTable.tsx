'use client'

import { useBackupDomains } from '@/hooks/useBackups'
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

const statusStyles: Record<string, string> = {
  protected:   'bg-green-100 text-green-800 border-green-200',
  unprotected: 'bg-red-100 text-red-800 border-red-200',
  warning:     'bg-yellow-100 text-yellow-800 border-yellow-200',
  unknown:     'bg-gray-100 text-gray-600 border-gray-200',
}

export function BackupStatusTable() {
  const { data: domains, isLoading, error } = useBackupDomains()

  if (error) {
    return (
      <p className="text-sm text-destructive">
        Failed to load backup data. Check your Datto credentials in Settings.
      </p>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Domain</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total Seats</TableHead>
            <TableHead className="text-right">Protected</TableHead>
            <TableHead className="text-right">Unprotected</TableHead>
            <TableHead>Last Backup</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            ))
          ) : !domains || domains.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No backup domains found.
              </TableCell>
            </TableRow>
          ) : (
            domains.map((domain) => (
              <TableRow key={domain.id}>
                <TableCell className="font-medium">{domain.domainName}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn('capitalize text-xs', statusStyles[domain.status] ?? statusStyles.unknown)}
                  >
                    {domain.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{domain.totalSeats}</TableCell>
                <TableCell className="text-right text-green-700">{domain.protectedSeats}</TableCell>
                <TableCell className="text-right text-red-600">
                  {domain.totalSeats - domain.protectedSeats}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {domain.lastBackupAt
                    ? new Date(domain.lastBackupAt).toLocaleString()
                    : '—'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
