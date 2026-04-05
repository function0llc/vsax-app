import { Sidebar } from './Sidebar'
import { Header } from './Header'

interface DashboardShellProps {
  title: string
  children: React.ReactNode
}

export function DashboardShell({ title, children }: DashboardShellProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  )
}
