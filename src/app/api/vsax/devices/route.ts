import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getDecryptedCredential } from '@/services/credentials'
import { VsaxClient } from '@/services/vsax/client'
import type { DeviceStatus } from '@/types'

function mapOnlineStatus(isOnline?: boolean, uptime?: string): DeviceStatus {
  if (isOnline === true) return 'online'
  if (isOnline === false) return 'offline'
  // VSA X returns Uptime as a string — "Offline since X" means offline, anything else means online
  if (uptime) {
    return uptime.toLowerCase().includes('offline') ? 'offline' : 'online'
  }
  return 'unknown'
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const cred = await getDecryptedCredential('vsax')
    
    const tokenId = cred.apiKey
    const tokenSecret = cred.apiSecret || ''
    
    const client = new VsaxClient(cred.baseUrl, tokenId, tokenSecret)
    const { Data: devices } = await client.getDevices()

    // Log a raw device from the list to see available fields
    if (devices.length > 0) {
      console.log('[/api/vsax/devices] List sample:', JSON.stringify(devices[0], null, 2))
    }

    // Fetch details for each device to get OS and online status
    const details = await Promise.allSettled(
      devices.map((device) => client.getDevice(device.Identifier))
    )

    // Log a raw device detail to see available fields
    const firstDetail = details[0]
    if (firstDetail?.status === 'fulfilled') {
      console.log('[/api/vsax/devices] Detail sample:', JSON.stringify(firstDetail.value.Data, null, 2))
    } else if (firstDetail?.status === 'rejected') {
      console.log('[/api/vsax/devices] Detail fetch failed:', firstDetail.reason)
    }

    // Upsert all devices with details from individual device endpoint
    await Promise.all(
      devices.map((device, index) => {
        const detailResult = details[index]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const detail = detailResult.status === 'fulfilled' ? (detailResult.value.Data as any) : null

        // VSA X API returns: Type (not ComputerType), Uptime string (not IsOnline), no ClientVersion
        const osType = detail?.Type ?? detail?.ComputerType ?? null
        const status = mapOnlineStatus(detail?.IsOnline, detail?.Uptime)
        const agentVersion = detail?.ClientVersion ?? detail?.AgentVersion ?? null

        return prisma.device.upsert({
          where: { vsaxDeviceId: device.Identifier },
          update: {
            hostname: device.Name,
            osType,
            status,
            agentVersion,
            orgName: device.OrganizationName ?? null,
            lastSeen: new Date(),
          },
          create: {
            vsaxDeviceId: device.Identifier,
            hostname: device.Name,
            osType,
            status,
            agentVersion,
            orgName: device.OrganizationName ?? null,
            lastSeen: new Date(),
          },
        })
      })
    )

    const dbDevices = await prisma.device.findMany({ orderBy: { hostname: 'asc' } })

    return NextResponse.json(dbDevices)
  } catch (error) {
    console.error('[/api/vsax/devices] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch devices', details: (error as Error).message },
      { status: 500 }
    )
  }
}
