import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getDecryptedCredential } from '@/services/credentials'
import { DattoClient } from '@/services/datto/client'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const domainId = request.nextUrl.searchParams.get('domainId')
  if (!domainId) {
    return NextResponse.json({ error: 'domainId query parameter is required' }, { status: 400 })
  }

  try {
    const domain = await prisma.backupDomain.findFirst({
      where: { id: domainId },
    })

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 })
    }

    const cred = await getDecryptedCredential('datto')
    if (!cred.apiSecret) {
      return NextResponse.json(
        { error: 'Datto credential is missing API secret' },
        { status: 500 }
      )
    }

    const client = new DattoClient(cred.baseUrl, cred.apiKey, cred.apiSecret)
    const { items: seats } = await client.getSeats(domain.dattoDomainId)

    await Promise.all(
      seats.map((seat) =>
        prisma.backupSeat.upsert({
          where: { dattoSeatId: seat.id },
          update: {
            userEmail: seat.emailAddress ?? seat.id,
            seatType: seat.seatType ?? null,
            lastBackupStatus: seat.backupStatus ?? null,
            lastBackupAt: seat.lastBackupTime ? new Date(seat.lastBackupTime) : null,
          },
          create: {
            dattoSeatId: seat.id,
            domainId: domain.id,
            userEmail: seat.emailAddress ?? seat.id,
            seatType: seat.seatType ?? null,
            lastBackupStatus: seat.backupStatus ?? null,
            lastBackupAt: seat.lastBackupTime ? new Date(seat.lastBackupTime) : null,
          },
        })
      )
    )

    const backupSeats = await prisma.backupSeat.findMany({
      where: { domainId },
      orderBy: { userEmail: 'asc' },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return NextResponse.json(backupSeats as any)
  } catch (error) {
    console.error('[/api/datto/seats] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch backup seats', details: (error as Error).message },
      { status: 500 }
    )
  }
}
