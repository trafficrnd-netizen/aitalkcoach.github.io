import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  return cookieStore.get('admin_session')?.value === 'authenticated'
}

interface LedgerRow {
  user_id: string
  rule_key: string | null
  delta: number
  created_at: string
}

interface RuleRow {
  key: string
  label: string
  role: string
}

interface ResearcherRow { user_id: string; name: string | null; credits: number | null }
interface SupplierRow  { user_id: string; company_name: string | null; credits: number | null }

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 최근 30일 적립 이벤트
  const monthAgo = new Date(Date.now() - 30 * 86400 * 1000).toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ledgerRaw } = await (supabaseAdmin as any)
    .from('credit_ledger')
    .select('user_id, rule_key, delta, created_at')
    .gte('created_at', monthAgo)
    .order('created_at', { ascending: false })
    .limit(2000)
  const ledger: LedgerRow[] = ledgerRaw ?? []

  // 적립행위별 발생 횟수
  const ruleStats: Record<string, { count: number; totalPoints: number }> = {}
  for (const row of ledger) {
    if (!row.rule_key || row.delta <= 0) continue
    if (!ruleStats[row.rule_key]) ruleStats[row.rule_key] = { count: 0, totalPoints: 0 }
    ruleStats[row.rule_key].count++
    ruleStats[row.rule_key].totalPoints += row.delta
  }

  // 규칙 라벨 매핑
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rulesRaw } = await (supabaseAdmin as any)
    .from('credit_rules')
    .select('key, label, role')
  const ruleMap = new Map<string, RuleRow>()
  for (const r of (rulesRaw ?? []) as RuleRow[]) ruleMap.set(r.key, r)

  const byRule = Object.entries(ruleStats)
    .map(([key, s]) => ({
      key,
      label: ruleMap.get(key)?.label ?? key,
      role: ruleMap.get(key)?.role ?? '-',
      count: s.count,
      totalPoints: s.totalPoints,
    }))
    .sort((a, b) => b.count - a.count)

  // 사용자별 TOP 20 (연구자·공급자 통합)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: topResearchersRaw } = await (supabaseAdmin as any)
    .from('researcher_profiles')
    .select('user_id, name, credits')
    .order('credits', { ascending: false })
    .limit(20)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: topSuppliersRaw } = await (supabaseAdmin as any)
    .from('supplier_profiles')
    .select('user_id, company_name, credits')
    .order('credits', { ascending: false })
    .limit(20)

  const topResearchers = (topResearchersRaw ?? []) as ResearcherRow[]
  const topSuppliers = (topSuppliersRaw ?? []) as SupplierRow[]

  return NextResponse.json({
    period: '최근 30일',
    totalEvents: ledger.length,
    byRule,
    topResearchers: topResearchers.map(r => ({
      user_id: r.user_id,
      display: r.name ?? r.user_id.slice(0, 8),
      credits: r.credits ?? 0,
    })),
    topSuppliers: topSuppliers.map(s => ({
      user_id: s.user_id,
      display: s.company_name ?? s.user_id.slice(0, 8),
      credits: s.credits ?? 0,
    })),
  })
}
