'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { signupSupplier } from '@/lib/actions/auth'
import { isPersonalEmail } from '@/lib/email-validation'
import { PrivacyConsent } from '@/components/privacy-consent'
import { PhoneVerify } from '@/components/phone-verify'
import { AlertTriangle } from 'lucide-react'

const CATEGORIES = [
  { value: 'reagent', label: '시약·화학물질' },
  { value: 'consumable', label: '소모품·실험기구' },
  { value: 'equipment', label: '장비·기기' },
  { value: 'bio', label: '생물학·세포배양' },
  { value: 'safety', label: '안전·보호구' },
  { value: 'other', label: '기타' },
]

export default function SupplierSignupPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [businessNumber, setBusinessNumber] = useState('')
  const [bizVerified, setBizVerified] = useState<'idle' | 'loading' | 'ok' | 'fail'>('idle')
  const [bizMessage, setBizMessage] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [handlesHazmat, setHandlesHazmat] = useState(false)
  const [hazmatLicenseNo, setHazmatLicenseNo] = useState('')
  const [hazmatCompliance, setHazmatCompliance] = useState(false)
  const [consent, setConsent] = useState({ terms: false, privacy: false, thirdParty: false, marketing: false })
  const [verifiedPhone, setVerifiedPhone] = useState('')
  // 개인 이메일 트랙
  const [emailValue, setEmailValue] = useState('')
  const [bizDoc, setBizDoc] = useState<File | null>(null)
  const emailIsPersonal = emailValue ? isPersonalEmail(emailValue) : false

  function formatBusinessNumber(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 10)
    if (digits.length <= 3) return digits
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
  }

  async function verifyBusiness() {
    setBizVerified('loading')
    setBizMessage('')

    const res = await fetch('/api/verify-business', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessNumber }),
    })
    const data = await res.json()

    if (data.valid) {
      setBizVerified('ok')
      setBizMessage(data.message)
    } else {
      setBizVerified('fail')
      setBizMessage(data.message)
    }
  }

  function toggleCategory(value: string) {
    setSelectedCategories(prev =>
      prev.includes(value) ? prev.filter(c => c !== value) : [...prev, value]
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (!consent.terms || !consent.privacy) {
      setError('필수 약관에 모두 동의해주세요.')
      return
    }
    if (bizVerified !== 'ok') {
      setError('사업자번호 인증을 완료해주세요.')
      return
    }
    if (selectedCategories.length === 0) {
      setError('취급 카테고리를 하나 이상 선택해주세요.')
      return
    }
    if (handlesHazmat && !hazmatCompliance) {
      setError('유해화학물질 취급 시 화관법 준수 선언에 동의해주세요.')
      return
    }
    if (!verifiedPhone) {
      setError('담당자 휴대폰 본인인증을 완료해주세요.')
      return
    }

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string

    // 개인 이메일 트랙: 사업자등록증 첨부 필수
    if (isPersonalEmail(email) && !bizDoc) {
      setError('gmail · naver 등 개인 이메일은 사업자등록증 첨부가 필요합니다.')
      return
    }

    const password = formData.get('password') as string
    const confirm = formData.get('confirmPassword') as string
    if (password !== confirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    selectedCategories.forEach(c => formData.append('categories', c))
    formData.set('handlesHazmat', handlesHazmat ? 'true' : 'false')
    formData.set('hazmatLicenseNo', hazmatLicenseNo.trim())
    formData.set('thirdPartyConsent', consent.thirdParty ? 'true' : 'false')
    formData.set('marketingConsent', consent.marketing ? 'true' : 'false')
    formData.set('contactPhone', verifiedPhone)
    setLoading(true)

    const result = await signupSupplier(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    // 개인 이메일 트랙: 사업자등록증 이메일 전송 (서버 저장 없음)
    if (isPersonalEmail(email) && bizDoc) {
      const uploadForm = new FormData()
      uploadForm.set('bizDoc',         bizDoc)
      uploadForm.set('businessNumber', businessNumber.replace(/-/g, ''))
      uploadForm.set('companyName',    formData.get('companyName') as string)
      uploadForm.set('contactName',    formData.get('contactName') as string)
      uploadForm.set('contactEmail',   email)
      uploadForm.set('contactPhone',   verifiedPhone)

      const uploadRes = await fetch('/api/supplier-doc-upload', {
        method: 'POST',
        body: uploadForm,
      })
      if (!uploadRes.ok) {
        const uploadData = await uploadRes.json().catch(() => ({}))
        // 계정은 이미 생성됐으므로 에러를 안내하되 로그인은 가능하게
        setError(
          (uploadData.error ?? '사업자등록증 전송에 실패했습니다.') +
          ' 로그인 후 담당자(sales@ai-traffic.kr)에게 직접 이메일을 보내주세요.',
        )
        setLoading(false)
        return
      }

      router.push('/supplier/board')
      router.refresh()
      return
    }

    router.push('/supplier')
    router.refresh()
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-lg border border-border bg-background p-8 shadow-sm">
        <h1 className="text-2xl font-bold mb-1">공급자 베타 참여</h1>
        <p className="text-sm text-muted-foreground mb-1">
          처음 20개사 Pro 1개월 무료 얼리버드 혜택을 드립니다.
        </p>
        <p className="text-xs text-muted-foreground mb-6">
          회사 이메일은 즉시 입찰 가능 · gmail·naver 등 개인 이메일은 사업자등록증 첨부 후 24시간 내 심사
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 회사명 */}
          <div className="space-y-2">
            <Label htmlFor="companyName">회사명</Label>
            <Input id="companyName" name="companyName" placeholder="(주)바이오서플라이" required />
          </div>

          {/* 사업자번호 + 인증 */}
          <div className="space-y-2">
            <Label htmlFor="businessNumber">사업자번호</Label>
            <div className="flex gap-2">
              <Input
                id="businessNumber"
                name="businessNumber"
                value={businessNumber}
                onChange={e => {
                  setBusinessNumber(formatBusinessNumber(e.target.value))
                  setBizVerified('idle')
                }}
                placeholder="000-00-00000"
                maxLength={12}
                required
              />
              <Button
                type="button"
                variant="outline"
                onClick={verifyBusiness}
                disabled={businessNumber.replace(/-/g, '').length !== 10 || bizVerified === 'loading'}
                className="shrink-0"
              >
                {bizVerified === 'loading' ? '확인 중...' : '인증'}
              </Button>
            </div>
            {bizMessage && (
              <p className={`text-xs ${bizVerified === 'ok' ? 'text-primary' : 'text-destructive'}`}>
                {bizVerified === 'ok' ? '✓ ' : '✗ '}{bizMessage}
              </p>
            )}
          </div>

          {/* 대표자명 */}
          <div className="space-y-2">
            <Label htmlFor="representative">대표자명</Label>
            <Input id="representative" name="representative" placeholder="홍길동" />
          </div>

          {/* 주소 */}
          <div className="space-y-2">
            <Label htmlFor="address">사업장 주소</Label>
            <Input id="address" name="address" placeholder="서울시 강남구 ..." />
          </div>

          {/* 대표 전화 */}
          <div className="space-y-2">
            <Label htmlFor="phone">대표 전화</Label>
            <Input id="phone" name="phone" type="tel" placeholder="02-0000-0000" />
          </div>

          {/* 담당자명 */}
          <div className="space-y-2">
            <Label htmlFor="contactName">담당자 성함 <span className="text-destructive">*</span></Label>
            <Input id="contactName" name="contactName" placeholder="홍길동" required />
          </div>

          {/* 담당자 휴대폰 인증 */}
          <PhoneVerify onVerified={setVerifiedPhone} label="담당자 휴대폰 번호 (본인인증 필수)" />

          {/* 취급 카테고리 */}
          <div className="space-y-2">
            <Label>취급 카테고리 <span className="text-destructive">*</span></Label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(({ value, label }) => (
                <div key={value} className="flex items-center gap-2">
                  <Checkbox
                    id={`cat-${value}`}
                    checked={selectedCategories.includes(value)}
                    onCheckedChange={() => toggleCategory(value)}
                  />
                  <label htmlFor={`cat-${value}`} className="text-sm cursor-pointer">
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* 유해화학물질 취급 여부 (화관법) */}
          <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-snug">
                <span className="font-semibold text-foreground">화관법(화학물질관리법) 안내</span><br />
                유해화학물질(독성·부식성·인화성 등) 판매업자는 환경부 영업허가가 필요합니다 (제28조).
                취급 여부를 정확히 선택해주세요.
              </p>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={handlesHazmat}
                onChange={e => { setHandlesHazmat(e.target.checked); if (!e.target.checked) { setHazmatLicenseNo(''); setHazmatCompliance(false) } }}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-sm">유해화학물질을 취급(판매)합니다</span>
            </label>

            {handlesHazmat && (
              <div className="space-y-3 pl-6">
                <div className="space-y-1">
                  <Label htmlFor="hazmatLicenseNo" className="text-xs">
                    유해화학물질 영업허가번호 <span className="text-muted-foreground">(보유 시 입력)</span>
                  </Label>
                  <Input
                    id="hazmatLicenseNo"
                    value={hazmatLicenseNo}
                    onChange={e => setHazmatLicenseNo(e.target.value)}
                    placeholder="예: 제2024-경기-판매-0001호"
                    className="text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    허가번호가 없는 경우 유해화학물질 판매 입찰이 제한될 수 있습니다.
                  </p>
                </div>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hazmatCompliance}
                    onChange={e => setHazmatCompliance(e.target.checked)}
                    className="h-4 w-4 accent-primary mt-0.5"
                  />
                  <span className="text-xs text-muted-foreground leading-snug">
                    <span className="font-semibold text-foreground">[필수] 화관법·화평법 준수 선언</span><br />
                    본인(회사)은 유해화학물질관리법, 화학물질의 등록 및 평가 등에 관한 법률 등 관련 법령을 준수하며,
                    위반으로 발생하는 모든 법적 책임이 당사에 귀속됨에 동의합니다.
                    또한 납품 시 SDS(물질안전보건자료)를 구매자에게 제공할 의무가 있음을 확인합니다.
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* 이메일 */}
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="contact@company.com"
              required
              autoComplete="email"
              value={emailValue}
              onChange={e => setEmailValue(e.target.value)}
            />
            {emailIsPersonal && (
              <p className="text-xs text-amber-600">
                개인 이메일(gmail·naver 등)은 사업자등록증 첨부 후 24시간 내 심사를 거칩니다.
              </p>
            )}
            {emailValue && !emailIsPersonal && (
              <p className="text-xs text-primary">✓ 회사 이메일 — 가입 즉시 입찰 가능합니다.</p>
            )}
          </div>

          {/* 사업자등록증 첨부 (개인 이메일 시에만 표시) */}
          {emailIsPersonal && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 space-y-2">
              <Label htmlFor="bizDoc" className="text-sm font-semibold text-amber-800">
                사업자등록증 첨부 <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-amber-700 leading-relaxed">
                개인 이메일 사용 시 사업자등록증으로 본인을 확인합니다.
                서류는 심사 담당자에게 이메일로 전달되며 서버에 저장되지 않습니다.
              </p>
              <input
                id="bizDoc"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
                required={emailIsPersonal}
                className="block w-full text-sm text-gray-700 file:mr-3 file:rounded file:border-0 file:bg-amber-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-amber-700 hover:file:bg-amber-200 cursor-pointer"
                onChange={e => setBizDoc(e.target.files?.[0] ?? null)}
              />
              {bizDoc && (
                <p className="text-xs text-primary">✓ {bizDoc.name} ({(bizDoc.size / 1024).toFixed(0)} KB)</p>
              )}
            </div>
          )}

          {/* 비밀번호 */}
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">비밀번호 확인</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
            />
          </div>

          <PrivacyConsent values={consent} onChange={setConsent} role="supplier" />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '처리 중...' : '베타 참여 신청'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-primary hover:underline">
            로그인
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          연구자이신가요?{' '}
          <Link href="/signup/researcher" className="text-primary hover:underline">
            연구자 가입
          </Link>
        </p>
      </div>
    </div>
  )
}
