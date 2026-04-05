// Datto SaaS Protection API endpoint constants

export const DATTO_ENDPOINTS = {
  DOMAINS: '/v1/saas/domains',
  DOMAIN_BY_ID: (id: string) => `/v1/saas/domains/${id}`,
  DOMAIN_SEATS: (domainId: string) => `/v1/saas/domains/${domainId}/seats`,
  DOMAIN_BULK_STATUS: (domainId: string) => `/v1/saas/domains/${domainId}/seats/bulkSeatStatus`,
} as const
