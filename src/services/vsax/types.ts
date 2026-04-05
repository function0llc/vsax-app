// ─── Kaseya VSA X API Types (v3 API) ────────────────────────────────────────────

// Device from /api/v3/devices list
export interface VsaxDevice {
  Identifier: string
  Name: string
  GroupId: number
  GroupName: string
  IsAgentInstalled: boolean
  IsMdmEnrolled: boolean
  SiteId: number
  SiteName: string
  OrganizationId: number
  OrganizationName: string
  HasCustomFields: boolean
}

// Full device details from /api/v3/devices/{id}
export interface VsaxDeviceDetails extends VsaxDevice {
  Description?: string
  Uptime?: string
  IsOnline?: boolean
  ComputerType?: string
  InMaintenance?: boolean
  ExternalIpAddress?: string
  CriticalNotifications?: number
  ElevatedNotifications?: number
  NormalNotifications?: number
  LowNotifications?: number
  LocalIpAddresses?: Array<{
    Name: string
    PhysicalAddress: string
    DhcpEnabled: boolean
    Gateways: string[]
    DnsServers: string[]
    SubnetMask: string
    IpV4: string
    IpV6: string
  }>
  ClientVersion?: string
}

export interface VsaxDevicesResponse {
  Data: VsaxDevice[]
  Meta: {
    TotalCount: number
    NextQueryLink?: string
    ResponseCode: number
  }
}

export interface VsaxDeviceResponse {
  Data: VsaxDeviceDetails
  Meta: {
    ResponseCode: number
  }
}

// Notification from /api/v3/notifications (alerts)
export interface VsaxNotification {
  Identifier: string
  DeviceIdentifier: string
  DeviceName: string
  Severity: 'Critical' | 'Elevated' | 'Normal' | 'Low'
  Title: string
  Description: string
  CreatedOn: string
  IsRead: boolean
  OrganizationId: number
  OrganizationName: string
  SiteId: number
  SiteName: string
  GroupId: number
  GroupName: string
}

export interface VsaxNotificationsResponse {
  Data: VsaxNotification[]
  Meta: {
    TotalCount: number
    NextQueryLink?: string
    ResponseCode: number
  }
}

// Organization from /api/v3/organizations
export interface VsaxOrganization {
  Id: number
  Name: string
  IsMultiSite: boolean
  HasCustomFields: boolean
}

export interface VsaxOrganizationsResponse {
  Data: VsaxOrganization[]
  Meta: {
    TotalCount: number
    NextQueryLink?: string
    ResponseCode: number
  }
}
