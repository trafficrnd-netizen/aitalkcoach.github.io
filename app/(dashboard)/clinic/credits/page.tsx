import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Coins, Gift } from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _RULE_ICONS: Record<string, React.ReactNode> = {}

const EARN_RULES = [
  { key: 'clinic_first_request', icon: '✏️', label: '첫 견적 요청 등록',  points: 30 },
  { key: 'clinic_bid_received',  icon: '📬', label: '입찰 3건 이상 수신',  points: 10 },
  { key: 'clinic_deal_done',     icon: '🤝', label: '거래 완료',           points: 20 },
  { key: 'clinic_invite_friend', icon: '👥', label: '친구 초대 성공',       points: 50 },
]

export default async function ClinicCreditsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // 크레딧 잔액
  const { data: profile } = await db
    .from('clinic_profiles')
    .select('credits')
    .eq('user_id', user.id)
    .maybeSingle()
  const balance = profile?.credits ?? 0

  // 크레딧 이력
  const { data: ledger } = await db
    .from('credit_ledger')
    .select('delta, balance_after, reason, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-2">
        <Coins className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">포인트</h1>
      </div>

      {/* 잔액 카드 */}
      <div className="rounded-2xl bg-gradient-to-br from-primary to-violet-700 p-6 text-white">
        <p className="text-sm opacity-80 mb-1">현재 포인트</p>
        <p className="text-4xl font-black">{balance.toLocaleString('ko-KR')}</p>
        <p className="text-sm opacity-70 mt-1">포인트</p>
        <p className="mt-4 text-xs opacity-60">포인트는 향후 프리미엄 기능 이용에 활용될 예정입니다.</p>
      </div>

      {/* 적립 방법 */}
      <div className="rounded-xl border border-border p-4">
        <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
          <Gift className="h-4 w-4 text-primary" /> 포인트 적립 방법
        </h2>
        <ul className="space-y-2">
          {EARN_RULES.map(r => (
            <li key={r.key} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span>{r.icon}</span>
                <span className="text-muted-foreground">{r.label}</span>
              </span>
              <span className="font-bold text-primary">+{r.points}P</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 적립 이력 */}
      <div>
        <h2 className="font-bold text-sm mb-3">포인트 이력</h2>
        {(!ledger || ledger.length === 0) ? (
          <div className="py-10 text-center text-muted-foreground text-sm rounded-xl border border-border">
            아직 포인트 이력이 없습니다.
          </div>
        ) : (
          <ul className="space-y-2">
            {ledger.map((entry: {
              delta: number
              balance_after: number
              reason: string | null
              created_at: string
            }, i: number) => (
              <li key={i} className="flex items-center justify-between text-sm rounded-lg border border-border px-3 py-2.5">
                <div>
                  <p className="font-medium">{entry.reason ?? '포인트 적립'}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.created_at).toLocaleDateString('ko-KR')} · 잔액 {entry.balance_after.toLocaleString()}P
                  </p>
                </div>
                <span className={`font-bold ${entry.delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {entry.delta >= 0 ? '+' : ''}{entry.delta}P
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
