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
    const client = new VsaxClient(cred.baseUrl, cred.apiKey)
    const { Result: apiAlerts } = await client.getAlerts()

    await Promise.all(
      apiAlerts.map((alert) =>
        prisma.alert.upsert({
          where: { sourceApi_externalId: { sourceApi: 'vsax', externalId: alert.Id } },
          update: {
            severity: normaliseSeverity(alert.Severity),
            title: alert.Title ?? 'Untitled Alert',
            description: alert.Description ?? null,
            status: alert.Status?.toLowerCase() === 'resolved' ? 'resolved' : 'open',
            resolvedAt: alert.ResolvedOn ? new Date(alert.ResolvedOn) : null,
          },
          create: {
            sourceApi: 'vsax',
            externalId: alert.Id,
            severity: normaliseSeverity(alert.Severity),
            title: alert.Title ?? 'Untitled Alert',
            description: alert.Description ?? null,
            status: alert.Status?.toLowerCase() === 'resolved' ? 'resolved' : 'open',
            triggeredAt: alert.CreatedOn ? new Date(alert.CreatedOn) : new Date(),
            resolvedAt: alert.ResolvedOn ? new Date(alert.ResolvedOn) : null,
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

function normaliseSeverity(severity?: string): string {
  const s = severity?.toLowerCase() ?? 'info'
  if (['critical', 'high', 'medium', 'low', 'info'].includes(s)) return s
  return 'info'
}
