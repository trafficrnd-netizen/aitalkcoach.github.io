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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [
    { data: authData },
    { data: suppliers },
    { data: transactions },
    { data: awardedBids },
    { data: waitlist },
    { data: requests },
    { data: pendingSuppliers },
  ] = await Promise.all([
    supabaseAdmin.auth.admin.listUsers(),
    // created_at 은 supplier_profiles 에 없으므로 제외 — auth.users 에서 보완
    supabaseAdmin
      .from('supplier_profiles')
      .select('user_id, company_name, business_number, verification_status')
      .order('user_id', { ascending: false }),
    supabaseAdmin
      .from('transactions')
      .select('id, status, created_at, request_id')
      .order('created_at', { ascending: false })
      .limit(20),
    supabaseAdmin
      .from('bids')
      .select('id, request_id, supplier_id, created_at')
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })
      .limit(20),
    supabaseAdmin
      .from('waitlist')
      .select('email, role, created_at')
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('requests')
      .select('id, title, status, type, created_at')
      .order('created_at', { ascending: false })
      .limit(30),
    // pending 공급자 — created_at 제외
    supabaseAdmin
      .from('supplier_profiles')
      .select('user_id, company_name, business_number, contact_name, contact_phone')
      .eq('verification_status', 'pending')
      .order('user_id', { ascending: true }),
  ])

  const allUsers = (authData as { users: { id: string; email?: string; created_at: string; user_metadata?: { user_type?: string } }[] })?.users ?? []

  // user_id → auth.users 맵 (created_at 보완용)
  const userMap = new Map(allUsers.map(u => [u.id, u]))

  const supplierUserIds = new Set((suppliers ?? []).map((s: { user_id: string }) => s.user_id))

  // user_type 메타데이터 기준으로 연구자 분류
  const researcherUsers = allUsers.filter(u =>
    u.user_metadata?.user_type === 'researcher' || (!supplierUserIds.has(u.id) && !u.user_metadata?.user_type)
  )

  // 공급자 최근 가입: auth.users.created_at 으로 보완
  const recentSuppliers = (suppliers ?? [])
    .map((s: { user_id: string; company_name: string }) => ({
      user_id: s.user_id,
      company_name: s.company_name,
      created_at: userMap.get(s.user_id)?.created_at ?? '',
    }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 10)

  // 심사 대기: auth.users.created_at 으로 가입일 보완
  const enrichedPending = (pendingSuppliers ?? []).map((s: {
    user_id: string
    company_name: string
    business_number: string
    contact_name: string | null
    contact_phone: string | null
  }) => ({
    ...s,
    created_at: userMap.get(s.user_id)?.created_at ?? '',
  }))

  const stats = {
    totalResearchers: researcherUsers.length,
    totalSuppliers: (suppliers ?? []).length,
    totalRequests: requests?.length ?? 0,
    totalTransactions: transactions?.length ?? 0,
    totalAwarded: awardedBids?.length ?? 0,
    totalWaitlist: waitlist?.length ?? 0,
    openRequests: (requests ?? []).filter((r: { status: string }) => r.status === 'open').length,
    completedTransactions: (transactions ?? []).filter((t: { status: string }) => t.status === 'completed').length,
  }

  return NextResponse.json({
    stats,
    recentSuppliers,
    recentResearchers: researcherUsers.slice(0, 10).map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
    })),
    recentRequests: (requests ?? []).slice(0, 10),
    recentAwarded: (awardedBids ?? []).slice(0, 10),
    waitlist: (waitlist ?? []).slice(0, 30),
    pendingSuppliers: enrichedPending,
  })
}
