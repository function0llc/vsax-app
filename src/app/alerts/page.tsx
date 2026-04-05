import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { AlertList } from '@/components/alerts/AlertList'

export default async function AlertsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <DashboardShell title="Alerts">
      <AlertList />
    </DashboardShell>
  )
}
