import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Post-earlybird token allocation per plan per month
const PLAN_TOKENS: Record<string, number> = {
  free: 0,
  basic: 5,
  pro: 8,
  enterprise: 10,
}

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check earlybird status
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: setting } = await (supabaseAdmin as any)
    .from('app_settings')
    .select('value')
    .eq('key', 'earlybird_active')
    .maybeSingle()
  const isEarlybird = setting?.value === 'true'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabaseAdmin as any)
    .from('supplier_profiles')
    .select('plan, credits')
    .eq('user_id', user.id)
    .maybeSingle()

  const plan = profile?.plan ?? 'free'

  if (isEarlybird) {
    // Earlybird: 1 token per week, auto-generate if eligible
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: recentToken } = await (supabaseAdmin as any)
      .from('ad_tokens')
      .select('id, created_at')
      .eq('supplier_id', user.id)
      .eq('source', 'earlybird')
      .gte('created_at', sevenDaysAgo)
      .maybeSingle()

    // Generate new token if none in past 7 days
    if (!recentToken) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin as any)
        .from('ad_tokens')
        .insert({ supplier_id: user.id, source: 'earlybird' })
    }

    // Count available (unused) tokens
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (supabaseAdmin as any)
      .from('ad_tokens')
      .select('*', { count: 'exact', head: true })
      .eq('supplier_id', user.id)
      .is('used_at', null)

    // Next token date: 7 days after latest token
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: latestToken } = await (supabaseAdmin as any)
      .from('ad_tokens')
      .select('created_at')
      .eq('supplier_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextTokenAt = latestToken
      ? new Date(new Date(latestToken.created_at).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
      : null

    return NextResponse.json({
      available: count ?? 0,
      isEarlybird: true,
      plan,
      nextTokenAt,
    })
  } else {
    // Post-earlybird: monthly allocation by plan + rating bonus
    const baseTokens = PLAN_TOKENS[plan] ?? 0

    // Rating bonus (avg_rating from reviews)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: ratingRows } = await (supabaseAdmin as any)
      .from('reviews')
      .select('rating_price, rating_delivery, rating_communication')
      .eq('reviewee_id', user.id)
    const ratingCount = ratingRows?.length ?? 0
    let avgRating = 0
    if (ratingCount > 0) {
      avgRating = (ratingRows as { rating_price: number; rating_delivery: number; rating_communication: number }[])
        .reduce((sum, r) => sum + (r.rating_price + r.rating_delivery + r.rating_communication) / 3, 0) / ratingCount
    }
    const ratingBonus = avgRating >= 4.5 ? 2 : avgRating >= 4.0 ? 1 : 0
    const monthlyAlloc = Math.min(baseTokens + ratingBonus, 10)

    // Count tokens used this month
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: usedThisMonth } = await (supabaseAdmin as any)
      .from('ad_tokens')
      .select('*', { count: 'exact', head: true })
      .eq('supplier_id', user.id)
      .gte('used_at', monthStart.toISOString())

    // Count current available (unused)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: available } = await (supabaseAdmin as any)
      .from('ad_tokens')
      .select('*', { count: 'exact', head: true })
      .eq('supplier_id', user.id)
      .is('used_at', null)

    return NextResponse.json({
      available: available ?? 0,
      isEarlybird: false,
      plan,
      monthlyAlloc,
      usedThisMonth: usedThisMonth ?? 0,
      avgRating: Math.round(avgRating * 10) / 10,
      ratingBonus,
    })
  }
}
