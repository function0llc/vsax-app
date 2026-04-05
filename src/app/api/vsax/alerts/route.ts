import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getDecryptedCredential } from '@/services/credentials'
import { VsaxClient } from '@/services/vsax/client'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const cred = await getDecryptedCredential('vsax')
    
    // VSA X uses Token ID + Token Secret for Basic Auth
    const tokenId = cred.apiKey
    const tokenSecret = cred.apiSecret || ''
    
    const client = new VsaxClient(cred.baseUrl, tokenId, tokenSecret)
    const { Data: notifications } = await client.getNotifications()

    // Log first notification to debug field names
    if (notifications.length > 0) {
      console.log('[/api/vsax/alerts] Sample notification:', JSON.stringify(notifications[0], null, 2))
    }

    await Promise.all(
      notifications.map((notification) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const n = notification as any
        // VSA X API returns: Id (number), Message, DateTime, Priority
        const externalId = String(n.Id ?? n.Identifier ?? n.id ?? n.NotificationId)
        if (!externalId || externalId === 'undefined') {
          console.warn('[/api/vsax/alerts] Skipping notification with no identifier:', notification)
          return Promise.resolve()
        }
        const title = n.Message ?? n.Title ?? 'Untitled Alert'
        const severity = normaliseSeverity(n.Priority ?? n.Severity ?? 'normal')
        const triggeredAt = n.DateTime ? new Date(n.DateTime) : (n.CreatedOn ? new Date(n.CreatedOn) : new Date())
        const isResolved = n.IsRead ?? false

        return prisma.alert.upsert({
          where: { sourceApi_externalId: { sourceApi: 'vsax', externalId } },
          update: {
            severity,
            title,
            description: n.Description ?? null,
            status: isResolved ? 'resolved' : 'open',
            resolvedAt: isResolved ? new Date() : null,
          },
          create: {
            sourceApi: 'vsax',
            externalId,
            severity,
            title,
            description: n.Description ?? null,
            status: isResolved ? 'resolved' : 'open',
            triggeredAt,
            resolvedAt: isResolved ? new Date() : null,
          },
        })
      })
    )

    const alerts = await prisma.alert.findMany({
      orderBy: { triggeredAt: 'desc' },
      include: { device: { select: { id: true, hostname: true } } },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return NextResponse.json(alerts as any)
  } catch (error) {
    console.error('[/api/vsax/alerts] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch alerts', details: (error as Error).message },
      { status: 500 }
    )
  }
}

function normaliseSeverity(severity: string): string {
  const s = severity?.toLowerCase() ?? 'info'
  if (['critical', 'elevated', 'normal', 'low'].includes(s)) {
    // Map VSA X severities to our standard
    if (s === 'critical') return 'critical'
    if (s === 'elevated') return 'high'
    if (s === 'normal') return 'medium'
    return 'low'
  }
  return 'info'
}
