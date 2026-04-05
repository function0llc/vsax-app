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
    const domain = await prisma.backupDomain.findFirst({ where: { id: domainId } })
    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 })
    }

    const cred = await getDecryptedCredential('datto')
    if (!cred.apiSecret) {
      return NextResponse.json({ error: 'Datto credential is missing API secret' }, { status: 500 })
    }

    const client = new DattoClient(cred.baseUrl, cred.apiKey, cred.apiSecret)
    const data = await client.getBulkSeatStatus(domain.dattoDomainId)

    return NextResponse.json(data)
  } catch (error) {
    console.error('[/api/datto/backup-status] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch backup status', details: (error as Error).message },
      { status: 500 }
    )
  }
}
