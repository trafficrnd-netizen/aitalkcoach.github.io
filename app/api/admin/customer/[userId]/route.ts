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

export async function GET(
  _req: NextRequest,
  { params }: { params: { userId: string } }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId } = params

  // 1. Auth 사용자 정보
  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
  if (userError || !userData?.user) {
    return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
  }
  const user = userData.user
  const userType = (user.user_metadata?.user_type as 'researcher' | 'supplier') ?? 'researcher'

  // 2. 프로필 + 활동 병렬 조회
  if (userType === 'researcher') {
    const [{ data: profile }, { data: reqs }] = await Promise.all([
      supabaseAdmin
        .from('researcher_profiles')
        .select('name, institution, department, phone, review_credits, badge_level')
        .eq('user_id', userId)
        .maybeSingle(),
      supabaseAdmin
        .from('requests')
        .select('id, title, status, created_at, deadline')
        .eq('researcher_id', userId)
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    const requests = reqs ?? []
    return NextResponse.json({
      userId,
      email: user.email,
      userType: 'researcher',
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at ?? null,
      emailConfirmedAt: user.email_confirmed_at ?? null,
      profile,
      activity: {
        totalRequests: requests.length,
        openRequests: requests.filter(r => r.status === 'open').length,
        closedRequests: requests.filter(r => r.status === 'closed').length,
      },
      recentActivity: requests.slice(0, 5),
    })
  } else {
    const [{ data: profile }, { data: bidsData }] = await Promise.all([
      supabaseAdmin
        .from('supplier_profiles')
        .select(
          'company_name, business_number, representative, address, phone, ' +
          'contact_name, contact_phone, categories, regions, plan, credits, ' +
          'early_bird, handles_hazmat, verification_status, verified_at'
        )
        .eq('user_id', userId)
        .maybeSingle(),
      supabaseAdmin
        .from('bids')
        .select('id, status, created_at, request_id')
        .eq('supplier_id', userId)
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    const bids = bidsData ?? []
    return NextResponse.json({
      userId,
      email: user.email,
      userType: 'supplier',
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at ?? null,
      emailConfirmedAt: user.email_confirmed_at ?? null,
      profile,
      activity: {
        totalBids: bids.length,
        acceptedBids: bids.filter(b => b.status === 'accepted').length,
        pendingBids: bids.filter(b => b.status === 'pending').length,
        rejectedBids: bids.filter(b => b.status === 'rejected').length,
      },
      recentActivity: bids.slice(0, 5),
    })
  }
}
