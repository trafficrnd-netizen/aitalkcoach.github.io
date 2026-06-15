import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Handshake, Clock, CheckCircle2, XCircle, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { RespondNegotiationButtons } from '@/components/medi/respond-negotiation-buttons'

const STATUS_INFO: Record<string, { label: string; cls: string }> = {
  pending:  { label: '답변 대기',  cls: 'bg-amber-100 text-amber-700 border-0' },
  accepted: { label: '수락',       cls: 'bg-emerald-100 text-emerald-700 border-0' },
  rejected: { label: '거절',       cls: 'bg-red-100 text-red-700 border-0' },
}

export default async function NegotiationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: negs } = await (supabase as any)
    .from('negotiations')
    .select(`
      id, status, competitor_url, competitor_price, message, expires_at, created_at,
      requests!inner(title),
      bids!inner(id)
    `)
    .eq('supplier_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  const list = negs ?? []

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Handshake className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">흥정 관리</h1>
          <p className="text-sm text-muted-foreground">의원의 흥정 제안을 수락하거나 거절하세요.</p>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <Handshake className="mx-auto mb-3 h-8 w-8 opacity-30" />
          <p>아직 흥정 제안이 없습니다.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((neg: {
            id: string
            status: string
            competitor_url: string | null
            competitor_price: number | null
            message: string | null
            expires_at: string
            created_at: string
            requests: { title: string }
            bids: { id: string }
          }) => {
            const info = STATUS_INFO[neg.status] ?? STATUS_INFO.pending
            const isPending = neg.status === 'pending'
            const expired = new Date() > new Date(neg.expires_at)
            const createdStr = new Date(neg.created_at).toLocaleDateString('ko-KR')

            return (
              <li key={neg.id} className="rounded-xl border border-border bg-card px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={info.cls}>{info.label}</Badge>
                      {isPending && expired && (
                        <Badge variant="secondary" className="text-[10px]">기한 만료</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">{createdStr}</span>
                    </div>

                    <p className="font-semibold text-sm truncate">{neg.requests?.title}</p>

                    {neg.competitor_price && (
                      <p className="text-sm text-amber-700 font-medium">
                        제시 가격: {neg.competitor_price.toLocaleString('ko-KR')}원
                      </p>
                    )}
                    {neg.competitor_url && (
                      <a
                        href={neg.competitor_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" /> 경쟁사 링크 확인
                      </a>
                    )}
                    {neg.message && (
                      <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
                        {neg.message}
                      </p>
                    )}
                  </div>

                  {isPending && !expired && (
                    <div className="shrink-0">
                      <RespondNegotiationButtons negotiationId={neg.id} />
                    </div>
                  )}

                  {neg.status === 'accepted' && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-1" />
                  )}
                  {neg.status === 'rejected' && (
                    <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-1" />
                  )}
                </div>

                {isPending && !expired && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
                    <Clock className="h-3 w-3" />
                    응답 기한: {new Date(neg.expires_at).toLocaleString('ko-KR')}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
