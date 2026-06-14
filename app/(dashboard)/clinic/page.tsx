import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import {
  Sparkles, PlusCircle, FileText, ClipboardList,
  CheckCircle2, Clock, Gift,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default async function ClinicDashboardPage() {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data: { user } } = await supabase.auth.getUser()

  let totalReqs = 0, openReqs = 0, totalBids = 0, acceptedBids = 0

  if (user) {
    const [
      { count: tot },
      { count: opn },
      { count: bids },
      { count: accepted },
    ] = await Promise.all([
      db.from('requests').select('*', { count: 'exact', head: true })
        .eq('researcher_id', user.id).eq('vertical', 'aesthetic'),
      db.from('requests').select('*', { count: 'exact', head: true })
        .eq('researcher_id', user.id).eq('vertical', 'aesthetic').eq('status', 'open'),
      db.from('bids').select('bids.id', { count: 'exact', head: true })
        .eq('requests.researcher_id', user.id)
        // join 없이 — bids에서 request_id 경유로 세기 (subquery 미지원 → 요청 ID 리스트로)
        .limit(0),
      db.from('bids').select('*', { count: 'exact', head: true })
        .eq('status', 'accepted')
        .limit(0),
    ])
    totalReqs    = tot ?? 0
    openReqs     = opn ?? 0

    // 내 요청들의 입찰 수 집계
    if (totalReqs > 0) {
      const { data: myReqIds } = await db
        .from('requests')
        .select('id')
        .eq('researcher_id', user.id)
        .eq('vertical', 'aesthetic')
      const ids: string[] = (myReqIds ?? []).map((r: { id: string }) => r.id)
      if (ids.length) {
        const { count: bc } = await db
          .from('bids')
          .select('*', { count: 'exact', head: true })
          .in('request_id', ids)
        const { count: ac } = await db
          .from('bids')
          .select('*', { count: 'exact', head: true })
          .in('request_id', ids)
          .eq('status', 'accepted')
        totalBids    = bc ?? 0
        acceptedBids = ac ?? 0
      }
    }
    void bids; void accepted
  }

  const stats = [
    { label: '전체 요청', value: totalReqs,    icon: FileText,      color: 'text-blue-500'    },
    { label: '진행 중',   value: openReqs,     icon: Clock,         color: 'text-amber-500'   },
    { label: '받은 입찰', value: totalBids,    icon: ClipboardList, color: 'text-primary'     },
    { label: '낙찰 완료', value: acceptedBids, icon: CheckCircle2,  color: 'text-emerald-500' },
  ]

  return (
    <div className="max-w-2xl space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">BidMedi 대시보드</h1>
        <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
          <Gift className="h-3 w-3" /> 전액 무료
        </span>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card px-3 py-4 text-center">
            <Icon className={cn('mx-auto mb-1.5 h-5 w-5', color)} />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/clinic/request"
          className={buttonVariants({ size: 'lg', className: 'h-auto flex-col py-4 gap-1' })}
        >
          <PlusCircle className="h-5 w-5" />
          <span className="font-semibold text-sm">새 견적 요청</span>
          <span className="text-[10px] opacity-80">카트리지·니들·화장품</span>
        </Link>
        <Link
          href="/clinic/requests"
          className={buttonVariants({ variant: 'outline', size: 'lg', className: 'h-auto flex-col py-4 gap-1' })}
        >
          <FileText className="h-5 w-5" />
          <span className="font-semibold text-sm">내 요청 목록</span>
          <span className="text-[10px] text-muted-foreground">총 {totalReqs}건</span>
        </Link>
      </div>

      <p className="text-xs text-muted-foreground">
        💡 요청을 등록하면 인증된 공급사들이 견적을 제출합니다. 수수료 없이 무료로 비교·선택하세요.
      </p>
    </div>
  )
}
