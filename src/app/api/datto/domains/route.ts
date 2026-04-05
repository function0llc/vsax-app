import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getDecryptedCredential } from '@/services/credentials'
import { DattoClient } from '@/services/datto/client'
import type { BackupStatus } from '@/types'

function calculateStatus(totalSeats: number, protectedSeats: number): BackupStatus {
  if (totalSeats === 0) return 'unknown'
  if (protectedSeats === 0) return 'unprotected'
  if (protectedSeats >= totalSeats) return 'protected'
  return 'warning'
}

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
    const data = await client.getDomains()
    
    // Handle different response formats - some APIs return array directly, some wrap in items
    const domains = Array.isArray(data) ? data : (data.items || [])

    // Debug: Log raw API response to see actual field names
    console.log('[/api/datto/domains] Raw Datto response sample:', JSON.stringify(domains[0], null, 2))

    await Promise.all(
      domains.map((domain: { 
        id?: string
        domain?: string
        externalSubscriptionId?: string
        name?: string
        totalSeats?: number
        protectedSeats?: number
        userCount?: number
        protectedCount?: number
        users?: { total?: number; protected?: number }
        seats?: { total?: number; protected?: number }
        status?: string
        lastBackupTime?: string
        lastBackup?: string
      }) => {
        // Datto API uses 'domain' or 'externalSubscriptionId' as identifier, not 'id'
        const domainId = domain.id || domain.domain || domain.externalSubscriptionId
        
        if (!domainId) {
          console.warn('Skipping domain with no identifier:', domain)
          return Promise.resolve()
        }

        // Handle various possible field name formats from Datto API
        const totalSeats = domain.totalSeats ?? domain.userCount ?? domain.users?.total ?? domain.seats?.total ?? 0
        const protectedSeats = domain.protectedSeats ?? domain.protectedCount ?? domain.users?.protected ?? domain.seats?.protected ?? 0
        const status = calculateStatus(totalSeats, protectedSeats)

        return prisma.backupDomain.upsert({
          where: { dattoDomainId: domainId },
          update: {
            domainName: domain.name || domain.domain || domainId,
            totalSeats,
            protectedSeats,
            status,
            lastBackupAt: domain.lastBackupTime ? new Date(domain.lastBackupTime) : null,
          },
          create: {
            dattoDomainId: domainId,
            domainName: domain.name || domain.domain || domainId,
            totalSeats,
            protectedSeats,
            status,
            lastBackupAt: domain.lastBackupTime ? new Date(domain.lastBackupTime) : null,
          },
        })
      })
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
