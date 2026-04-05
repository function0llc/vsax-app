import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/sync — triggers a manual full sync.
 * The actual sync logic is handled by the individual route handlers;
 * this endpoint records a SyncLog entry and calls them in sequence.
 */
export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const log = await prisma.syncLog.create({
    data: { syncType: 'full', status: 'running' },
  })

  let recordsProcessed = 0
  let errorMessage: string | null = null

  try {
    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
    const headers = { 'Content-Type': 'application/json' }

    const [devicesRes, alertsRes, domainsRes] = await Promise.allSettled([
      fetch(`${baseUrl}/api/vsax/devices`, { headers }),
      fetch(`${baseUrl}/api/vsax/alerts`, { headers }),
      fetch(`${baseUrl}/api/datto/domains`, { headers }),
    ])

    for (const result of [devicesRes, alertsRes, domainsRes]) {
      if (result.status === 'fulfilled' && result.value.ok) {
        const data = await result.value.json()
        if (Array.isArray(data)) recordsProcessed += data.length
      }
    }

    await prisma.syncLog.update({
      where: { id: log.id },
      data: { status: 'success', recordsProcessed, completedAt: new Date() },
    })

    return NextResponse.json({ success: true, recordsProcessed })
  } catch (error) {
    errorMessage = (error as Error).message
    console.error('[/api/sync] Error:', error)

    await prisma.syncLog.update({
      where: { id: log.id },
      data: { status: 'failed', errorMessage, completedAt: new Date() },
    })

    return NextResponse.json(
      { error: 'Sync failed', details: errorMessage },
      { status: 500 }
    )
  }
}
