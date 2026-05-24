'use client'

import { useState, useTransition } from 'react'
import { UserPlus, Copy, Check, Mail, Gift, CheckCircle2, Clock, FlaskConical, Building2 } from 'lucide-react'
import { sendInviteEmails } from '@/lib/actions/invite'
import { cn } from '@/lib/utils'

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

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

export function InviteView({ code, rewardPoints, referrals }: Props) {
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
      setFeedback({ type: 'err', text: '초대할 대상의 역할을 먼저 선택해주세요.' })
      return
    }
    const emails = emailsText
      .split(/[\s,;]+/)
      .map(e => e.trim())
      .filter(Boolean)
    if (emails.length === 0) {
      setFeedback({ type: 'err', text: '초대할 이메일을 입력해주세요.' })
      return
    }
    startTransition(async () => {
      const res = await sendInviteEmails(emails, inviteeRole)
      if (res.error) {
        setFeedback({ type: 'err', text: res.error })
        return
      }
      setFeedback({ type: 'ok', text: `${res.sent}명에게 초대 메일을 발송했습니다.` })
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
    role === 'researcher' ? '연구자' : role === 'supplier' ? '공급자' : '-'

  return (
    <div className="max-w-2xl space-y-6 pb-10">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <UserPlus className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">친구 초대</h1>
          <p className="text-sm text-muted-foreground">동료를 초대하고 크레딧을 적립하세요</p>
        </div>
      </div>

      {/* 리워드 안내 */}
      <div className="flex items-start gap-3 rounded-xl border border-accent/40 bg-accent/5 p-4">
        <Gift className="h-5 w-5 shrink-0 text-accent-foreground mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-foreground">
            초대한 분이 가입을 완료하면 <span className="text-accent-foreground">+{rewardPoints}P</span> 적립
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            초대 인원 제한 없이 가입할 때마다 적립됩니다. 지금까지 {joinedCount}명 가입 완료.
          </p>
        </div>
      </div>

      {/* ① 역할 선택 — 필수 */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">
          초대 대상 역할 선택 <span className="text-destructive">*</span>
        </h2>
        <p className="text-xs text-muted-foreground">
          초대받는 분이 어떤 역할로 가입할지 선택하세요. 역할에 맞는 가입 링크가 자동 생성됩니다.
        </p>
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
                연구자
              </p>
              <p className="text-xs text-muted-foreground">시약·소모품·장비 구매자</p>
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
                공급자
              </p>
              <p className="text-xs text-muted-foreground">시약·소모품·장비 판매자</p>
            </div>
          </button>
        </div>
      </section>

      {/* ② 초대 링크 — 역할 선택 후 활성 */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">내 초대 링크</h2>
        <div className="flex gap-2">
          <input
            readOnly
            value={inviteLink ?? '역할을 먼저 선택해주세요'}
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
            {copied ? '복사됨' : '복사'}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          초대 코드: <span className="font-mono font-semibold text-foreground">{code}</span>
        </p>
      </section>

      {/* ③ 이메일 초대 */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">이메일로 초대하기</h2>
        <textarea
          value={emailsText}
          onChange={e => setEmailsText(e.target.value)}
          rows={3}
          placeholder="이메일 주소를 쉼표 또는 줄바꿈으로 구분해 입력 (최대 10명)"
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
          {pending ? '발송 중…' : inviteeRole ? `${roleLabel(inviteeRole)}으로 초대 메일 발송` : '초대 메일 발송'}
        </button>
      </section>

      {/* ④ 초대 현황 */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">초대 현황 ({localReferrals.length}건)</h2>
        {localReferrals.length === 0 ? (
          <p className="rounded-lg border border-border bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
            아직 초대 내역이 없습니다. 위에서 동료를 초대해보세요.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">초대 대상</th>
                  <th className="px-4 py-2 text-center font-medium text-muted-foreground">역할</th>
                  <th className="px-4 py-2 text-center font-medium text-muted-foreground">상태</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">일시</th>
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
                          <CheckCircle2 className="h-3 w-3" /> 가입완료
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          <Clock className="h-3 w-3" /> 대기중
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                      {formatDate(r.joined_at ?? r.created_at)}
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
