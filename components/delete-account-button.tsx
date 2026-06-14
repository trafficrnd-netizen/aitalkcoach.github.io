'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteAccount } from '@/lib/actions/auth'
import { useT } from '@/lib/i18n/context'

export function DeleteAccountButton({ email }: { email: string }) {
  const t = useT()
  const router = useRouter()
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    if (confirm !== email) return
    setLoading(true)
    setError(null)
    const result = await deleteAccount()
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {t('del.hint')} <span className="font-mono font-medium text-foreground">{email}</span>
      </p>
      <input
        type="email"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder={email}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-destructive/30"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <button
        onClick={handleDelete}
        disabled={confirm !== email || loading}
        className="inline-flex items-center justify-center rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? t('del.deleting') : t('del.btn')}
      </button>
    </div>
  )
}
