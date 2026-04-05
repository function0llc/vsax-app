import { DATTO_ENDPOINTS } from './endpoints'
import type {
  DattoDomainsResponse,
  DattoSeatsResponse,
  DattoBulkSeatStatusResponse,
} from './types'

export class DattoClient {
  private baseUrl: string
  private authHeader: string

  constructor(baseUrl: string, apiKey: string, apiSecret: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    // Datto uses HTTP Basic Auth: apiKey as username, apiSecret as password
    this.authHeader = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`Datto API error: ${response.status} ${response.statusText} — ${url}`)
    }

    return response.json() as Promise<T>
  }

  async getDomains(): Promise<DattoDomainsResponse> {
    return this.request<DattoDomainsResponse>(DATTO_ENDPOINTS.DOMAINS)
  }

  async getSeats(domainId: string): Promise<DattoSeatsResponse> {
    return this.request<DattoSeatsResponse>(DATTO_ENDPOINTS.DOMAIN_SEATS(domainId))
  }

  async getBulkSeatStatus(domainId: string): Promise<DattoBulkSeatStatusResponse> {
    return this.request<DattoBulkSeatStatusResponse>(DATTO_ENDPOINTS.DOMAIN_BULK_STATUS(domainId))
  }

  /** Validates the credential by making a lightweight API call. */
  async testConnection(): Promise<boolean> {
    try {
      await this.request(DATTO_ENDPOINTS.DOMAINS)
      return true
    } catch {
      return false
    }
  }
}
