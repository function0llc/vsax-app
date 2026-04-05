'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Trash2, ToggleLeft, ToggleRight, Plus, Wifi } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ApiKeyForm } from './ApiKeyForm'
import type { ApiCredential } from '@/types'

export const CREDENTIALS_QUERY_KEY = ['credentials'] as const

export function ApiKeyList() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data: creds, isLoading } = useQuery({
    queryKey: CREDENTIALS_QUERY_KEY,
    queryFn: async (): Promise<ApiCredential[]> => {
      const res = await fetch('/api/settings/credentials')
      if (!res.ok) throw new Error('Failed to fetch credentials')
      return res.json()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/settings/credentials/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
    },
    onSuccess: () => {
      toast.success('Credential deleted')
      queryClient.invalidateQueries({ queryKey: CREDENTIALS_QUERY_KEY })
    },
    onError: () => toast.error('Failed to delete credential'),
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/settings/credentials/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      })
      if (!res.ok) throw new Error('Failed to update')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CREDENTIALS_QUERY_KEY }),
    onError: () => toast.error('Failed to update credential'),
  })

  const testMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/settings/credentials/${id}`, { method: 'POST' })
      if (!res.ok) throw new Error('Test failed')
      return res.json() as Promise<{ success: boolean }>
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Connection successful')
      } else {
        toast.error('Connection failed — check your credentials')
      }
    },
    onError: () => toast.error('Connection test failed'),
  })

  return (
    <div className="space-y-4">
      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
      ) : !creds || creds.length === 0 ? (
        <p className="text-sm text-muted-foreground">No credentials configured yet.</p>
      ) : (
        <div className="border rounded-lg divide-y">
          {creds.map((cred) => (
            <div key={cred.id} className="flex items-center justify-between p-4 gap-4">
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{cred.label}</span>
                  <Badge variant="outline" className="text-xs capitalize">{cred.provider}</Badge>
                  {!cred.isActive && (
                    <Badge variant="outline" className="text-xs bg-gray-100 text-gray-500">Disabled</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-mono">{cred.maskedApiKey}</p>
                <p className="text-xs text-muted-foreground">{cred.baseUrl}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => testMutation.mutate(cred.id)}
                  disabled={testMutation.isPending}
                  title="Test connection"
                >
                  <Wifi className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleMutation.mutate({ id: cred.id, isActive: !cred.isActive })}
                  title={cred.isActive ? 'Disable' : 'Enable'}
                >
                  {cred.isActive
                    ? <ToggleRight className="h-4 w-4 text-green-600" />
                    : <ToggleLeft className="h-4 w-4 text-gray-400" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(cred.id)}
                  disabled={deleteMutation.isPending}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Separator />

      {showForm ? (
        <ApiKeyForm onSuccess={() => { setShowForm(false); queryClient.invalidateQueries({ queryKey: CREDENTIALS_QUERY_KEY }) }} onCancel={() => setShowForm(false)} />
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Credential
        </Button>
      )}
    </div>
  )
}
