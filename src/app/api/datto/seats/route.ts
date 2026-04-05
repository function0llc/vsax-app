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
    const data = await client.getSeats(domain.dattoDomainId)
    
    // Handle different response formats - some APIs return array directly, some wrap in items
    const seats = Array.isArray(data) ? data : (data.items || [])

    // Debug: Log raw API response
    console.log('[/api/datto/seats] Raw Datto response sample:', JSON.stringify(seats[0], null, 2))

    await Promise.all(
      seats.map((seat: { 
        id?: string
        seatId?: string
        emailAddress?: string
        email?: string
        userEmail?: string
        firstName?: string
        lastName?: string
        seatType?: string
        type?: string
        backupStatus?: string
        status?: string
        protectionStatus?: string
        lastBackupTime?: string
        lastBackup?: string
        lastBackupAt?: string
      }) => {
        const seatId = seat.id || seat.seatId
        
        if (!seatId) {
          console.warn('Skipping seat with no identifier:', seat)
          return Promise.resolve()
        }

        // Handle various possible field names from Datto API
        const email = seat.emailAddress || seat.email || seat.userEmail || seatId
        const seatType = seat.seatType ?? seat.type ?? null
        const lastBackupStatus = seat.backupStatus ?? seat.status ?? seat.protectionStatus ?? null
        const lastBackupTime = seat.lastBackupTime ?? seat.lastBackup ?? seat.lastBackupAt ?? null

        return prisma.backupSeat.upsert({
          where: { dattoSeatId: seatId },
          update: {
            userEmail: email,
            seatType,
            lastBackupStatus,
            lastBackupAt: lastBackupTime ? new Date(lastBackupTime) : null,
          },
          create: {
            dattoSeatId: seatId,
            domainId: domain.id,
            userEmail: email,
            seatType,
            lastBackupStatus,
            lastBackupAt: lastBackupTime ? new Date(lastBackupTime) : null,
          },
        })
      })
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
