/**
 * 친구 초대(레퍼럴) 헬퍼 — 서버 전용
 * - getOrCreateReferralCode: 사용자별 고유 초대 코드 발급/조회
 * - processReferralSignup: 신규 가입 시 초대자에게 크레딧 적립
 */
import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { awardCredits, type Role } from '@/lib/credits'

// 혼동되는 문자(I, O, 0, 1) 제외
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function genReferralCode(): string {
  let s = ''
  for (let i = 0; i < 8; i++) {
    s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  }
  return s
}

/** 사용자의 초대 코드 조회 — 없으면 생성 */
export async function getOrCreateReferralCode(
  userId: string,
  role: Role
): Promise<string | null> {
  const admin = createAdminClient()
  const table = role === 'supplier' ? 'supplier_profiles' : 'researcher_profiles'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (admin as any)
    .from(table)
    .select('referral_code')
    .eq('user_id', userId)
    .maybeSingle()

  if (profile?.referral_code) return profile.referral_code

  // 고유 코드 생성 (충돌 시 재시도)
  for (let attempt = 0; attempt < 6; attempt++) {
    const candidate = genReferralCode()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any)
      .from(table)
      .update({ referral_code: candidate })
      .eq('user_id', userId)
    if (!error) return candidate
  }
  return null
}

interface InviterInfo {
  userId: string
  role: Role
}

/** 초대 코드로 초대자 찾기 */
async function findInviterByCode(code: string): Promise<InviterInfo | null> {
  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: researcher } = await (admin as any)
    .from('researcher_profiles')
    .select('user_id')
    .eq('referral_code', code)
    .maybeSingle()
  if (researcher?.user_id) return { userId: researcher.user_id, role: 'researcher' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: supplier } = await (admin as any)
    .from('supplier_profiles')
    .select('user_id')
    .eq('referral_code', code)
    .maybeSingle()
  if (supplier?.user_id) return { userId: supplier.user_id, role: 'supplier' }

  return null
}

/**
 * 신규 가입 완료 시 호출 — 초대 코드가 유효하면 초대자에게 크레딧 적립.
 * 가입 흐름을 막지 않도록 호출부에서 try/catch 권장.
 */
export async function processReferralSignup(
  code: string,
  newUserId: string,
  newUserEmail: string,
  newUserRole?: Role
): Promise<void> {
  const cleanCode = (code || '').trim().toUpperCase()
  if (!cleanCode) return

  const inviter = await findInviterByCode(cleanCode)
  if (!inviter) return
  if (inviter.userId === newUserId) return // 자기 자신 초대 방지

  const admin = createAdminClient()

  // ── 자전 초대(self-dealing) 추가 차단 ──────────────────────────────
  // 초대자와 피초대자가 같은 사람으로 의심되면 행은 기록하되 크레딧은 미적립
  let suspectSelfDeal = false
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = admin as any
    // 양측 휴대폰 수집 (researcher/supplier 프로필 모두 확인)
    const phoneOf = async (uid: string): Promise<string> => {
      const { data: rp } = await db.from('researcher_profiles').select('phone').eq('user_id', uid).maybeSingle()
      if (rp?.phone) return rp.phone.replace(/\D/g, '')
      const { data: sp } = await db.from('supplier_profiles').select('contact_phone').eq('user_id', uid).maybeSingle()
      return (sp?.contact_phone ?? '').replace(/\D/g, '')
    }
    const [inviterPhone, inviteePhone] = await Promise.all([phoneOf(inviter.userId), phoneOf(newUserId)])
    if (inviterPhone && inviteePhone && inviterPhone === inviteePhone) {
      suspectSelfDeal = true
    }
    // 동일 초대자에게 이미 같은 휴대폰으로 적립된 피초대자가 있으면 중복 차단
    if (!suspectSelfDeal && inviteePhone) {
      const { data: dupes } = await db
        .from('referrals')
        .select('invitee_id')
        .eq('inviter_id', inviter.userId)
        .eq('status', 'joined')
      for (const d of (dupes ?? [])) {
        if (d.invitee_id && d.invitee_id !== newUserId) {
          const p = await phoneOf(d.invitee_id)
          if (p && p === inviteePhone) { suspectSelfDeal = true; break }
        }
      }
    }
  } catch (e) {
    console.error('[referral] self-deal 검사 오류:', e)
  }

  // 기존 'sent' 초대 행이 있으면 joined 로 갱신, 없으면 새로 기록
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (admin as any)
    .from('referrals')
    .select('id')
    .eq('code', cleanCode)
    .eq('invitee_email', newUserEmail.toLowerCase())
    .eq('status', 'sent')
    .maybeSingle()

  let referralId: number | null = null
  if (existing?.id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from('referrals')
      .update({ status: 'joined', invitee_id: newUserId, joined_at: new Date().toISOString() })
      .eq('id', existing.id)
    referralId = existing.id
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inserted } = await (admin as any)
      .from('referrals')
      .insert({
        inviter_id: inviter.userId,
        inviter_role: inviter.role,
        code: cleanCode,
        invitee_email: newUserEmail.toLowerCase(),
        invitee_id: newUserId,
        status: 'joined',
        joined_at: new Date().toISOString(),
      })
      .select('id')
      .single()
    referralId = inserted?.id ?? null
  }

  // 자전 초대 의심 시: 관계는 기록(상태 표시)하되 크레딧은 미적립
  if (suspectSelfDeal) {
    if (referralId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any).from('referrals').update({ status: 'flagged' }).eq('id', referralId)
    }
    console.warn('[referral] 자전 초대 의심 — 크레딧 미적립:', inviter.userId, newUserId)
    return
  }

  // 초대자에게 크레딧 적립
  const ruleKey =
    inviter.role === 'supplier' ? 'supplier_invite_signup' : 'researcher_invite_signup'
  await awardCredits(
    inviter.userId,
    ruleKey,
    inviter.role,
    'referrals',
    referralId ? String(referralId) : undefined
  )

  // ── 단골 관계 자동 생성 (cross-role invite) ────────────────────────
  // 연구자↔공급자 간 초대면 supplier_followers 에 연결 추가
  if (newUserRole && newUserRole !== inviter.role) {
    try {
      const researcherId = newUserRole === 'researcher' ? newUserId : inviter.userId
      const supplierId   = newUserRole === 'supplier'   ? newUserId : inviter.userId
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any).from('supplier_followers').upsert(
        { researcher_id: researcherId, supplier_id: supplierId, via_code: cleanCode },
        { onConflict: 'researcher_id,supplier_id' }
      )
    } catch (e) {
      console.error('[referral] 단골 관계 생성 실패:', e)
    }
  }
}
