'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateSupplierProfile(formData: FormData) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: '로그인이 필요합니다.' }
  }

  const companyName = formData.get('companyName') as string
  const representative = (formData.get('representative') as string) || null
  const address = (formData.get('address') as string) || null
  const phone = (formData.get('phone') as string) || null
  const categories = formData.getAll('categories') as string[]
  const regions = formData.getAll('regions') as string[]
  const proteinCategories = formData.getAll('proteinCategories') as string[]
  const equipmentCategories = formData.getAll('equipmentCategories') as string[]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('supplier_profiles')
    .update({
      company_name: companyName,
      representative,
      address,
      phone,
      categories,
      regions,
      protein_categories: proteinCategories,
      equipment_categories: equipmentCategories,
    })
    .eq('user_id', user.id)

  if (error) {
    return { error: '저장 중 오류가 발생했습니다.' }
  }

  revalidatePath('/supplier/settings')
  return { success: true }
}
