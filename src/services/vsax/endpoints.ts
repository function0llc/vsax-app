// Kaseya VSA X API endpoint constants (v3 API)

export const VSAX_ENDPOINTS = {
  DEVICES: '/api/v3/devices',
  DEVICE_BY_ID: (id: string) => `/api/v3/devices/${id}`,
  NOTIFICATIONS: '/api/v3/notifications',
  ORGANIZATIONS: '/api/v3/organizations',
} as const
