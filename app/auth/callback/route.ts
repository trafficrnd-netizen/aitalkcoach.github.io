import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? ''

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      if (next) return NextResponse.redirect(`${origin}${next}`)
      // Determine default landing by role
      const { data: { user: authedUser } } = await supabase.auth.getUser()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: supplierProfile } = authedUser ? await (supabase as any)
        .from('supplier_profiles')
        .select('user_id')
        .eq('user_id', authedUser.id)
        .maybeSingle() : { data: null }
      const destination = supplierProfile ? '/supplier/board' : '/researcher/board'
      return NextResponse.redirect(`${origin}${destination}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
