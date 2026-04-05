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
    const { Result: agents } = await client.getAgents()

    // Upsert all agents into the local DB for historical tracking
    await Promise.all(
      agents.map((agent) =>
        prisma.device.upsert({
          where: { vsaxDeviceId: agent.Id },
          update: {
            hostname: agent.ComputerName,
            osType: agent.OSType ?? null,
            status: normaliseStatus(agent.AgentStatus),
            agentVersion: agent.AgentVersion ?? null,
            orgName: agent.OrganizationName ?? null,
            lastSeen: agent.LastSeenOnline ? new Date(agent.LastSeenOnline) : null,
          },
          create: {
            vsaxDeviceId: agent.Id,
            hostname: agent.ComputerName,
            osType: agent.OSType ?? null,
            status: normaliseStatus(agent.AgentStatus),
            agentVersion: agent.AgentVersion ?? null,
            orgName: agent.OrganizationName ?? null,
            lastSeen: agent.LastSeenOnline ? new Date(agent.LastSeenOnline) : null,
          },
        })
      )
    )

    const devices = await prisma.device.findMany({ orderBy: { hostname: 'asc' } })

    // Serialise Dates to ISO strings to match the Device API type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return NextResponse.json(devices as any)
  } catch (error) {
    console.error('[/api/vsax/devices] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch devices', details: (error as Error).message },
      { status: 500 }
    )
  }
}

function normaliseStatus(status?: string): string {
  if (!status) return 'unknown'
  const s = status.toLowerCase()
  if (s === 'online' || s === 'active') return 'online'
  if (s === 'offline') return 'offline'
  if (s === 'warning') return 'warning'
  return 'unknown'
}
