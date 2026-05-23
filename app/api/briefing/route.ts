import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data: requests } = await supabaseAdmin
    .from('requests')
    .select('id, title, type, status, deadline, created_at')
    .in('status', ['open', 'closed'])
    .order('created_at', { ascending: false })
    .limit(10)

  if (!requests?.length) {
    return NextResponse.json({ items: [] })
  }

  const requestIds = requests.map((r: { id: string }) => r.id)

  const { data: bidCounts } = await supabaseAdmin
    .from('bids')
    .select('request_id')
    .in('request_id', requestIds)

  const countMap: Record<string, number> = {}
  for (const b of (bidCounts ?? [])) {
    countMap[b.request_id] = (countMap[b.request_id] ?? 0) + 1
  }

  const items = requests.map((r: { id: string; title: string; type: string; status: string; deadline: string | null; created_at: string }) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    status: r.status,
    deadline: r.deadline,
    bidCount: countMap[r.id] ?? 0,
  }))

  return NextResponse.json({ items })
}
