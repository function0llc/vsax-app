import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encrypt, maskApiKey } from '@/lib/crypto'
import type { ApiCredential, CreateCredentialInput } from '@/types'

// GET /api/settings/credentials — list all credentials (keys masked)
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const creds = await prisma.apiCredential.findMany({ orderBy: { createdAt: 'desc' } })

    const masked: ApiCredential[] = creds.map((c) => ({
      id: c.id,
      provider: c.provider as ApiCredential['provider'],
      label: c.label,
      maskedApiKey: maskApiKey(c.encryptedApiKey), // mask the encrypted value — actual key never leaves server
      hasApiSecret: !!c.encryptedApiSecret,
      baseUrl: c.baseUrl,
      isActive: c.isActive,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }))

    return NextResponse.json(masked)
  } catch (error) {
    console.error('[GET /api/settings/credentials] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch credentials' }, { status: 500 })
  }
}

// POST /api/settings/credentials — create a new credential
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body: CreateCredentialInput = await request.json()

    if (!body.provider || !body.label || !body.apiKey || !body.baseUrl) {
      return NextResponse.json(
        { error: 'provider, label, apiKey, and baseUrl are required' },
        { status: 400 }
      )
    }

    const cred = await prisma.apiCredential.create({
      data: {
        provider: body.provider,
        label: body.label,
        encryptedApiKey: encrypt(body.apiKey),
        encryptedApiSecret: body.apiSecret ? encrypt(body.apiSecret) : null,
        baseUrl: body.baseUrl,
      },
    })

    return NextResponse.json({ id: cred.id }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/settings/credentials] Error:', error)
    return NextResponse.json({ error: 'Failed to create credential' }, { status: 500 })
  }
}
