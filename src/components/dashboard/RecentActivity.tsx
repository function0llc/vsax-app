'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAlerts } from '@/hooks/useAlerts'
import { cn } from '@/lib/utils'
import type { AlertSeverity } from '@/types'

const severityStyles: Record<AlertSeverity, string> = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high:     'bg-orange-100 text-orange-800 border-orange-200',
  medium:   'bg-yellow-100 text-yellow-800 border-yellow-200',
  low:      'bg-blue-100 text-blue-800 border-blue-200',
  info:     'bg-gray-100 text-gray-700 border-gray-200',
}

export function RecentActivity() {
  const { data: alerts, isLoading } = useAlerts()
  const recent = alerts?.slice(0, 10) ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent alerts.</p>
        ) : (
          <ul className="space-y-3">
            {recent.map((alert) => (
              <li key={alert.id} className="flex items-start justify-between gap-4">
                <div className="space-y-0.5 min-w-0">
                  <p className="text-sm font-medium truncate">{alert.title}</p>
                  {alert.device && (
                    <p className="text-xs text-muted-foreground">{alert.device.hostname}</p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={cn('shrink-0 text-xs capitalize', severityStyles[alert.severity])}
                >
                  {alert.severity}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
