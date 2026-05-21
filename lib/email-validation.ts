const FREE_EMAIL_DOMAINS = new Set([
  // 한국
  'naver.com', 'daum.net', 'hanmail.net', 'kakao.com', 'nate.com',
  'korea.com', 'paran.com', 'empal.com',
  // 글로벌
  'gmail.com', 'googlemail.com',
  'yahoo.com', 'yahoo.co.kr', 'yahoo.co.jp',
  'hotmail.com', 'hotmail.co.kr',
  'outlook.com', 'outlook.kr',
  'live.com', 'msn.com',
  'icloud.com', 'me.com', 'mac.com',
  'protonmail.com', 'proton.me',
  'aol.com', 'zoho.com',
])

export function isInstitutionalEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return false
  return !FREE_EMAIL_DOMAINS.has(domain)
}

/** gmail, naver 등 개인 무료 이메일 여부 */
export function isPersonalEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return false
  return FREE_EMAIL_DOMAINS.has(domain)
}

export const INSTITUTIONAL_EMAIL_ERROR =
  '기업·기관·학교 이메일만 베타 참여가 가능합니다. (gmail, naver 등 개인 이메일 불가)'
