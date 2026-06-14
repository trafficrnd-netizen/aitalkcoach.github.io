import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const { email, name, institution } = await request.json()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: '유효한 이메일을 입력해주세요.' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('waitlist')
    .insert({ email: email.toLowerCase().trim(), name: name || null, institution: institution || null })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: '이미 등록된 이메일입니다.' }, { status: 409 })
    }
    return NextResponse.json({ error: '등록 중 오류가 발생했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function GET() {
  const { count } = await supabaseAdmin
    .from('waitlist')
    .select('*', { count: 'exact', head: true })

  return NextResponse.json({ count: count ?? 0 })
}
