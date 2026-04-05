// Kaseya VSA X API endpoint constants

export const VSAX_ENDPOINTS = {
  AGENTS: '/api/v1/agents',
  AGENT_BY_ID: (id: string) => `/api/v1/agents/${id}`,
  ALERTS: '/api/v1/alerts',
  ORGANIZATIONS: '/api/v1/organizations',
} as const
