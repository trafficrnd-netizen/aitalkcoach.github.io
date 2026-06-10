'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { signupSupplier } from '@/lib/actions/auth'
import { isInstitutionalEmail, INSTITUTIONAL_EMAIL_ERROR } from '@/lib/email-validation'
import { PrivacyConsent } from '@/components/privacy-consent'
import { PhoneVerify } from '@/components/phone-verify'
import { AlertTriangle, MailCheck, Gift, Globe2, FlaskConical, Wrench } from 'lucide-react'
import { useT } from '@/lib/i18n/context'

const CATEGORY_VALUES = ['reagent', 'consumable', 'equipment', 'bio', 'safety', 'other'] as const

type Origin = 'domestic' | 'overseas'
type SupplyType = 'chemical' | 'equipment' | ''
type OrType = 'only_representative' | 'korea_branch' | ''

export default function SupplierSignupPage() {
  const router = useRouter()
  const t = useT()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 국내/해외 + 해외 세부
  const [origin, setOrigin] = useState<Origin>('domestic')
  const [supplyType, setSupplyType] = useState<SupplyType>('')
  const [country, setCountry] = useState('')
  const [orType, setOrType] = useState<OrType>('')
  const [orCompanyName, setOrCompanyName] = useState('')
  const [equipmentHasChemicals, setEquipmentHasChemicals] = useState(false)
  const [kcAck, setKcAck] = useState(false)
  const [chemCompliance, setChemCompliance] = useState(false)
  const [overseasBizId, setOverseasBizId] = useState('') // 해외 장비(무화학) 자국 등록번호

  // 한국 사업자번호 (국내 본사 / 해외 OR·한국지사)
  const [businessNumber, setBusinessNumber] = useState('')
  const [bizVerified, setBizVerified] = useState<'idle' | 'loading' | 'ok' | 'fail'>('idle')
  const [bizMessage, setBizMessage] = useState('')

  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [handlesHazmat, setHandlesHazmat] = useState(false)
  const [hazmatLicenseNo, setHazmatLicenseNo] = useState('')
  const [hazmatCompliance, setHazmatCompliance] = useState(false)
  const [consent, setConsent] = useState({ terms: false, privacy: false, thirdParty: false, marketing: false })
  const [verifiedPhone, setVerifiedPhone] = useState('')
  const [overseasPhone, setOverseasPhone] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')
  const [referralCode, setReferralCode] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) setReferralCode(ref.trim().toUpperCase())
  }, [])

  // 한국 사업자번호 검증이 필요한 경우
  const needsKoreanBiz =
    origin === 'domestic' ||
    (origin === 'overseas' && supplyType === 'chemical') ||
    (origin === 'overseas' && supplyType === 'equipment' && equipmentHasChemicals)

  // 화합물 규제(유일대리인/한국지사) 대상 여부
  const isChemicalRegulated =
    origin === 'overseas' &&
    (supplyType === 'chemical' || (supplyType === 'equipment' && equipmentHasChemicals))

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
      setError(t('err.agreeRequired'))
      return
    }

    // 해외 공급 유형 검증
    if (origin === 'overseas') {
      if (!supplyType) { setError(t('err.overseasSupplyType')); return }
      if (!country.trim()) { setError(t('err.overseasCountry')); return }
      if (isChemicalRegulated && !chemCompliance) { setError(t('err.overseasChemCompliance')); return }
      if (supplyType === 'equipment' && !kcAck) { setError(t('err.overseasKcAck')); return }
    }

    // 한국 사업자번호 검증 필요 시
    if (needsKoreanBiz && bizVerified !== 'ok') {
      setError(origin === 'overseas' ? t('err.overseasAgentBizNo') : t('err.bizRequired'))
      return
    }

    if (selectedCategories.length === 0) {
      setError(t('err.categoryRequired'))
      return
    }

    // 국내 유해화학물질
    if (origin === 'domestic' && handlesHazmat && !hazmatCompliance) {
      setError(t('err.hazmatCompliance'))
      return
    }

    // 전화 인증: 국내는 OTP 필수, 해외는 일반 연락처
    if (origin === 'domestic' && !verifiedPhone) {
      setError(t('err.phoneRequired'))
      return
    }

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    if (!isInstitutionalEmail(email)) {
      setError(INSTITUTIONAL_EMAIL_ERROR)
      setLoading(false)
      return
    }

    const password = formData.get('password') as string
    const confirm = formData.get('confirmPassword') as string
    if (password !== confirm) {
      setError(t('err.passwordMismatch'))
      return
    }

    // 사업자번호 결정: 한국 검증번호 우선, 아니면 해외 자국번호
    const finalBizNumber = needsKoreanBiz ? businessNumber : overseasBizId

    selectedCategories.forEach(c => formData.append('categories', c))
    formData.set('businessNumber', finalBizNumber)
    formData.set('origin', origin)
    formData.set('handlesHazmat', origin === 'domestic' && handlesHazmat ? 'true' : 'false')
    formData.set('hazmatLicenseNo', hazmatLicenseNo.trim())
    formData.set('thirdPartyConsent', consent.thirdParty ? 'true' : 'false')
    formData.set('marketingConsent', consent.marketing ? 'true' : 'false')
    formData.set('contactPhone', origin === 'domestic' ? verifiedPhone : overseasPhone)
    formData.set('referralCode', referralCode)

    // 해외 필드
    if (origin === 'overseas') {
      formData.set('overseasSupplyType', supplyType)
      formData.set('country', country.trim())
      formData.set('equipmentHasChemicals', equipmentHasChemicals ? 'true' : 'false')
      formData.set('kcCertAcknowledged', kcAck ? 'true' : 'false')
      if (isChemicalRegulated) {
        formData.set('orType', orType)
        formData.set('orCompanyName', orCompanyName.trim())
        formData.set('orBusinessNumber', businessNumber)
      }
    }

    setLoading(true)
    const result = await signupSupplier(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    if (result?.emailPending) {
      setPendingEmail(result.email ?? '')
      setLoading(false)
      return
    }
    router.push('/supplier')
    router.refresh()
  }

  // 이메일 인증 대기 화면
  if (pendingEmail) {
    return (
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-8 text-center space-y-4">
          <MailCheck className="h-12 w-12 text-primary mx-auto" />
          <div>
            <h2 className="text-xl font-bold mb-1">{t('pending.title')}</h2>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{pendingEmail}</span>{t('pending.sentTo')}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">{t('pending.clickLink')}</p>
          <p className="text-xs text-muted-foreground">{t('pending.checkSpam')}</p>
          <Link href="/login" className="block">
            <Button variant="outline" className="w-full">{t('pending.toLogin')}</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-lg border border-border bg-background p-8 shadow-sm">
        <h1 className="text-2xl font-bold mb-1">{t('ss.title')}</h1>
        <p className="text-sm text-muted-foreground mb-1">{t('ss.subtitle')}</p>
        <p className="text-xs text-amber-600 mb-6">{t('ss.emailNote')}</p>

        {referralCode && (
          <div className="mb-6 flex items-center gap-2 rounded-md border border-accent/40 bg-accent/10 px-3 py-2.5">
            <Gift className="h-4 w-4 shrink-0 text-accent-foreground" />
            <p className="text-xs text-accent-foreground">
              {t('ref.applied')} <span className="font-mono font-bold">{referralCode}</span> {t('ref.appliedSuffix')}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="referralCode" value={referralCode} />

          {/* 사업자 소재지 (국내/해외) */}
          <div className="space-y-2">
            <Label>{t('origin.label')} <span className="text-destructive">*</span></Label>
            <div className="grid grid-cols-2 gap-2">
              {(['domestic', 'overseas'] as Origin[]).map(o => (
                <button
                  type="button"
                  key={o}
                  onClick={() => { setOrigin(o); setBizVerified('idle'); setBizMessage('') }}
                  className={`rounded-lg border p-3 text-left transition ${
                    origin === o ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-sm font-semibold">
                    {o === 'overseas' && <Globe2 className="h-3.5 w-3.5" />}
                    {t(`origin.${o}`)}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{t(`origin.${o}Desc`)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 회사명 */}
          <div className="space-y-2">
            <Label htmlFor="companyName">{t('ss.companyName')}</Label>
            <Input id="companyName" name="companyName" placeholder={t('ss.companyNamePlaceholder')} required />
          </div>

          {/* ── 해외 공급자 전용 블록 ───────────────────────────── */}
          {origin === 'overseas' && (
            <>
              {/* 본사 국가 */}
              <div className="space-y-2">
                <Label htmlFor="country">{t('ov.country')} <span className="text-destructive">*</span></Label>
                <Input id="country" value={country} onChange={e => setCountry(e.target.value)} placeholder={t('ov.countryPlaceholder')} />
              </div>

              {/* 공급 유형 */}
              <div className="space-y-2">
                <Label>{t('ov.supplyType')} <span className="text-destructive">*</span></Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSupplyType('chemical')}
                    className={`rounded-lg border p-3 text-left transition ${
                      supplyType === 'chemical' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-sm font-semibold">
                      <FlaskConical className="h-3.5 w-3.5" />{t('ov.supplyChemical')}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{t('ov.supplyChemicalDesc')}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSupplyType('equipment')}
                    className={`rounded-lg border p-3 text-left transition ${
                      supplyType === 'equipment' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-sm font-semibold">
                      <Wrench className="h-3.5 w-3.5" />{t('ov.supplyEquipment')}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{t('ov.supplyEquipmentDesc')}</div>
                  </button>
                </div>
              </div>

              {/* 장비: 화학물질 내장 여부 */}
              {supplyType === 'equipment' && (
                <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={equipmentHasChemicals}
                      onChange={e => { setEquipmentHasChemicals(e.target.checked); setBizVerified('idle') }}
                      className="h-4 w-4 accent-primary mt-0.5"
                    />
                    <span className="text-sm">{t('ov.equipHasChem')}</span>
                  </label>
                  {equipmentHasChemicals && (
                    <p className="text-[11px] text-amber-600 leading-snug pl-6">{t('ov.equipHasChemNotice')}</p>
                  )}
                  {/* KC 인증 책임 안내 */}
                  <div className="flex items-start gap-2 border-t border-border/60 pt-3">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      <span className="font-semibold text-foreground">{t('ov.equipTitle')}</span><br />
                      {t('ov.equipKcNotice')}
                    </p>
                  </div>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={kcAck} onChange={e => setKcAck(e.target.checked)} className="h-4 w-4 accent-primary mt-0.5" />
                    <span className="text-xs text-muted-foreground leading-snug">{t('ov.equipKcAck')}</span>
                  </label>
                </div>
              )}

              {/* 화합물 규제: 유일대리인/한국지사 */}
              {isChemicalRegulated && (
                <div className="rounded-lg border border-amber-300 bg-amber-50/60 p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <FlaskConical className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      <span className="font-semibold text-foreground">{t('ov.chemTitle')}</span><br />
                      {t('ov.chemNotice')}
                    </p>
                  </div>

                  {/* 대리 형태 */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t('ov.chemAgentType')} <span className="text-destructive">*</span></Label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['only_representative', 'korea_branch'] as OrType[]).map(ot => (
                        <button
                          type="button"
                          key={ot}
                          onClick={() => setOrType(ot)}
                          className={`rounded-md border px-2 py-1.5 text-xs font-medium transition ${
                            orType === ot ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-muted/50'
                          }`}
                        >
                          {ot === 'only_representative' ? t('ov.chemOnlyRep') : t('ov.chemKoreaBranch')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 대리인/한국지사명 */}
                  <div className="space-y-1">
                    <Label htmlFor="orCompanyName" className="text-xs">{t('ov.chemAgentName')}</Label>
                    <Input id="orCompanyName" value={orCompanyName} onChange={e => setOrCompanyName(e.target.value)} placeholder={t('ov.chemAgentNamePlaceholder')} className="text-sm" />
                  </div>

                  {/* 화평법·화관법 준수 선언 */}
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={chemCompliance} onChange={e => setChemCompliance(e.target.checked)} className="h-4 w-4 accent-primary mt-0.5" />
                    <span className="text-[11px] text-muted-foreground leading-snug">{t('ov.chemCompliance')}</span>
                  </label>
                </div>
              )}
            </>
          )}

          {/* 사업자번호 — 한국 검증 필요 시 */}
          {needsKoreanBiz ? (
            <div className="space-y-2">
              <Label htmlFor="businessNumber">
                {origin === 'overseas' ? t('ov.chemAgentBizNo') : t('ss.businessNumber')}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="businessNumber"
                  value={businessNumber}
                  onChange={e => { setBusinessNumber(formatBusinessNumber(e.target.value)); setBizVerified('idle') }}
                  placeholder="000-00-00000"
                  maxLength={12}
                  required
                />
                <Button type="button" variant="outline" onClick={verifyBusiness}
                  disabled={businessNumber.replace(/-/g, '').length !== 10 || bizVerified === 'loading'} className="shrink-0">
                  {bizVerified === 'loading' ? t('common.verifying') : t('common.verify')}
                </Button>
              </div>
              {bizMessage && (
                <p className={`text-xs ${bizVerified === 'ok' ? 'text-primary' : 'text-destructive'}`}>
                  {bizVerified === 'ok' ? '✓ ' : '✗ '}{bizMessage}
                </p>
              )}
            </div>
          ) : origin === 'overseas' ? (
            // 해외 장비(무화학): 자국 등록번호
            <div className="space-y-2">
              <Label htmlFor="overseasBizId">{t('ss.businessNumber')} ({t('ov.country')})</Label>
              <Input id="overseasBizId" value={overseasBizId} onChange={e => setOverseasBizId(e.target.value)} placeholder="e.g., EU VAT / EIN / Reg. No." required />
            </div>
          ) : null}

          {/* 대표자명 */}
          <div className="space-y-2">
            <Label htmlFor="representative">{t('ss.representative')}</Label>
            <Input id="representative" name="representative" placeholder={t('ss.representativePlaceholder')} />
          </div>

          {/* 주소 */}
          <div className="space-y-2">
            <Label htmlFor="address">{t('ss.address')}</Label>
            <Input id="address" name="address" placeholder={t('ss.addressPlaceholder')} />
          </div>

          {/* 대표 전화 */}
          <div className="space-y-2">
            <Label htmlFor="phone">{t('ss.phone')}</Label>
            <Input id="phone" name="phone" type="tel" placeholder="02-0000-0000" />
          </div>

          {/* 담당자명 */}
          <div className="space-y-2">
            <Label htmlFor="contactName">{t('ss.contactName')} <span className="text-destructive">*</span></Label>
            <Input id="contactName" name="contactName" placeholder={t('ss.representativePlaceholder')} required />
          </div>

          {/* 담당자 연락처 — 국내 OTP / 해외 일반 */}
          {origin === 'domestic' ? (
            <PhoneVerify onVerified={setVerifiedPhone} label={t('ss.contactPhoneLabel')} />
          ) : (
            <div className="space-y-2">
              <Label htmlFor="overseasPhone">{t('ss.contactName')} — Phone</Label>
              <Input id="overseasPhone" value={overseasPhone} onChange={e => setOverseasPhone(e.target.value)} type="tel" placeholder="+1 555 000 0000" />
            </div>
          )}

          {/* 취급 카테고리 */}
          <div className="space-y-2">
            <Label>{t('ss.categories')} <span className="text-destructive">*</span></Label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORY_VALUES.map(value => (
                <div key={value} className="flex items-center gap-2">
                  <Checkbox id={`cat-${value}`} checked={selectedCategories.includes(value)} onCheckedChange={() => toggleCategory(value)} />
                  <label htmlFor={`cat-${value}`} className="text-sm cursor-pointer">{t(`cat.${value}`)}</label>
                </div>
              ))}
            </div>
          </div>

          {/* 국내 유해화학물질 (화관법) */}
          {origin === 'domestic' && (
            <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-snug">
                  <span className="font-semibold text-foreground">{t('hazmat.title')}</span><br />
                  {t('hazmat.notice')}
                </p>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={handlesHazmat}
                  onChange={e => { setHandlesHazmat(e.target.checked); if (!e.target.checked) { setHazmatLicenseNo(''); setHazmatCompliance(false) } }}
                  className="h-4 w-4 accent-primary" />
                <span className="text-sm">{t('hazmat.handles')}</span>
              </label>
              {handlesHazmat && (
                <div className="space-y-3 pl-6">
                  <div className="space-y-1">
                    <Label htmlFor="hazmatLicenseNo" className="text-xs">
                      {t('hazmat.licenseNo')} <span className="text-muted-foreground">{t('hazmat.licenseNoHint')}</span>
                    </Label>
                    <Input id="hazmatLicenseNo" value={hazmatLicenseNo} onChange={e => setHazmatLicenseNo(e.target.value)} placeholder={t('hazmat.licenseNoPlaceholder')} className="text-sm" />
                    <p className="text-[11px] text-muted-foreground">{t('hazmat.noLicenseWarn')}</p>
                  </div>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={hazmatCompliance} onChange={e => setHazmatCompliance(e.target.checked)} className="h-4 w-4 accent-primary mt-0.5" />
                    <span className="text-xs text-muted-foreground leading-snug">
                      <span className="font-semibold text-foreground">{t('hazmat.complianceTitle')}</span><br />
                      {t('hazmat.compliance')}
                    </span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* 이메일 */}
          <div className="space-y-2">
            <Label htmlFor="email">{t('common.email')}</Label>
            <Input id="email" name="email" type="email" placeholder="contact@company.com" required autoComplete="email" />
          </div>

          {/* 비밀번호 */}
          <div className="space-y-2">
            <Label htmlFor="password">{t('common.password')}</Label>
            <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('common.confirmPassword')}</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" required autoComplete="new-password" />
          </div>

          <PrivacyConsent values={consent} onChange={setConsent} role="supplier" />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('common.processing') : t('ss.submit')}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t('ss.haveAccount')}{' '}
          <Link href="/login" className="text-primary hover:underline">{t('common.login')}</Link>
        </p>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {t('ss.areYouResearcher')}{' '}
          <Link href="/signup/researcher" className="text-primary hover:underline">{t('login.signupResearcher')}</Link>
        </p>
      </div>
    </div>
  )
}
