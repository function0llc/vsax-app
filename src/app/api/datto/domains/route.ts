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
    const data = await client.getDomains()
    
    // Handle different response formats - some APIs return array directly, some wrap in items
    const domains = Array.isArray(data) ? data : (data.items || [])

    // Log first domain to debug
    if (domains.length > 0) {
      console.log('First domain from Datto:', JSON.stringify(domains[0], null, 2))
    }

    await Promise.all(
      domains.map((domain: { 
        id?: string
        domain?: string
        externalSubscriptionId?: string
        name?: string
        totalSeats?: number
        protectedSeats?: number
        status?: string
        lastBackupTime?: string
      }) => {
        // Datto API uses 'domain' or 'externalSubscriptionId' as identifier, not 'id'
        const domainId = domain.id || domain.domain || domain.externalSubscriptionId
        
        if (!domainId) {
          console.warn('Skipping domain with no identifier:', domain)
          return Promise.resolve()
        }

        return prisma.backupDomain.upsert({
          where: { dattoDomainId: domainId },
          update: {
            domainName: domain.name || domain.domain || domainId,
            totalSeats: domain.totalSeats ?? 0,
            protectedSeats: domain.protectedSeats ?? 0,
            status: domain.status ?? 'unknown',
            lastBackupAt: domain.lastBackupTime ? new Date(domain.lastBackupTime) : null,
          },
          create: {
            dattoDomainId: domainId,
            domainName: domain.name || domain.domain || domainId,
            totalSeats: domain.totalSeats ?? 0,
            protectedSeats: domain.protectedSeats ?? 0,
            status: domain.status ?? 'unknown',
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
