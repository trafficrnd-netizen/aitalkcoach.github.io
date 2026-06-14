import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// One-time endpoint: POST /api/admin/create-test-users
// Remove after use.
export async function POST(request: Request) {
  const secret = request.headers.get('x-admin-secret')
  if (secret !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const results: Record<string, unknown>[] = []

  const users = [
    {
      email: 'clinic@medi.kr',
      password: 'medi1234',
      user_metadata: { user_type: 'clinic' },
      publicType: 'clinic' as const,
    },
    {
      email: 'partner@medi.kr',
      password: 'medi1234',
      user_metadata: { user_type: 'supplier' },
      publicType: 'supplier' as const,
    },
  ]

  for (const u of users) {
    const { data, error } = await admin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: u.user_metadata,
    })

    if (error) {
      results.push({ email: u.email, error: error.message })
      continue
    }

    const userId = data.user.id

    // public.users 레코드
    const { error: pubErr } = await admin
      .from('users')
      .upsert({ id: userId, email: u.email, type: u.publicType }, { onConflict: 'id' })

    // partner@medi.kr: supplier_profiles에 aesthetic vertical 추가
    if (u.email === 'partner@medi.kr') {
      await admin
        .from('supplier_profiles')
        .upsert({ user_id: userId, verticals: ['aesthetic'] }, { onConflict: 'user_id' })
    }

    results.push({ email: u.email, id: userId, publicErr: pubErr?.message ?? null })
  }

  return NextResponse.json({ results })
}
