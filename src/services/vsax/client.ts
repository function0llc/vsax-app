import { VSAX_ENDPOINTS } from './endpoints'
import type { VsaxDevicesResponse, VsaxNotificationsResponse, VsaxOrganizationsResponse, VsaxDevice } from './types'

export class VsaxClient {
  private baseUrl: string
  private tokenId: string
  private tokenSecret: string

  constructor(baseUrl: string, tokenId: string, tokenSecret: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.tokenId = tokenId
    this.tokenSecret = tokenSecret
  }

  private getAuthHeader(): string {
    // VSA X uses Basic Auth with Token ID and Token Secret
    const credentials = Buffer.from(`${this.tokenId}:${this.tokenSecret}`).toString('base64')
    return `Basic ${credentials}`
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`VSA X API error: ${response.status} ${response.statusText} — ${url}`)
    }

    return response.json() as Promise<T>
  }

  async getDevices(): Promise<VsaxDevicesResponse> {
    return this.request<VsaxDevicesResponse>(VSAX_ENDPOINTS.DEVICES)
  }

  async getDevice(id: string): Promise<{ Data: VsaxDevice }> {
    return this.request<{ Data: VsaxDevice }>(VSAX_ENDPOINTS.DEVICE_BY_ID(id))
  }

  async getNotifications(): Promise<VsaxNotificationsResponse> {
    return this.request<VsaxNotificationsResponse>(VSAX_ENDPOINTS.NOTIFICATIONS)
  }

  async getOrganizations(): Promise<VsaxOrganizationsResponse> {
    return this.request<VsaxOrganizationsResponse>(VSAX_ENDPOINTS.ORGANIZATIONS)
  }

  /** Validates the credential by making a lightweight API call. */
  async testConnection(): Promise<boolean> {
    try {
      await this.request(VSAX_ENDPOINTS.ORGANIZATIONS)
      return true
    } catch {
      return false
    }
  }
}
