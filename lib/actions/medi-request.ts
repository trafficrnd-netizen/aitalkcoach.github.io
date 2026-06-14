'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const VERTICAL = 'aesthetic'

export async function createMediRequest(formData: FormData) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: '로그인이 필요합니다.' }
  }

  const productName  = (formData.get('productName') as string)?.trim()
  const productCode  = (formData.get('productCode') as string) || null
  const productType  = (formData.get('productType') as string) || null
  const qty          = Number(formData.get('qty'))
  const unit         = (formData.get('unit') as string) || 'ea'
  const deadline     = (formData.get('deadline') as string) || null
  const deliveryCity = (formData.get('deliveryCity') as string)?.trim() || null
  const notes        = (formData.get('notes') as string) || null
  const bidMode      = (formData.get('bidMode') as string) || 'open'

  if (!productName) return { error: '제품명은 필수입니다.' }
  if (!qty || qty <= 0) return { error: '수량을 입력해주세요.' }
  if (!deliveryCity) return { error: '배송 도시명은 필수입니다.' }

  // 무료 버티컬 — 크레딧/구독 체크 완전 우회 (isFree(VERTICAL) === true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: request, error: reqError } = await db
    .from('requests')
    .insert({
      researcher_id: user.id,
      type: 'single',
      title: productName,
      deadline,
      notes,
      bid_mode: bidMode,
      item_type: productType ?? 'device',
      item_specs: productCode ? { code: productCode, vertical: VERTICAL } : { vertical: VERTICAL },
      delivery_city: deliveryCity,
      vertical: VERTICAL,
    })
    .select('id')
    .single()

  if (reqError || !request) {
    console.error('createMediRequest error:', reqError)
    return { error: '요청 생성 중 오류가 발생했습니다.' }
  }

  const { error: itemError } = await db
    .from('request_items')
    .insert({
      request_id: request.id,
      substance_name: productName,
      qty,
      unit,
    })

  if (itemError) {
    return { error: '품목 저장 중 오류가 발생했습니다.' }
  }

  redirect('/clinic/requests')
}
