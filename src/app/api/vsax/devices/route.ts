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
    const { Data: devices } = await client.getDevices()

    // Upsert all devices into the local DB for historical tracking
    await Promise.all(
      devices.map((device) =>
        prisma.device.upsert({
          where: { vsaxDeviceId: device.Identifier },
          update: {
            hostname: device.Name,
            osType: null, // Basic device list doesn't include OS type, would need to fetch details
            status: 'unknown', // Basic list doesn't include online status
            agentVersion: null,
            orgName: device.OrganizationName ?? null,
            lastSeen: new Date(),
          },
          create: {
            vsaxDeviceId: device.Identifier,
            hostname: device.Name,
            osType: null,
            status: 'unknown',
            agentVersion: null,
            orgName: device.OrganizationName ?? null,
            lastSeen: new Date(),
          },
        })
      )
    )

    const dbDevices = await prisma.device.findMany({ orderBy: { hostname: 'asc' } })

    // Serialise Dates to ISO strings to match the Device API type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return NextResponse.json(dbDevices as any)
  } catch (error) {
    console.error('[/api/vsax/devices] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch devices', details: (error as Error).message },
      { status: 500 }
    )
  }
}
