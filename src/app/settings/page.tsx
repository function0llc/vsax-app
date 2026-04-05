import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { ApiKeyList } from '@/components/settings/ApiKeyList'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <DashboardShell title="Settings">
      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold mb-1">API Credentials</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Manage your VSA X and Datto SaaS Protection API credentials. Keys are stored encrypted.
          </p>
          <ApiKeyList />
        </div>
      </div>
    </DashboardShell>
  )
}
