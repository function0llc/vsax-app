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

    await Promise.all(
      notifications.map((notification) =>
        prisma.alert.upsert({
          where: { sourceApi_externalId: { sourceApi: 'vsax', externalId: notification.Identifier } },
          update: {
            severity: normaliseSeverity(notification.Severity),
            title: notification.Title ?? 'Untitled Alert',
            description: notification.Description ?? null,
            status: notification.IsRead ? 'resolved' : 'open',
            resolvedAt: notification.IsRead ? new Date() : null,
          },
          create: {
            sourceApi: 'vsax',
            externalId: notification.Identifier,
            severity: normaliseSeverity(notification.Severity),
            title: notification.Title ?? 'Untitled Alert',
            description: notification.Description ?? null,
            status: notification.IsRead ? 'resolved' : 'open',
            triggeredAt: notification.CreatedOn ? new Date(notification.CreatedOn) : new Date(),
            resolvedAt: notification.IsRead ? new Date() : null,
          },
        })
      )
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
