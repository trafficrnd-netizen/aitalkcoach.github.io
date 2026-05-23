import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { redis } from '@/lib/redis'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const cached = await redis.get<number>('supplier:count')
    if (cached !== null) {
      return NextResponse.json({ count: cached, earlyBirdLeft: Math.max(0, 20 - cached) })
    }
  } catch { /* Redis 없으면 DB에서 직접 조회 */ }

  const { count } = await supabaseAdmin
    .from('supplier_profiles')
    .select('*', { count: 'exact', head: true })

  const total = count ?? 0

  try {
    await redis.set('supplier:count', total, { ex: 30 })
  } catch { /* 캐시 실패 무시 */ }

  return NextResponse.json({ count: total, earlyBirdLeft: Math.max(0, 20 - total) })
}
