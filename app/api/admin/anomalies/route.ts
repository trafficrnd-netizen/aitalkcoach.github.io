import { NextRequest, NextResponse } from 'next/server'
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

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const threeDaysAgo  = new Date(now.getTime() - 3  * 86_400_000).toISOString()
  const sevenDaysAgo  = new Date(now.getTime() - 7  * 86_400_000).toISOString()
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 86_400_000).toISOString()

  // 기반 데이터 병렬 조회
  const [
    { data: authData },
    { data: allSuppliers },
    { data: allResearchers },
    { data: allBids },
    { data: allRequests },
  ] = await Promise.all([
    supabaseAdmin.auth.admin.listUsers(),
    supabaseAdmin
      .from('supplier_profiles')
      .select('user_id, company_name, verification_status'),
    supabaseAdmin
      .from('researcher_profiles')
      .select('user_id, name'),
    supabaseAdmin
      .from('bids')
      .select('supplier_id, status'),
    supabaseAdmin
      .from('requests')
      .select('id, researcher_id, status, deadline, created_at'),
  ])

  const allUsers = authData?.users ?? []
  const userMap = new Map(allUsers.map(u => [u.id, u]))
  const supplierMap = new Map((allSuppliers ?? []).map(s => [s.user_id, s]))
  const researcherMap = new Map((allResearchers ?? []).map(r => [r.user_id, r]))

  // 연구자 중 요청 한 번이라도 한 user_id 집합
  const requestedResearchers = new Set((allRequests ?? []).map(r => r.researcher_id))
  // 공급자 중 입찰 한 번이라도 한 user_id 집합
  const biddingSuppliers = new Set((allBids ?? []).map(b => b.supplier_id))

  const anomalies: {
    type: string
    severity: 'critical' | 'warning'
    userId: string
    label: string
    detail: string
    daysAgo: number
    createdAt: string
  }[] = []

  // ── 🔴 이메일 미인증 3일 초과 ──────────────────────────────────────
  for (const u of allUsers) {
    if (!u.email_confirmed_at && u.created_at < threeDaysAgo) {
      const days = daysSince(u.created_at)
      anomalies.push({
        type: 'email_unconfirmed',
        severity: 'critical',
        userId: u.id,
        label: u.email ?? u.id,
        detail: `가입 ${days}일 경과, 이메일 미인증 (로그인 불가)`,
        daysAgo: days,
        createdAt: u.created_at,
      })
    }
  }

  // ── 🔴 사업자등록증 심사 7일 초과 ──────────────────────────────────
  for (const s of allSuppliers ?? []) {
    if (s.verification_status !== 'pending') continue
    const authUser = userMap.get(s.user_id)
    if (authUser && authUser.created_at < sevenDaysAgo) {
      const days = daysSince(authUser.created_at)
      anomalies.push({
        type: 'pending_too_long',
        severity: 'critical',
        userId: s.user_id,
        label: s.company_name,
        detail: `사업자등록증 심사 ${days}일째 미처리`,
        daysAgo: days,
        createdAt: authUser.created_at,
      })
    }
  }

  // ── 🟡 연구자 가입 14일 후 요청 0건 ────────────────────────────────
  for (const rp of allResearchers ?? []) {
    if (requestedResearchers.has(rp.user_id)) continue
    const authUser = userMap.get(rp.user_id)
    if (authUser && authUser.created_at < fourteenDaysAgo) {
      const days = daysSince(authUser.created_at)
      anomalies.push({
        type: 'researcher_inactive',
        severity: 'warning',
        userId: rp.user_id,
        label: authUser.email ?? rp.name,
        detail: `가입 ${days}일 경과, 견적 요청 0건`,
        daysAgo: days,
        createdAt: authUser.created_at,
      })
    }
  }

  // ── 🟡 공급자 가입 14일 후 입찰 0건 (인증 완료 계정만) ─────────────
  for (const sp of allSuppliers ?? []) {
    if (sp.verification_status !== 'instant' && sp.verification_status !== 'approved') continue
    if (biddingSuppliers.has(sp.user_id)) continue
    const authUser = userMap.get(sp.user_id)
    if (authUser && authUser.created_at < fourteenDaysAgo) {
      const days = daysSince(authUser.created_at)
      anomalies.push({
        type: 'supplier_inactive',
        severity: 'warning',
        userId: sp.user_id,
        label: sp.company_name,
        detail: `가입 ${days}일 경과, 입찰 0건`,
        daysAgo: days,
        createdAt: authUser.created_at,
      })
    }
  }

  // ── 🟡 공급자 입찰 5회 이상, 낙찰 0건 ─────────────────────────────
  const bidStats = new Map<string, { total: number; accepted: number }>()
  for (const b of allBids ?? []) {
    const curr = bidStats.get(b.supplier_id) ?? { total: 0, accepted: 0 }
    curr.total++
    if (b.status === 'accepted') curr.accepted++
    bidStats.set(b.supplier_id, curr)
  }
  for (const [supplierId, stat] of bidStats) {
    if (stat.total >= 5 && stat.accepted === 0) {
      const sp = supplierMap.get(supplierId)
      const authUser = userMap.get(supplierId)
      anomalies.push({
        type: 'low_acceptance_rate',
        severity: 'warning',
        userId: supplierId,
        label: sp?.company_name ?? authUser?.email ?? supplierId,
        detail: `${stat.total}회 입찰, 낙찰 0건 (낙찰률 0%)`,
        daysAgo: authUser ? daysSince(authUser.created_at) : 0,
        createdAt: authUser?.created_at ?? '',
      })
    }
  }

  // ── 🟡 마감일 지난 미마감 open 요청 ────────────────────────────────
  const today = new Date().toISOString().slice(0, 10)
  // allRequests 기준으로 마감 지난 open 요청 감지
  for (const req of allRequests ?? []) {
    if (req.status !== 'open') continue
    if (!req.deadline || req.deadline >= today) continue
    const researcher = researcherMap.get(req.researcher_id)
    const authUser = userMap.get(req.researcher_id)
    const days = daysSince(req.created_at)
    anomalies.push({
      type: 'expired_no_bid',
      severity: 'warning',
      userId: req.researcher_id,
      label: authUser?.email ?? researcher?.name ?? req.researcher_id,
      detail: `마감일(${req.deadline}) 경과된 미마감 요청 (입찰 미수령 가능성)`,
      daysAgo: days,
      createdAt: req.created_at,
    })
  }

  // severity 순(critical 우선) → daysAgo 내림차순
  anomalies.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'critical' ? -1 : 1
    return b.daysAgo - a.daysAgo
  })

  return NextResponse.json({
    anomalies,
    counts: {
      critical: anomalies.filter(a => a.severity === 'critical').length,
      warning:  anomalies.filter(a => a.severity === 'warning').length,
      total:    anomalies.length,
    },
  })
}
