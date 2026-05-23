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

// GET — 전체 적립행위 목록
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabaseAdmin as any)
    .from('credit_rules')
    .select('*')
    .order('role', { ascending: true })
    .order('sort_order', { ascending: true })

  return NextResponse.json({ rules: data ?? [] })
}

// PATCH — 적립행위 수정 (active, points, label, frequency_*)
export async function PATCH(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { key, patch } = body as {
    key: string
    patch: Partial<{
      active: boolean
      points: number
      label: string
      description: string | null
      frequency_type: string
      frequency_limit: number | null
      sort_order: number
    }>
  }

  if (!key || !patch) {
    return NextResponse.json({ error: 'key and patch required' }, { status: 400 })
  }

  // 화이트리스트 검증
  const allowed: Record<string, true> = {
    active: true, points: true, label: true, description: true,
    frequency_type: true, frequency_limit: true, sort_order: true,
  }
  const sanitized: Record<string, unknown> = {}
  for (const k of Object.keys(patch)) {
    if (allowed[k]) sanitized[k] = (patch as Record<string, unknown>)[k]
  }
  sanitized.updated_at = new Date().toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabaseAdmin as any)
    .from('credit_rules')
    .update(sanitized)
    .eq('key', key)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
