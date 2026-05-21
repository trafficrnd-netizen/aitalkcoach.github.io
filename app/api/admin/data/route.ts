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
    { data: researchers },
    { data: suppliers },
    { data: transactions },
    { data: awardedBids },
    { data: waitlist },
    { data: requests },
    { data: pendingSuppliers },
  ] = await Promise.all([
    supabaseAdmin.auth.admin.listUsers(),
    supabaseAdmin.from('supplier_profiles').select('user_id, company_name, created_at').order('created_at', { ascending: false }),
    supabaseAdmin.from('transactions').select('id, status, created_at, request_id').order('created_at', { ascending: false }).limit(20),
    supabaseAdmin.from('bids').select('id, request_id, supplier_id, created_at').eq('status', 'accepted').order('created_at', { ascending: false }).limit(20),
    supabaseAdmin.from('waitlist').select('email, role, created_at').order('created_at', { ascending: false }),
    supabaseAdmin.from('requests').select('id, title, status, type, created_at').order('created_at', { ascending: false }).limit(30),
    supabaseAdmin
      .from('supplier_profiles')
      .select('user_id, company_name, business_number, contact_name, contact_phone, created_at')
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: true }),
  ])

  const supplierUserIds = new Set((suppliers ?? []).map((s: { user_id: string }) => s.user_id))
  const allUsers = (researchers as { users: { id: string; email?: string; created_at: string }[] })?.users ?? []
  const researcherUsers = allUsers.filter(u => !supplierUserIds.has(u.id))

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
    recentSuppliers: (suppliers ?? []).slice(0, 10),
    recentResearchers: researcherUsers.slice(0, 10).map(u => ({ id: u.id, email: u.email, created_at: u.created_at })),
    recentRequests: (requests ?? []).slice(0, 10),
    recentAwarded: (awardedBids ?? []).slice(0, 10),
    waitlist: (waitlist ?? []).slice(0, 30),
    pendingSuppliers: pendingSuppliers ?? [],
  })
}
