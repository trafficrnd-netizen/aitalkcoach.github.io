import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json()
  const role = (body.role as 'researcher' | 'supplier') || 'researcher'

  const admin = createAdminClient()

  // 중복 방지 — 이미 등록된 user_id면 skip
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (admin as any)
    .from('signup_attribution')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (existing) return NextResponse.json({ ok: true, duplicate: true })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from('signup_attribution').insert({
    user_id: user.id,
    role,
    utm_source: body.utm_source ?? null,
    utm_medium: body.utm_medium ?? null,
    utm_campaign: body.utm_campaign ?? null,
    utm_content: body.utm_content ?? null,
    utm_term: body.utm_term ?? null,
    landing_path: body.landing_path ?? null,
    referrer: (body.referrer ?? '').slice(0, 500) || null,
  })

  return NextResponse.json({ ok: true })
}
