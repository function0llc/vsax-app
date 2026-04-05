// ─── Kaseya VSA X API Types ────────────────────────────────────────────────────

export interface VsaxAgent {
  Id: string
  ComputerName: string
  OSType?: string
  AgentStatus?: string
  AgentVersion?: string
  OrganizationName?: string
  LastSeenOnline?: string
}

export interface VsaxAgentsResponse {
  Result: VsaxAgent[]
  TotalCount?: number
}

export interface VsaxAlert {
  Id: string
  Severity?: string
  Title?: string
  Description?: string
  Status?: string
  AgentId?: string
  CreatedOn?: string
  ResolvedOn?: string
}

export interface VsaxAlertsResponse {
  Result: VsaxAlert[]
  TotalCount?: number
}

export interface VsaxOrganization {
  Id: string
  Name: string
}

export interface VsaxOrganizationsResponse {
  Result: VsaxOrganization[]
}
