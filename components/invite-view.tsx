'use client'

import { useState, useTransition } from 'react'
import { UserPlus, Copy, Check, Mail, Gift, CheckCircle2, Clock, FlaskConical, Building2, Star } from 'lucide-react'
import { sendInviteEmails } from '@/lib/actions/invite'
import { cn } from '@/lib/utils'
import { useT, useI18n } from '@/lib/i18n/context'

export interface ReferralRow {
  id: number
  invitee_email: string | null
  invitee_role: string | null
  status: 'sent' | 'joined'
  created_at: string
  joined_at: string | null
}

interface Props {
  code: string
  rewardPoints: number
  referrals: ReferralRow[]
}

type InviteeRole = 'researcher' | 'supplier'

function formatDate(d: string, lang: string) {
  return new Date(d).toLocaleDateString(lang === 'en' ? 'en-US' : 'ko-KR', { month: 'short', day: 'numeric' })
}

export function InviteView({ code, rewardPoints, referrals }: Props) {
  const t = useT()
  const { lang } = useI18n()
  const [copied, setCopied] = useState(false)
  const [inviteeRole, setInviteeRole] = useState<InviteeRole | null>(null)
  const [emailsText, setEmailsText] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [pending, startTransition] = useTransition()
  const [localReferrals, setLocalReferrals] = useState<ReferralRow[]>(referrals)

  const joinedCount = localReferrals.filter(r => r.status === 'joined').length

  const inviteLink = inviteeRole
    ? `https://ai-traffic.kr/signup/${inviteeRole}?ref=${code}`
    : null

  function copyLink() {
    if (!inviteLink) return
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleSend() {
    if (!inviteeRole) {
      setFeedback({ type: 'err', text: t('inv.errSelectRole') })
      return
    }
    const emails = emailsText
      .split(/[\s,;]+/)
      .map(e => e.trim())
      .filter(Boolean)
    if (emails.length === 0) {
      setFeedback({ type: 'err', text: t('inv.errEnterEmail') })
      return
    }
    startTransition(async () => {
      const res = await sendInviteEmails(emails, inviteeRole)
      if (res.error) {
        setFeedback({ type: 'err', text: res.error })
        return
      }
      setFeedback({ type: 'ok', text: t('inv.sentSuccess').replace('{n}', String(res.sent)) })
      setEmailsText('')
      setLocalReferrals(prev => [
        ...emails.map((email, i) => ({
          id: -Date.now() - i,
          invitee_email: email.toLowerCase(),
          invitee_role: inviteeRole,
          status: 'sent' as const,
          created_at: new Date().toISOString(),
          joined_at: null,
        })),
        ...prev,
      ])
    })
  }

  const roleLabel = (role: string | null) =>
    role === 'researcher' ? t('inv.roleResearcher') : role === 'supplier' ? t('inv.roleSupplier') : '-'

  return (
    <div className="max-w-2xl space-y-6 pb-10">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <UserPlus className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">{t('inv.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('inv.sub')}</p>
        </div>
      </div>

      {/* 리워드 안내 */}
      <div className="flex items-start gap-3 rounded-xl border border-accent/40 bg-accent/5 p-4">
        <Gift className="h-5 w-5 shrink-0 text-accent-foreground mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-foreground">
            {t('inv.rewardDesc')} <span className="text-accent-foreground">{t('inv.rewardPts').replace('{n}', String(rewardPoints))}</span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t('inv.rewardNote').replace('{n}', String(joinedCount))}
          </p>
        </div>
      </div>

      {/* 단골 관계 안내 */}
      <div className="flex items-start gap-3 rounded-xl border border-secondary/40 bg-secondary/5 p-4">
        <Star className="h-5 w-5 shrink-0 text-secondary mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-foreground mb-0.5">{t('inv.preferredTitle')}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('inv.preferredDesc')}
          </p>
        </div>
      </div>

      {/* ① 역할 선택 */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">
          {t('inv.roleLabel')} <span className="text-destructive">*</span>
        </h2>
        <p className="text-xs text-muted-foreground">{t('inv.roleSub')}</p>
        <div className="grid grid-cols-2 gap-3 mt-1">
          <button
            onClick={() => { setInviteeRole('researcher'); setFeedback(null) }}
            className={cn(
              'flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all',
              inviteeRole === 'researcher'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/40 hover:bg-muted/50'
            )}
          >
            <span className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
              inviteeRole === 'researcher' ? 'bg-primary/15' : 'bg-muted'
            )}>
              <FlaskConical className={cn('h-5 w-5', inviteeRole === 'researcher' ? 'text-primary' : 'text-muted-foreground')} />
            </span>
            <div>
              <p className={cn('text-sm font-semibold', inviteeRole === 'researcher' ? 'text-primary' : 'text-foreground')}>
                {t('inv.roleResearcher')}
              </p>
              <p className="text-xs text-muted-foreground">{t('inv.roleResearcherSub')}</p>
            </div>
          </button>

          <button
            onClick={() => { setInviteeRole('supplier'); setFeedback(null) }}
            className={cn(
              'flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all',
              inviteeRole === 'supplier'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/40 hover:bg-muted/50'
            )}
          >
            <span className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
              inviteeRole === 'supplier' ? 'bg-primary/15' : 'bg-muted'
            )}>
              <Building2 className={cn('h-5 w-5', inviteeRole === 'supplier' ? 'text-primary' : 'text-muted-foreground')} />
            </span>
            <div>
              <p className={cn('text-sm font-semibold', inviteeRole === 'supplier' ? 'text-primary' : 'text-foreground')}>
                {t('inv.roleSupplier')}
              </p>
              <p className="text-xs text-muted-foreground">{t('inv.roleSupplierSub')}</p>
            </div>
          </button>
        </div>
      </section>

      {/* ② 초대 링크 */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">{t('inv.linkLabel')}</h2>
        <div className="flex gap-2">
          <input
            readOnly
            value={inviteLink ?? t('inv.linkPlaceholder')}
            className={cn(
              'flex-1 rounded-md border px-3 py-2 text-sm outline-none transition-colors',
              inviteLink
                ? 'border-input bg-muted/40 text-muted-foreground'
                : 'border-border bg-muted/20 text-muted-foreground/50 italic'
            )}
          />
          <button
            onClick={copyLink}
            disabled={!inviteLink}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? t('inv.copiedBtn') : t('inv.copyBtn')}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('inv.codeLabel')} <span className="font-mono font-semibold text-foreground">{code}</span>
        </p>
      </section>

      {/* ③ 이메일 초대 */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">{t('inv.emailTitle')}</h2>
        <textarea
          value={emailsText}
          onChange={e => setEmailsText(e.target.value)}
          rows={3}
          placeholder={t('inv.emailPh')}
          disabled={pending}
          className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        {feedback && (
          <p className={`text-xs ${feedback.type === 'ok' ? 'text-secondary' : 'text-destructive'}`}>
            {feedback.text}
          </p>
        )}
        <button
          onClick={handleSend}
          disabled={pending || !emailsText.trim()}
          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Mail className="h-4 w-4" />
          {pending ? t('inv.emailSendingBtn') : inviteeRole ? t('inv.emailSendRole').replace('{role}', roleLabel(inviteeRole)) : t('inv.emailSendBtn')}
        </button>
      </section>

      {/* ④ 초대 현황 */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">{t('inv.statusTitle')} ({localReferrals.length})</h2>
        {localReferrals.length === 0 ? (
          <p className="rounded-lg border border-border bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
            {t('inv.statusEmpty')}
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">{t('inv.colEmail')}</th>
                  <th className="px-4 py-2 text-center font-medium text-muted-foreground">{t('inv.colRole')}</th>
                  <th className="px-4 py-2 text-center font-medium text-muted-foreground">{t('inv.colStatus')}</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">{t('inv.colDate')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {localReferrals.map(r => (
                  <tr key={r.id}>
                    <td className="px-4 py-2.5 text-foreground">{r.invitee_email ?? '-'}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="text-xs text-muted-foreground">{roleLabel(r.invitee_role)}</span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {r.status === 'joined' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 px-2 py-0.5 text-xs font-medium text-secondary">
                          <CheckCircle2 className="h-3 w-3" /> {t('inv.statusJoined')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          <Clock className="h-3 w-3" /> {t('inv.statusPending')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                      {formatDate(r.joined_at ?? r.created_at, lang)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
