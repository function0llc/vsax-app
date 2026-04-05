import { VSAX_ENDPOINTS } from './endpoints'
import type { VsaxAgentsResponse, VsaxAlertsResponse, VsaxOrganizationsResponse } from './types'

export class VsaxClient {
  private baseUrl: string
  private apiKey: string

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.apiKey = apiKey
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`VSA X API error: ${response.status} ${response.statusText} — ${url}`)
    }

    return response.json() as Promise<T>
  }

  async getAgents(): Promise<VsaxAgentsResponse> {
    return this.request<VsaxAgentsResponse>(VSAX_ENDPOINTS.AGENTS)
  }

  async getAlerts(): Promise<VsaxAlertsResponse> {
    return this.request<VsaxAlertsResponse>(VSAX_ENDPOINTS.ALERTS)
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
