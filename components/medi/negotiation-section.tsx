'use client'

import { useState, useTransition } from 'react'
import { Handshake, ExternalLink, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createNegotiation } from '@/lib/actions/medi-negotiate'

interface Props {
  requestId: string
  bidId: string
  canNegotiate: boolean   // 12시간 이내 여부
  negotiation: {
    status: string
    competitor_url: string | null
    competitor_price: number | null
    message: string | null
  } | null
}

export function NegotiationSection({ requestId, bidId, canNegotiate, negotiation }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const STATUS_INFO: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
    pending:  { label: '답변 대기 중', icon: <Clock className="h-4 w-4" />,       cls: 'text-amber-600' },
    accepted: { label: '흥정 수락됨',  icon: <CheckCircle2 className="h-4 w-4" />, cls: 'text-emerald-600' },
    rejected: { label: '흥정 거절됨',  icon: <XCircle className="h-4 w-4" />,      cls: 'text-red-500' },
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set('bidId', bidId)
    fd.set('requestId', requestId)
    startTransition(async () => {
      const result = await createNegotiation(fd)
      if (result?.error) setError(result.error)
      else setSuccess(true)
    })
  }

  if (negotiation) {
    const info = STATUS_INFO[negotiation.status] ?? STATUS_INFO.pending
    return (
      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Handshake className="h-5 w-5 text-amber-500" />
          <h3 className="font-semibold text-sm">흥정 제안 현황</h3>
        </div>
        <div className={`flex items-center gap-2 font-semibold text-sm ${info.cls}`}>
          {info.icon} {info.label}
        </div>
        {negotiation.competitor_price && (
          <p className="mt-1 text-xs text-muted-foreground">
            제시 가격: {negotiation.competitor_price.toLocaleString('ko-KR')}원
          </p>
        )}
        {negotiation.competitor_url && (
          <a
            href={negotiation.competitor_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" /> 경쟁사 링크
          </a>
        )}
        {negotiation.status === 'accepted' && (
          <p className="mt-2 text-xs text-emerald-700 font-medium">
            ✅ 공급사가 가격 조정에 동의했습니다. 직접 연락하여 최종 금액을 확인하세요.
          </p>
        )}
      </div>
    )
  }

  if (success) {
    return (
      <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
        <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-500 mb-2" />
        <p className="text-sm font-semibold text-emerald-700">흥정 제안을 보냈습니다!</p>
        <p className="text-xs text-muted-foreground mt-1">공급사가 24시간 내에 수락/거절 여부를 알려드립니다.</p>
      </div>
    )
  }

  return (
    <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Handshake className="h-5 w-5 text-amber-500" />
          <h3 className="font-semibold text-sm">흥정 옵션</h3>
        </div>
        {canNegotiate && !open && (
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}
            className="border-amber-400 text-amber-700 hover:bg-amber-100">
            흥정 제안하기
          </Button>
        )}
      </div>

      {!canNegotiate && (
        <p className="text-xs text-muted-foreground">
          흥정 가능 시간(수락 후 12시간)이 만료되었습니다.
        </p>
      )}

      {canNegotiate && !open && (
        <p className="text-xs text-muted-foreground">
          다른 곳의 더 낮은 가격 정보를 제시하여 추가 할인을 요청할 수 있습니다.
        </p>
      )}

      {open && (
        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="competitorUrl" className="text-xs">경쟁사 제품 링크 (근거)</Label>
            <Input
              id="competitorUrl"
              name="competitorUrl"
              type="url"
              placeholder="https://..."
              className="text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="competitorPrice" className="text-xs">경쟁사 가격 (원, 선택)</Label>
            <Input
              id="competitorPrice"
              name="competitorPrice"
              type="number"
              min={0}
              placeholder="예: 32000"
              className="text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="message" className="text-xs">메시지 (선택)</Label>
            <textarea
              id="message"
              name="message"
              rows={2}
              placeholder="추가 요청사항이 있으면 입력해주세요."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending}
              className="bg-amber-500 hover:bg-amber-600 text-white">
              {isPending ? '전송 중...' : '흥정 제안 보내기'}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
              취소
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
