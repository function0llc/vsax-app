import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/crypto'
import type { CredentialProvider } from '@/types'

export interface DecryptedCredential {
  id: string
  provider: string
  label: string
  apiKey: string
  apiSecret: string | null
  baseUrl: string
}

/**
 * Fetches the active credential for a given provider and decrypts the keys.
 * Throws if no active credential is found.
 */
export async function getDecryptedCredential(provider: CredentialProvider): Promise<DecryptedCredential> {
  const cred = await prisma.apiCredential.findFirst({
    where: { provider, isActive: true },
  })

  if (!cred) {
    throw new Error(`No active credential found for provider: ${provider}`)
  }

  return {
    id: cred.id,
    provider: cred.provider,
    label: cred.label,
    apiKey: decrypt(cred.encryptedApiKey),
    apiSecret: cred.encryptedApiSecret ? decrypt(cred.encryptedApiSecret) : null,
    baseUrl: cred.baseUrl,
  }
}
