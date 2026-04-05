import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/crypto'
import { getDecryptedCredential } from '@/services/credentials'
import { VsaxClient } from '@/services/vsax/client'
import { DattoClient } from '@/services/datto/client'
import type { UpdateCredentialInput, CredentialProvider } from '@/types'

// PATCH /api/settings/credentials/[id] — update a credential
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body: UpdateCredentialInput = await request.json()

    const existing = await prisma.apiCredential.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 })
    }

    await prisma.apiCredential.update({
      where: { id: params.id },
      data: {
        ...(body.label && { label: body.label }),
        ...(body.apiKey && { encryptedApiKey: encrypt(body.apiKey) }),
        ...(body.apiSecret && { encryptedApiSecret: encrypt(body.apiSecret) }),
        ...(body.baseUrl && { baseUrl: body.baseUrl }),
        ...(typeof body.isActive === 'boolean' && { isActive: body.isActive }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[PATCH /api/settings/credentials/:id] Error:', error)
    return NextResponse.json({ error: 'Failed to update credential' }, { status: 500 })
  }
}

// DELETE /api/settings/credentials/[id] — delete a credential
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const existing = await prisma.apiCredential.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 })
    }

    await prisma.apiCredential.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/settings/credentials/:id] Error:', error)
    return NextResponse.json({ error: 'Failed to delete credential' }, { status: 500 })
  }
}

// POST /api/settings/credentials/[id]/test — test connection
export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const cred = await prisma.apiCredential.findUnique({ where: { id: params.id } })
    if (!cred) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 })
    }

    const decrypted = await getDecryptedCredential(cred.provider as CredentialProvider)
    let success = false

    if (cred.provider === 'vsax') {
      const client = new VsaxClient(decrypted.baseUrl, decrypted.apiKey, decrypted.apiSecret ?? '')
      success = await client.testConnection()
    } else if (cred.provider === 'datto' && decrypted.apiSecret) {
      const client = new DattoClient(decrypted.baseUrl, decrypted.apiKey, decrypted.apiSecret)
      success = await client.testConnection()
    }

    return NextResponse.json({ success })
  } catch (error) {
    console.error('[POST /api/settings/credentials/:id/test] Error:', error)
    return NextResponse.json({ error: 'Connection test failed', details: (error as Error).message }, { status: 500 })
  }
}
