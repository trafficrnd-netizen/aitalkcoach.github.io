import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { FROM_EMAIL } from '@/lib/resend'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)
const resend = new Resend(process.env.RESEND_API_KEY)

async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  return cookieStore.get('admin_session')?.value === 'authenticated'
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId, action } = await req.json() as { userId: string; action: 'approve' | 'reject' }

  if (!userId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  // 1. 공급자 프로필 조회
  const { data: profile, error: fetchError } = await supabaseAdmin
    .from('supplier_profiles')
    .select('company_name, business_number, contact_name, contact_phone, verification_status')
    .eq('user_id', userId)
    .single()

  if (fetchError || !profile) {
    return NextResponse.json({ error: '공급자를 찾을 수 없습니다.' }, { status: 404 })
  }

  if (profile.verification_status !== 'pending') {
    return NextResponse.json({ error: '이미 처리된 심사입니다.' }, { status: 409 })
  }

  // 2. 가입 이메일 조회
  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
  if (userError || !userData.user?.email) {
    return NextResponse.json({ error: '사용자 이메일을 조회할 수 없습니다.' }, { status: 404 })
  }
  const supplierEmail = userData.user.email

  // 3. DB 업데이트
  const newStatus = action === 'approve' ? 'approved' : 'rejected'
  const updatePayload =
    action === 'approve'
      ? { verification_status: newStatus, verified_at: new Date().toISOString() }
      : { verification_status: newStatus }

  const { error: updateError } = await supabaseAdmin
    .from('supplier_profiles')
    .update(updatePayload)
    .eq('user_id', userId)

  if (updateError) {
    console.error('[verify-supplier] DB 업데이트 실패:', updateError.message)
    return NextResponse.json({ error: 'DB 업데이트에 실패했습니다.' }, { status: 500 })
  }

  // 4. 공급자에게 결과 이메일 발송
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bidvibe.ai-traffic.kr'
  const bnoFormatted = profile.business_number.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3')

  const approveHtml = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a2e">
      <h2 style="font-size:20px;margin-bottom:8px">✅ 공급자 인증이 완료되었습니다</h2>
      <p style="color:#6b7280;font-size:14px;margin-bottom:20px">안녕하세요, ${profile.contact_name ?? profile.company_name}님</p>
      <p style="font-size:14px;line-height:1.7">
        <strong>${profile.company_name}</strong> (${bnoFormatted})의 사업자등록증 심사가 완료되어
        BidVibe 공급자 인증이 승인되었습니다.<br/>
        이제 견적 요청에 자유롭게 입찰하실 수 있습니다.
      </p>
      <p style="margin-top:24px">
        <a href="${appUrl}/supplier/board"
           style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 22px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600">
          입찰 시작하기 →
        </a>
      </p>
      <p style="margin-top:32px;font-size:12px;color:#9ca3af">BidVibe — 연구실 시약·소모품·장비 역경매 B2B 조달 플랫폼</p>
    </div>
  `

  const rejectHtml = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a2e">
      <h2 style="font-size:20px;margin-bottom:8px">❌ 공급자 인증 심사 결과 안내</h2>
      <p style="color:#6b7280;font-size:14px;margin-bottom:20px">안녕하세요, ${profile.contact_name ?? profile.company_name}님</p>
      <p style="font-size:14px;line-height:1.7">
        <strong>${profile.company_name}</strong> (${bnoFormatted})의 사업자등록증 심사에서
        인증을 완료하지 못했습니다.<br/>
        서류 내용이 등록 정보와 일치하지 않거나 확인이 불가한 경우 거절될 수 있습니다.
      </p>
      <p style="font-size:14px;color:#6b7280;margin-top:12px">
        문의 사항은 <a href="mailto:sales@ai-traffic.kr" style="color:#4f46e5">sales@ai-traffic.kr</a>로 연락해주세요.
      </p>
      <p style="margin-top:32px;font-size:12px;color:#9ca3af">BidVibe — 연구실 시약·소모품·장비 역경매 B2B 조달 플랫폼</p>
    </div>
  `

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: supplierEmail,
      subject: action === 'approve'
        ? `[BidVibe] ${profile.company_name} 공급자 인증이 완료되었습니다`
        : `[BidVibe] ${profile.company_name} 공급자 인증 심사 결과 안내`,
      html: action === 'approve' ? approveHtml : rejectHtml,
    })
  } catch (err) {
    // 이메일 실패는 DB 업데이트 이후라 롤백 없이 경고만
    console.error('[verify-supplier] 결과 이메일 발송 실패:', err)
  }

  return NextResponse.json({ ok: true, status: newStatus })
}
