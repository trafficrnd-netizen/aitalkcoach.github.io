import { createClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client — RLS 우회, 서버 전용.
 * Storage 업로드 / 서명 URL 생성 등 관리 작업에만 사용.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}
