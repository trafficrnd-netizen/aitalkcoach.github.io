'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function createSupplierAd(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const title = (formData.get('title') as string)?.trim()
  const description = ((formData.get('description') as string) || '').slice(0, 150) || null
  const categoriesRaw = formData.get('categories') as string
  const regionsRaw = formData.get('regions') as string
  const contactInfo = (formData.get('contactInfo') as string) || null
  const validUntil = formData.get('validUntil') as string
  const imageUrl = (formData.get('imageUrl') as string) || null

  if (!title) return { error: '광고 제목을 입력해주세요.' }
  if (!validUntil) return { error: '만료일을 선택해주세요.' }
  if (new Date(validUntil) <= new Date()) return { error: '만료일은 오늘 이후여야 합니다.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabaseAdmin as any)
    .from('supplier_profiles')
    .select('company_name')
    .eq('user_id', user.id)
    .single()
  if (!profile) return { error: '공급자 계정이 필요합니다.' }

  // Check available token
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: token } = await (supabaseAdmin as any)
    .from('ad_tokens')
    .select('id')
    .eq('supplier_id', user.id)
    .is('used_at', null)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (!token) return { error: '사용 가능한 광고 토큰이 없습니다.' }

  const categories = categoriesRaw ? categoriesRaw.split(',').map(s => s.trim()).filter(Boolean) : []
  const regions = regionsRaw ? regionsRaw.split(',').map(s => s.trim()).filter(Boolean) : []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ad, error: insertErr } = await (supabaseAdmin as any)
    .from('supplier_ads')
    .insert({
      supplier_id: user.id,
      title,
      description,
      categories,
      regions,
      contact_info: contactInfo,
      valid_until: validUntil,
      image_url: imageUrl,
    })
    .select('id')
    .single()

  if (insertErr) return { error: '광고 등록 중 오류가 발생했습니다.' }

  // Consume the token
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabaseAdmin as any)
    .from('ad_tokens')
    .update({ used_at: new Date().toISOString(), used_for_ad_id: ad.id })
    .eq('id', token.id)

  redirect('/supplier/board')
}

export async function deleteSupplierAd(adId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('supplier_ads')
    .delete()
    .eq('id', adId)
    .eq('supplier_id', user.id)

  redirect('/supplier/board')
}
