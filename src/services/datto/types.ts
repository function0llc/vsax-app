// ─── Datto SaaS Protection API Types ──────────────────────────────────────────

export interface DattoDomain {
  id: string
  saasCustomerId?: string
  name?: string
  domain?: string
  totalSeats?: number
  protectedSeats?: number
  status?: string
  lastBackupTime?: string
}

export interface DattoDomainsResponse {
  items: DattoDomain[]
  totalCount?: number
}

export interface DattoSeat {
  id: string
  emailAddress?: string
  firstName?: string
  lastName?: string
  seatType?: string
  backupStatus?: string
  lastBackupTime?: string
}

export interface DattoSeatsResponse {
  items: DattoSeat[]
  totalCount?: number
}

export interface DattoBulkSeatStatus {
  seatId: string
  status: string
  lastBackupTime?: string
}

export interface DattoBulkSeatStatusResponse {
  items: DattoBulkSeatStatus[]
}
