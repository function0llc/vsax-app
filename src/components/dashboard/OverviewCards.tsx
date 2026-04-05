'use client'

import { Monitor, HardDrive, Bell, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDevices } from '@/hooks/useDevices'
import { useBackupDomains } from '@/hooks/useBackups'
import { useAlerts } from '@/hooks/useAlerts'

export function OverviewCards() {
  const { data: devices, isLoading: devicesLoading } = useDevices()
  const { data: domains, isLoading: domainsLoading } = useBackupDomains()
  const { data: alerts, isLoading: alertsLoading } = useAlerts()

  const devicesOnline = devices?.filter((d) => d.status === 'online').length ?? 0
  const devicesTotal = devices?.length ?? 0
  const domainsProtected = domains?.filter((d) => d.status === 'protected').length ?? 0
  const domainsTotal = domains?.length ?? 0
  const openAlerts = alerts?.filter((a) => a.status === 'open').length ?? 0
  const criticalAlerts = alerts?.filter((a) => a.severity === 'critical' && a.status === 'open').length ?? 0

  const cards = [
    {
      title: 'Devices Online',
      icon: Monitor,
      loading: devicesLoading,
      value: `${devicesOnline} / ${devicesTotal}`,
      sub: `${devicesTotal - devicesOnline} offline`,
    },
    {
      title: 'Domains Protected',
      icon: HardDrive,
      loading: domainsLoading,
      value: `${domainsProtected} / ${domainsTotal}`,
      sub: `${domainsTotal - domainsProtected} need attention`,
    },
    {
      title: 'Active Alerts',
      icon: Bell,
      loading: alertsLoading,
      value: openAlerts,
      sub: `${criticalAlerts} critical`,
    },
    {
      title: 'Critical Alerts',
      icon: AlertTriangle,
      loading: alertsLoading,
      value: criticalAlerts,
      sub: criticalAlerts > 0 ? 'Requires immediate attention' : 'All clear',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ title, icon: Icon, loading, value, sub }) => (
        <Card key={title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{sub}</p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
