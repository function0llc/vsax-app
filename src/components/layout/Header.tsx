'use client'

import { signOut, useSession } from 'next-auth/react'
import { LogOut, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface HeaderProps {
  title: string
}

export function Header({ title }: HeaderProps) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/sync', { method: 'POST' })
      if (!res.ok) throw new Error('Sync failed')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Sync completed successfully')
      queryClient.invalidateQueries()
    },
    onError: () => {
      toast.error('Sync failed. Check your API credentials.')
    },
  })

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6">
      <h1 className="text-xl font-semibold">{title}</h1>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
        >
          <RefreshCw className={cn('h-4 w-4 mr-2', syncMutation.isPending && 'animate-spin')} />
          {syncMutation.isPending ? 'Syncing…' : 'Sync Now'}
        </Button>
        <span className="text-sm text-muted-foreground">{session?.user?.email}</span>
        <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/login' })}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}

// cn import hoisted — keep at bottom to avoid lint noise
import { cn } from '@/lib/utils'
