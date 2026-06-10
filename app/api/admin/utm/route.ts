import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function isAuthorized(): boolean {
  const cookieStore = cookies()
  return cookieStore.get('admin_session')?.value === '1'
}

export async function GET(req: NextRequest) {
  if (!isAuthorized()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const days = Number(req.nextUrl.searchParams.get('days') ?? '30')
  const fromIso = new Date(Date.now() - days * 86400_000).toISOString()

  // 전체 attribution 조회
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows } = await (supabaseAdmin as any)
    .from('signup_attribution')
    .select('*')
    .gte('created_at', fromIso)

  type Row = {
    user_id: string
    role: 'researcher' | 'supplier'
    utm_source: string | null
    utm_medium: string | null
    utm_campaign: string | null
    utm_content: string | null
    landing_path: string | null
    referrer: string | null
    created_at: string
  }
  const allRows = (rows ?? []) as Row[]

  // 소스별 집계
  const bySource = new Map<string, { source: string; total: number; researchers: number; suppliers: number }>()
  for (const r of allRows) {
    const k = r.utm_source ?? 'direct'
    if (!bySource.has(k)) bySource.set(k, { source: k, total: 0, researchers: 0, suppliers: 0 })
    const b = bySource.get(k)!
    b.total++
    if (r.role === 'researcher') b.researchers++
    if (r.role === 'supplier') b.suppliers++
  }

  // 캠페인별 집계 (utm_content = 콘텐츠 ID — A2/A10 등)
  const byCampaign = new Map<string, { campaign: string; total: number }>()
  for (const r of allRows) {
    const k = r.utm_content ?? r.utm_campaign ?? '—'
    if (!byCampaign.has(k)) byCampaign.set(k, { campaign: k, total: 0 })
    byCampaign.get(k)!.total++
  }

  // 랜딩 페이지별 집계
  const byLanding = new Map<string, { path: string; total: number }>()
  for (const r of allRows) {
    const k = r.landing_path ?? '—'
    if (!byLanding.has(k)) byLanding.set(k, { path: k, total: 0 })
    byLanding.get(k)!.total++
  }

  // 일별 추세
  const byDay = new Map<string, number>()
  for (const r of allRows) {
    const d = r.created_at.slice(0, 10)
    byDay.set(d, (byDay.get(d) ?? 0) + 1)
  }
  const daily = Array.from(byDay.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, count]) => ({ date, count }))

  return NextResponse.json({
    days,
    totalSignups: allRows.length,
    bySource: Array.from(bySource.values()).sort((a, b) => b.total - a.total),
    byCampaign: Array.from(byCampaign.values()).sort((a, b) => b.total - a.total).slice(0, 20),
    byLanding: Array.from(byLanding.values()).sort((a, b) => b.total - a.total),
    daily,
    recent: allRows
      .sort((a, b) => (a.created_at > b.created_at ? -1 : 1))
      .slice(0, 50)
      .map((r) => ({
        created_at: r.created_at,
        role: r.role,
        utm_source: r.utm_source,
        utm_campaign: r.utm_campaign,
        utm_content: r.utm_content,
        landing_path: r.landing_path,
        referrer: r.referrer,
      })),
  })
}
