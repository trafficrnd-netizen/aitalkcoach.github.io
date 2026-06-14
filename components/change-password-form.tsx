'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock } from 'lucide-react'
import { changePassword } from '@/lib/actions/auth'
import { useT } from '@/lib/i18n/context'

export function ChangePasswordForm() {
  const t = useT()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    if (next !== confirm) {
      setMsg({ ok: false, text: t('pwd.errMismatch') })
      return
    }
    if (next.length < 8) {
      setMsg({ ok: false, text: t('pwd.errShort') })
      return
    }
    startTransition(async () => {
      const res = await changePassword(current, next)
      if (res.ok) {
        setMsg({ ok: true, text: t('pwd.success') })
        setCurrent(''); setNext(''); setConfirm('')
      } else {
        setMsg({ ok: false, text: res.error ?? t('pwd.errGeneric') })
      }
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Lock className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">{t('pwd.title')}</h2>
      </div>

      {msg && (
        <p className={`text-xs rounded-md px-3 py-2 border ${msg.ok ? 'bg-secondary/10 text-secondary border-secondary/30' : 'bg-destructive/10 text-destructive border-destructive/30'}`}>
          {msg.text}
        </p>
      )}

      <form onSubmit={submit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="cur-pwd">{t('pwd.current')}</Label>
          <Input
            id="cur-pwd"
            type="password"
            value={current}
            onChange={e => setCurrent(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new-pwd">{t('pwd.new')}</Label>
          <Input
            id="new-pwd"
            type="password"
            value={next}
            onChange={e => setNext(e.target.value)}
            autoComplete="new-password"
            placeholder={t('pwd.newPh')}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm-pwd">{t('pwd.confirm')}</Label>
          <Input
            id="confirm-pwd"
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
        <Button type="submit" disabled={pending} size="sm">
          {pending ? t('pwd.changing') : t('pwd.submit')}
        </Button>
      </form>
    </div>
  )
}
