import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { BackupStatusTable } from '@/components/backups/BackupStatusTable'

export default async function BackupsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <DashboardShell title="Backup Status">
      <BackupStatusTable />
    </DashboardShell>
  )
}
