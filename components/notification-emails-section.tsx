'use client'

import { useState, useTransition } from 'react'
import { Mail, Plus, Trash2, CheckCircle2, AlertCircle, Send } from 'lucide-react'
import {
  addNotificationEmail,
  removeNotificationEmail,
  resendVerificationEmail,
} from '@/lib/actions/researcher'

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
  const [entries, setEntries] = useState<NotificationEmailEntry[]>(initial ?? [])
  const [newEmail, setNewEmail] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    notice === 'verified'
      ? { type: 'ok', text: '이메일 인증이 완료되었습니다.' }
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
          label: newLabel.trim() || '추가 이메일',
          verified: false,
          created_at: new Date().toISOString(),
        },
      ])
      setNewEmail('')
      setNewLabel('')
      setShowAdd(false)
      setFeedback({ type: 'ok', text: `${newEmail} 로 인증 메일을 발송했습니다. 메일함을 확인해주세요.` })
    })
  }

  function handleRemove(email: string) {
    if (!confirm(`${email} 을(를) 삭제하시겠습니까?`)) return
    startTransition(async () => {
      const res = await removeNotificationEmail(email)
      if (res.error) {
        setFeedback({ type: 'err', text: res.error })
        return
      }
      setEntries(prev => prev.filter(e => e.email !== email))
      setFeedback({ type: 'ok', text: '삭제되었습니다.' })
    })
  }

  function handleResend(email: string) {
    startTransition(async () => {
      const res = await resendVerificationEmail(email)
      if (res.error) {
        setFeedback({ type: 'err', text: res.error })
        return
      }
      setFeedback({ type: 'ok', text: '인증 메일을 재발송했습니다.' })
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">견적 알림 수신 이메일</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        가입 이메일 외에 추가 이메일을 등록하면, 모든 견적 알림이 함께 발송됩니다. 최대 5개까지 등록 가능합니다.
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
            <p className="text-xs text-muted-foreground">가입 이메일 · 자동 수신</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 px-2 py-0.5 text-xs font-medium text-secondary">
            <CheckCircle2 className="h-3 w-3" /> 인증완료
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
                  <CheckCircle2 className="h-3 w-3" /> 인증완료
                </span>
              ) : (
                <>
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent-foreground">
                    <AlertCircle className="h-3 w-3" /> 미인증
                  </span>
                  <button
                    onClick={() => handleResend(e.email)}
                    disabled={pending}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
                    title="인증 메일 재발송"
                  >
                    <Send className="h-3 w-3" /> 재발송
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
            placeholder="이메일 주소 (예: my-personal@gmail.com)"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            disabled={pending}
          />
          <input
            type="text"
            placeholder="라벨 (선택, 예: 개인 메일)"
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
              {pending ? '발송 중…' : '인증 메일 발송'}
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
            이메일 추가 ({entries.length}/5)
          </button>
        )
      )}
    </div>
  )
}
