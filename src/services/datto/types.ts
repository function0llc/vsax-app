// ─── Datto SaaS Protection API Types ──────────────────────────────────────────

// Domain from /v1/saas/domains
export interface DattoDomain {
  // API returns different field names - could be id, domain, or externalSubscriptionId
  id?: string
  domain?: string
  externalSubscriptionId?: string
  saasCustomerId?: string
  name?: string
  totalSeats?: number
  protectedSeats?: number
  status?: string
  lastBackupTime?: string
}

// API response might be array directly or wrapped in items
export type DattoDomainsResponse = DattoDomain[] | { items: DattoDomain[] }

// Seat from /v1/saas/domains/{id}/seats
export interface DattoSeat {
  // API returns different field names - could be id or seatId
  id?: string
  seatId?: string
  emailAddress?: string
  firstName?: string
  lastName?: string
  seatType?: string
  backupStatus?: string
  lastBackupTime?: string
  remoteId?: string
}

export type DattoSeatsResponse = DattoSeat[] | { items: DattoSeat[] }

// Bulk seat status from /v1/saas/domains/{id}/seats/bulkSeatStatus
export interface DattoBulkSeatStatus {
  seatId?: string
  id?: string
  status?: string
  lastBackupTime?: string
  errorCode?: string
  errorMessage?: string
}

export type DattoBulkSeatStatusResponse = DattoBulkSeatStatus[] | { items: DattoBulkSeatStatus[] }
