'use client'

import { useState, useTransition } from 'react'
import { Mail, Plus, Trash2, CheckCircle2, AlertCircle, Send } from 'lucide-react'
import {
  addNotificationEmail,
  removeNotificationEmail,
  resendVerificationEmail,
} from '@/lib/actions/researcher'
import { useT } from '@/lib/i18n/context'

interface NotificationEmailEntry {
  email: string
  label: string
  verified: boolean
  created_at: string
}

interface Props {
  primaryEmail: string
  initial: NotificationEmailEntry[]
  notice?: 'verified' | 'error' | null
  noticeMessage?: string
}

export function NotificationEmailsSection({ primaryEmail, initial, notice, noticeMessage }: Props) {
  const t = useT()
  const [entries, setEntries] = useState<NotificationEmailEntry[]>(initial ?? [])
  const [newEmail, setNewEmail] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    notice === 'verified'
      ? { type: 'ok', text: t('notif.verifiedMsg') }
      : notice === 'error' && noticeMessage
      ? { type: 'err', text: decodeURIComponent(noticeMessage) }
      : null
  )
  const [pending, startTransition] = useTransition()

  function handleAdd() {
    if (!newEmail.trim()) return
    startTransition(async () => {
      const res = await addNotificationEmail(newEmail, newLabel)
      if (res.error) {
        setFeedback({ type: 'err', text: res.error })
        return
      }
      setEntries(prev => [
        ...prev,
        {
          email: newEmail.trim().toLowerCase(),
          label: newLabel.trim() || t('notif.addPh'),
          verified: false,
          created_at: new Date().toISOString(),
        },
      ])
      setNewEmail('')
      setNewLabel('')
      setShowAdd(false)
      setFeedback({ type: 'ok', text: t('notif.sentMsg').replace('{email}', newEmail) })
    })
  }

  function handleRemove(email: string) {
    if (!confirm(t('notif.confirmRemove').replace('{email}', email))) return
    startTransition(async () => {
      const res = await removeNotificationEmail(email)
      if (res.error) {
        setFeedback({ type: 'err', text: res.error })
        return
      }
      setEntries(prev => prev.filter(e => e.email !== email))
      setFeedback({ type: 'ok', text: t('notif.removedMsg') })
    })
  }

  function handleResend(email: string) {
    startTransition(async () => {
      const res = await resendVerificationEmail(email)
      if (res.error) {
        setFeedback({ type: 'err', text: res.error })
        return
      }
      setFeedback({ type: 'ok', text: t('notif.resendMsg') })
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">{t('notif.title')}</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        {t('notif.sub')}
      </p>

      {feedback && (
        <div
          className={`flex items-start gap-2 rounded-md px-3 py-2 text-xs ${
            feedback.type === 'ok'
              ? 'bg-secondary/10 text-secondary border border-secondary/30'
              : 'bg-destructive/10 text-destructive border border-destructive/30'
          }`}
        >
          {feedback.type === 'ok' ? (
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="space-y-2">
        {/* 가입 이메일 (수정 불가) */}
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{primaryEmail}</p>
            <p className="text-xs text-muted-foreground">{t('notif.primaryLabel')}</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 px-2 py-0.5 text-xs font-medium text-secondary">
            <CheckCircle2 className="h-3 w-3" /> {t('notif.verified')}
          </span>
        </div>

        {/* 추가 이메일 목록 */}
        {entries.map(e => (
          <div
            key={e.email}
            className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{e.email}</p>
              <p className="text-xs text-muted-foreground">{e.label}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {e.verified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 px-2 py-0.5 text-xs font-medium text-secondary">
                  <CheckCircle2 className="h-3 w-3" /> {t('notif.verified')}
                </span>
              ) : (
                <>
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent-foreground">
                    <AlertCircle className="h-3 w-3" /> {t('notif.unverified')}
                  </span>
                  <button
                    onClick={() => handleResend(e.email)}
                    disabled={pending}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
                    title="인증 메일 재발송"
                  >
                    <Send className="h-3 w-3" /> {t('notif.resend')}
                  </button>
                </>
              )}
              <button
                onClick={() => handleRemove(e.email)}
                disabled={pending}
                className="text-muted-foreground hover:text-destructive disabled:opacity-50"
                title="삭제"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 추가 폼 */}
      {showAdd ? (
        <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-3 space-y-2">
          <input
            type="email"
            placeholder={t('notif.addPh')}
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            disabled={pending}
          />
          <input
            type="text"
            placeholder={t('notif.labelPh')}
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            maxLength={30}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            disabled={pending}
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={pending || !newEmail.trim()}
              className="flex-1 rounded-md bg-accent text-accent-foreground py-2 text-sm font-medium hover:bg-accent/90 disabled:opacity-50"
            >
              {pending ? t('notif.sending') : t('notif.sendVerify')}
            </button>
            <button
              onClick={() => {
                setShowAdd(false)
                setNewEmail('')
                setNewLabel('')
              }}
              disabled={pending}
              className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted disabled:opacity-50"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        entries.length < 5 && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex w-full items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-background py-2.5 text-sm text-muted-foreground hover:border-primary hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            {t('notif.addBtn').replace('{n}', String(entries.length))}
          </button>
        )
      )}
    </div>
  )
}
