// ─── Auth ──────────────────────────────────────────────────────────────────────

export interface SessionUser {
  id: string
  email: string
  name?: string
}

// ─── API Credentials ───────────────────────────────────────────────────────────

export type CredentialProvider = 'vsax' | 'datto'

export interface ApiCredential {
  id: string
  provider: CredentialProvider
  label: string
  maskedApiKey: string       // "****...last4" — never the real key
  hasApiSecret: boolean
  baseUrl: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateCredentialInput {
  provider: CredentialProvider
  label: string
  apiKey: string
  apiSecret?: string
  baseUrl: string
}

export interface UpdateCredentialInput {
  label?: string
  apiKey?: string
  apiSecret?: string
  baseUrl?: string
  isActive?: boolean
}

// ─── Devices ───────────────────────────────────────────────────────────────────

export type DeviceStatus = 'online' | 'offline' | 'warning' | 'unknown'

export interface Device {
  id: string
  vsaxDeviceId: string
  hostname: string
  osType: string | null
  status: DeviceStatus
  agentVersion: string | null
  orgName: string | null
  lastSeen: string | null
  createdAt: string
  updatedAt: string
}

// ─── Backups ───────────────────────────────────────────────────────────────────

export type BackupStatus = 'protected' | 'unprotected' | 'warning' | 'unknown'

export interface BackupDomain {
  id: string
  dattoDomainId: string
  domainName: string
  totalSeats: number
  protectedSeats: number
  status: BackupStatus
  lastBackupAt: string | null
  createdAt: string
  updatedAt: string
}

export interface BackupSeat {
  id: string
  dattoSeatId: string
  domainId: string
  userEmail: string
  seatType: string | null
  lastBackupStatus: string | null
  lastBackupAt: string | null
  createdAt: string
  updatedAt: string
}

// ─── Alerts ────────────────────────────────────────────────────────────────────

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'
export type AlertStatus = 'open' | 'resolved'

export interface Alert {
  id: string
  sourceApi: string
  externalId: string
  severity: AlertSeverity
  title: string
  description: string | null
  status: AlertStatus
  deviceId: string | null
  device?: Pick<Device, 'id' | 'hostname'> | null
  triggeredAt: string
  resolvedAt: string | null
  createdAt: string
}

// ─── Sync ──────────────────────────────────────────────────────────────────────

export type SyncType = 'vsax' | 'datto' | 'full'
export type SyncStatus = 'running' | 'success' | 'failed'

export interface SyncLog {
  id: string
  syncType: SyncType
  status: SyncStatus
  recordsProcessed: number
  errorMessage: string | null
  startedAt: string
  completedAt: string | null
}

// ─── API Responses ─────────────────────────────────────────────────────────────

export interface ApiError {
  error: string
  details?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

// ─── Dashboard Overview ────────────────────────────────────────────────────────

export interface OverviewStats {
  devicesOnline: number
  devicesOffline: number
  devicesTotal: number
  backupDomainsTotal: number
  backupDomainsProtected: number
  activeAlerts: number
  criticalAlerts: number
  lastSyncAt: string | null
}
