import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getQuotaStatus } from '@/lib/quota-display'
import type { Role } from '@/lib/credits'

/**
 * 로그인 사용자의 크레딧 잔액 + 무료 한도 현황
 * GET /api/me/credits
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const role: Role = user.user_metadata?.user_type === 'supplier' ? 'supplier' : 'researcher'
  const table = role === 'supplier' ? 'supplier_profiles' : 'researcher_profiles'

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (admin as any)
    .from(table)
    .select('credits')
    .eq('user_id', user.id)
    .maybeSingle()

  const quota = await getQuotaStatus(user.id, role)

  return NextResponse.json({
    role,
    credits: profile?.credits ?? 0,
    quota,
  })
}
