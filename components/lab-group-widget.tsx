'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { claimLabGroup, type LabGroupStatus } from '@/lib/actions/lab-group'
import { FlaskConical, Users, Copy, Check } from 'lucide-react'

export function LabGroupWidget({ status: initial }: { status: LabGroupStatus }) {
  const [status, setStatus] = useState(initial)
  const [name, setName] = useState('')
  const [pending, startTransition] = useTransition()
  const [err, setErr] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const pct = Math.min(100, Math.round((status.peerCount / status.threshold) * 100))
  const eligible = status.peerCount >= status.threshold

  async function claim() {
    setErr(null)
    startTransition(async () => {
      const r = await claimLabGroup(name)
      if (!r.ok) {
        setErr(r.reason === 'threshold_not_met'
          ? `같은 기관·학과 인증 연구자 ${r.count ?? 0}명 / ${status.threshold}명 필요`
          : r.reason === 'no_institution' ? '소속 기관 정보가 비어 있습니다.' : `실패: ${r.reason}`)
        return
      }
      setStatus({ ...status, joined: true, isLeader: true, group: { id: r.labId, name: name || (status.institution ?? '연구실'), code: r.code, memberCount: r.count } })
    })
  }

  async function copy() {
    if (!status.group?.code) return
    try {
      await navigator.clipboard.writeText(`https://ai-traffic.kr/lab/${status.group.code}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* 무시 */ }
  }

  return (
    <div className="rounded-xl border-2 border-secondary/40 bg-gradient-to-br from-secondary/5 to-primary/5 p-5">
      <div className="flex items-center gap-2 mb-1">
        <FlaskConical className="h-4 w-4 text-secondary" />
        <h3 className="font-bold text-foreground">랩 그룹</h3>
        {status.group && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-secondary/20 text-secondary">
            {status.isLeader ? '리더' : '멤버'}
          </span>
        )}
      </div>

      {status.institution ? (
        <p className="text-xs text-muted-foreground mb-3">
          소속: <strong className="text-foreground">{status.institution}</strong>
          {status.department ? <> · {status.department}</> : null}
        </p>
      ) : (
        <p className="text-xs text-amber-600 mb-3">설정에서 소속 기관·학과를 입력하면 랩 그룹을 만들 수 있습니다.</p>
      )}

      {status.group ? (
        <div className="space-y-2">
          <div className="rounded-lg border border-border bg-background p-3">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-[11px] text-muted-foreground">{status.group.name}</span>
              <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                <Users className="h-3 w-3" /> {status.group.memberCount}명
              </span>
            </div>
            {status.group.code && (
              <div className="font-mono text-2xl font-extrabold tracking-widest text-primary text-center py-1">
                {status.group.code}
              </div>
            )}
          </div>
          {status.group.code && (
            <Button size="sm" variant="outline" onClick={copy} className="w-full">
              {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
              {copied ? '복사됨' : '랩 가입 링크 복사'}
            </Button>
          )}
          <p className="text-[11px] text-muted-foreground leading-snug">
            같은 기관·학과 동료들이 이 코드로 가입하면 자동으로 랩에 합류합니다.
            랩 단위 견적·통계 기능은 단계적으로 확장됩니다.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-3">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-xs text-muted-foreground">같은 기관·학과 인증 연구자</span>
              <span className="text-sm font-bold text-foreground">{status.peerCount} / {status.threshold}명</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
              <div className="h-full bg-secondary rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {eligible && status.institution ? (
            <div className="space-y-2">
              <Input
                placeholder={`랩 이름 (예: ${status.institution} ${status.department ?? ''} ○○연구실)`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
              />
              <Button onClick={claim} disabled={pending} className="w-full">
                {pending ? '생성 중…' : '🧪 랩 그룹 생성하기'}
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {Math.max(0, status.threshold - status.peerCount)}명 더 모이면 랩 그룹을 만들 수 있습니다.
            </p>
          )}

          {err && <p className="text-xs text-destructive mt-2">{err}</p>}
        </>
      )}
    </div>
  )
}
