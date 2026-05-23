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

// GET — quota_settings + 현재 사용자 수 + 동적 공식 미리보기
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: settings } = await (supabaseAdmin as any).from('quota_settings').select('*')

  // 사용자 수 조회
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: researcherCount } = await (supabaseAdmin as any)
    .from('researcher_profiles').select('*', { count: 'exact', head: true })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: supplierCount } = await (supabaseAdmin as any)
    .from('supplier_profiles').select('*', { count: 'exact', head: true })

  // 미리보기 계산
  const enriched = (settings ?? []).map(
    (s: {
      role: string; early_bird_quota: number; normal_quota: number;
      dynamic_enabled: boolean; dynamic_formula: Record<string, number> | null;
      period: string; updated_at: string;
    }) => {
      let previewEarly = s.early_bird_quota
      let previewNormal = s.normal_quota
      if (s.dynamic_enabled && s.dynamic_formula) {
        const f = s.dynamic_formula
        const base = (f.base ?? 0) + (f.per_researcher ?? 0) * (researcherCount ?? 0)
        const clamped = Math.max(f.min ?? 0, Math.min(f.max ?? Infinity, base))
        previewNormal = Math.floor(clamped)
        previewEarly = Math.floor(clamped + (f.early_bird_bonus ?? 0))
      }
      return { ...s, preview_early: previewEarly, preview_normal: previewNormal }
    }
  )

  return NextResponse.json({
    settings: enriched,
    researcherCount: researcherCount ?? 0,
    supplierCount: supplierCount ?? 0,
    ratio: supplierCount ? Number(((researcherCount ?? 0) / supplierCount).toFixed(2)) : null,
  })
}

// PATCH — 수정
export async function PATCH(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { role, patch } = body as {
    role: string
    patch: Partial<{
      early_bird_quota: number
      normal_quota: number
      dynamic_enabled: boolean
      dynamic_formula: Record<string, number>
    }>
  }

  if (!role || !patch) return NextResponse.json({ error: 'role and patch required' }, { status: 400 })

  const allowed: Record<string, true> = {
    early_bird_quota: true, normal_quota: true, dynamic_enabled: true, dynamic_formula: true,
  }
  const sanitized: Record<string, unknown> = {}
  for (const k of Object.keys(patch)) {
    if (allowed[k]) sanitized[k] = (patch as Record<string, unknown>)[k]
  }
  sanitized.updated_at = new Date().toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabaseAdmin as any)
    .from('quota_settings')
    .update(sanitized)
    .eq('role', role)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
