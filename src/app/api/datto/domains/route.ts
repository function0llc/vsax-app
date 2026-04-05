import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getDecryptedCredential } from '@/services/credentials'
import { DattoClient } from '@/services/datto/client'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const cred = await getDecryptedCredential('datto')
    if (!cred.apiSecret) {
      return NextResponse.json(
        { error: 'Datto credential is missing API secret' },
        { status: 500 }
      )
    }

    const client = new DattoClient(cred.baseUrl, cred.apiKey, cred.apiSecret)
    const { items: domains } = await client.getDomains()

    await Promise.all(
      domains.map((domain) =>
        prisma.backupDomain.upsert({
          where: { dattoDomainId: domain.id },
          update: {
            domainName: domain.name ?? domain.domain ?? domain.id,
            totalSeats: domain.totalSeats ?? 0,
            protectedSeats: domain.protectedSeats ?? 0,
            status: domain.status ?? 'unknown',
            lastBackupAt: domain.lastBackupTime ? new Date(domain.lastBackupTime) : null,
          },
          create: {
            dattoDomainId: domain.id,
            domainName: domain.name ?? domain.domain ?? domain.id,
            totalSeats: domain.totalSeats ?? 0,
            protectedSeats: domain.protectedSeats ?? 0,
            status: domain.status ?? 'unknown',
            lastBackupAt: domain.lastBackupTime ? new Date(domain.lastBackupTime) : null,
          },
        })
      )
    )

    const backupDomains = await prisma.backupDomain.findMany({
      orderBy: { domainName: 'asc' },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return NextResponse.json(backupDomains as any)
  } catch (error) {
    console.error('[/api/datto/domains] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch backup domains', details: (error as Error).message },
      { status: 500 }
    )
  }
}
