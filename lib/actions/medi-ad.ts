'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createMediAd(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const title       = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim().slice(0, 150) || null
  const productsTxt = (formData.get('products') as string) || ''
  const contactInfo = (formData.get('contactInfo') as string)?.trim() || null
  const validUntil  = (formData.get('validUntil') as string)
  const imageUrl    = (formData.get('imageUrl') as string) || null

  if (!title)      return { error: '광고 제목을 입력해주세요.' }
  if (!validUntil) return { error: '만료일을 선택해주세요.' }
  if (new Date(validUntil) <= new Date()) return { error: '만료일은 오늘 이후여야 합니다.' }

  const products = productsTxt.split(',').map(s => s.trim()).filter(Boolean)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertErr } = await (supabase as any)
    .from('supplier_ads')
    .insert({
      supplier_id: user.id,
      title,
      description,
      categories: ['에스테틱 소모품'],
      products,
      regions: ['전국'],
      contact_info: contactInfo,
      valid_until: validUntil,
      image_url: imageUrl,
      vertical: 'aesthetic',
    })

  if (insertErr) {
    console.error('createMediAd error:', insertErr)
    return { error: '광고 등록 중 오류가 발생했습니다.' }
  }

  redirect('/medi-supplier/board')
}

export async function deleteMediAd(adId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('supplier_ads')
    .delete()
    .eq('id', adId)
    .eq('supplier_id', user.id)

  revalidatePath('/medi-supplier/board')
}
