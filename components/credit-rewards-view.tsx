import { Coins, Gift, TrendingUp, History, Sparkles, Gauge } from 'lucide-react'

export interface CreditRule {
  key: string
  role: string
  label: string
  description: string | null
  points: number
  frequency_type: string
  frequency_limit: number | null
}

export interface LedgerEntry {
  id: number
  rule_key: string | null
  delta: number
  balance_after: number
  reason: string | null
  created_at: string
}

export interface QuotaInfo {
  freeQuota: number
  used: number
  remaining: number
  isEarlyBird: boolean
  actionLabel: string
}

interface Props {
  role: 'researcher' | 'supplier'
  credits: number
  rules: CreditRule[]
  ledger: LedgerEntry[]
  quota: QuotaInfo
}

const FREQ_LABELS: Record<string, string> = {
  per_event: '행동할 때마다',
  daily: '하루 1회',
  weekly: '주 1회',
  monthly: '월 1회',
  once: '계정당 1회',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function CreditRewardsView({ credits, rules, ledger, quota }: Props) {
  return (
    <div className="max-w-3xl space-y-6 pb-16">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Coins className="h-6 w-6 text-accent-foreground" />
        <div>
          <h1 className="text-2xl font-bold">크레딧 · 리워드</h1>
          <p className="text-sm text-muted-foreground">크레딧을 적립하고 무료 한도를 늘려보세요</p>
        </div>
      </div>

      {/* 잔액 + 무료 한도 — 2단 카드 */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* 잔액 */}
        <div className="rounded-xl border border-accent/40 bg-accent/5 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">보유 크레딧</p>
              <p className="mt-1 text-3xl font-bold text-foreground">
                {credits.toLocaleString()} <span className="text-lg">P</span>
              </p>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
              <Coins className="h-6 w-6 text-accent-foreground" />
            </span>
          </div>
        </div>

        {/* 무료 한도 */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Gauge className="h-3.5 w-3.5" />
                이번 주 무료 {quota.actionLabel}
              </p>
              <p className="mt-1 text-3xl font-bold text-foreground">
                {quota.remaining}
                <span className="text-lg text-muted-foreground"> / {quota.freeQuota}회</span>
              </p>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {quota.isEarlyBird && (
              <span className="mr-1 rounded bg-accent/20 px-1.5 py-0.5 font-medium text-accent-foreground">
                얼리버드
              </span>
            )}
            한도 초과 시 1회당 크레딧 1P가 사용됩니다.
          </p>
        </div>
      </div>

      {/* 무료 한도 사용 안내 바 */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>이번 주 {quota.actionLabel} 사용량</span>
          <span>
            {quota.used}회 사용 · {quota.remaining}회 남음
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full ${
              quota.remaining === 0 ? 'bg-destructive' : 'bg-primary'
            }`}
            style={{
              width: `${quota.freeQuota > 0 ? Math.min(100, (quota.used / quota.freeQuota) * 100) : 0}%`,
            }}
          />
        </div>
      </div>

      {/* 적립 방법 */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Gift className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">크레딧 적립 방법</h2>
        </div>
        {rules.length === 0 ? (
          <p className="rounded-lg border border-border bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
            현재 활성화된 적립행위가 없습니다.
          </p>
        ) : (
          <div className="space-y-2">
            {rules.map(rule => (
              <div
                key={rule.key}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{rule.label}</p>
                  {rule.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{rule.description}</p>
                  )}
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {FREQ_LABELS[rule.frequency_type] ?? rule.frequency_type}
                    {rule.frequency_limit ? ` · 최대 ${rule.frequency_limit}회` : ''}
                  </p>
                </div>
                <span className="ml-3 shrink-0 rounded-full bg-accent/15 px-3 py-1 text-sm font-bold text-accent-foreground">
                  +{rule.points}P
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 적립 내역 */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">최근 적립·사용 내역</h2>
        </div>
        {ledger.length === 0 ? (
          <p className="rounded-lg border border-border bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
            아직 적립·사용 내역이 없습니다. 위 행동으로 크레딧을 모아보세요.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">내용</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">변동</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">잔액</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">일시</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ledger.map(e => (
                  <tr key={e.id}>
                    <td className="px-4 py-2.5 text-foreground">{e.reason ?? e.rule_key ?? '-'}</td>
                    <td
                      className={`px-4 py-2.5 text-right font-semibold ${
                        e.delta > 0
                          ? 'text-secondary'
                          : e.delta < 0
                          ? 'text-destructive'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {e.delta > 0 ? '+' : ''}
                      {e.delta}P
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">{e.balance_after}P</td>
                    <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                      {formatDate(e.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 안내 */}
      <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 shrink-0 text-primary" />
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-accent-foreground" />
        </div>
        <p>
          적립행위와 포인트, 무료 한도는 플랫폼 운영 상황에 따라 조정될 수 있습니다. 새로운 적립
          기회가 열리면 이 페이지에 표시됩니다.
        </p>
      </div>
    </div>
  )
}
