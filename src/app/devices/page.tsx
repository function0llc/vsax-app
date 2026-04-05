import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { DeviceTable } from '@/components/devices/DeviceTable'

export default async function DevicesPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <DashboardShell title="Devices">
      <DeviceTable />
    </DashboardShell>
  )
}
