import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface MediProductResult {
  id: string
  category: string    // 카탈로그 코드 (예: device.cartridge)
  name: string
  brand: string | null
  spec: Record<string, unknown>
  is_device: boolean
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''
  const type = searchParams.get('type') ?? ''   // 선택적 카테고리 필터 (예: device)

  if (q.length < 1) return NextResponse.json([])

  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('aesthetic_products')
    .select('id, category, name, brand, spec, is_device')
    .eq('active', true)
    .ilike('name', `%${q}%`)
    .limit(12)

  // 유형 필터 (카테고리 접두어 매칭)
  if (type) {
    query = query.ilike('category', `${type}.%`)
  }

  const { data, error } = await query.order('name')

  if (error) {
    console.error('[medi/products/search]', error)
    return NextResponse.json([])
  }

  return NextResponse.json((data ?? []) as MediProductResult[])
}
