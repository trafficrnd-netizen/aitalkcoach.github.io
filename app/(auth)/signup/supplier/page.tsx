'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { signupSupplier } from '@/lib/actions/auth'
import { PrivacyConsent } from '@/components/privacy-consent'
import { PhoneVerify } from '@/components/phone-verify'
import {
  AlertTriangle, MailCheck, Gift, Globe2, FlaskConical, Wrench,
  CheckCircle2, XCircle, ExternalLink, ShieldCheck, Loader2,
} from 'lucide-react'
import { useT } from '@/lib/i18n/context'
import {
  getRegulations, COUNTRY_MAP,
  type CountryCode, type CountryRegulation,
} from '@/lib/country-regulations'
import { cn } from '@/lib/utils'
import type { VerifyResult } from '@/app/api/verify-permit/route'

const CATEGORY_VALUES = ['reagent', 'consumable', 'equipment', 'bio', 'safety', 'other'] as const

// 가입 폼 국가 표시 순서
const COUNTRY_ORDER: CountryCode[] = ['US', 'CN', 'EU', 'JP', 'OTHER']
const OVERSEAS_COUNTRIES = COUNTRY_ORDER.map(code => COUNTRY_MAP[code]).filter(Boolean)

type Origin = 'domestic' | 'overseas'
type SupplyType = 'chemical' | 'equipment'
type OrType = 'only_representative' | 'korea_branch' | ''

const VERIFY_BADGE_CLASS: Record<string, string> = {
  full:    'text-green-700 bg-green-50 border-green-200',
  partial: 'text-amber-700 bg-amber-50 border-amber-200',
  none:    'text-red-700 bg-red-50 border-red-200',
}

const VERIFY_TEXT_KEY: Record<string, string> = {
  full:    'reg.verifyFull',
  partial: 'reg.verifyPartial',
  none:    'reg.verifyNone',
}

// ─── 온라인 확인 결과 뱃지 ─────────────────────────────────────────────────
function VerifyBadge({ result }: { result: VerifyResult }) {
  const colorClass =
    result.status === 'valid'     ? 'text-green-700' :
    result.status === 'not_found' ? 'text-red-700' :
    result.status === 'invalid'   ? 'text-red-700' :
    result.status === 'link'      ? 'text-amber-700' :
    'text-muted-foreground'

  const Icon =
    result.status === 'valid'                       ? CheckCircle2 :
    result.status === 'not_found' || result.status === 'invalid' ? XCircle :
    ExternalLink

  return (
    <div className={cn('flex items-start gap-1.5 text-[11px] mt-1', colorClass)}>
      <Icon className="h-3.5 w-3.5 shrink-0 mt-0.5" />
      <span className="leading-snug">
        {result.message}
        {result.url && (
          <>
            {' '}
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline inline-flex items-center gap-0.5"
            >
              직접 확인 <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </>
        )}
      </span>
    </div>
  )
}

// ─── 규제 체크리스트 ────────────────────────────────────────────────────────
function RegulationChecklist({
  regulations,
  acks,
  permitNos,
  files,
  onAckChange,
  onPermitNoChange,
  onFileChange,
}: {
  regulations: CountryRegulation[]
  acks: Record<string, boolean>
  permitNos: Record<string, string>
  files: Record<string, File>
  onAckChange: (id: string, checked: boolean) => void
  onPermitNoChange: (id: string, value: string) => void
  onFileChange: (id: string, file: File | null) => void
}) {
  const t = useT()
  const [verifyResults, setVerifyResults] = useState<Record<string, VerifyResult>>({})
  const [verifyLoading, setVerifyLoading] = useState<Record<string, boolean>>({})

  async function handleVerify(regId: string) {
    const value = permitNos[regId] ?? ''
    if (!value.trim()) return
    setVerifyLoading(prev => ({ ...prev, [regId]: true }))
    try {
      const res = await fetch('/api/verify-permit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regType: regId, value: value.trim() }),
      })
      const data: VerifyResult = await res.json()
      setVerifyResults(prev => ({ ...prev, [regId]: data }))
    } catch {
      setVerifyResults(prev => ({
        ...prev,
        [regId]: { status: 'error', message: '네트워크 오류. 잠시 후 다시 시도해주세요.' },
      }))
    } finally {
      setVerifyLoading(prev => ({ ...prev, [regId]: false }))
    }
  }

  if (regulations.length === 0) return null
  return (
    <div className="space-y-3">
      {regulations.map(reg => (
        <div key={reg.id} className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
          {/* 헤더: 규제명 + 원문 병기 + 온라인조회 배지 */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold">{reg.nameKo}</span>
              {reg.nativeTerm && (
                <span className="text-[10px] text-muted-foreground/70 font-normal">
                  / {reg.nativeTerm}
                </span>
              )}
              <span className={cn(
                'inline-flex items-center gap-1 text-[10px] font-medium border rounded px-1.5 py-0.5',
                VERIFY_BADGE_CLASS[reg.onlineVerify.level]
              )}>
                {reg.onlineVerify.level === 'full'    && <CheckCircle2 className="h-2.5 w-2.5" />}
                {reg.onlineVerify.level === 'partial' && <AlertTriangle className="h-2.5 w-2.5" />}
                {reg.onlineVerify.level === 'none'    && <XCircle className="h-2.5 w-2.5" />}
                {t(VERIFY_TEXT_KEY[reg.onlineVerify.level])}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {reg.nameEn}
              {' · '}
              {reg.authorityUrl ? (
                <a href={reg.authorityUrl} target="_blank" rel="noopener noreferrer"
                  className="underline inline-flex items-center gap-0.5">
                  {reg.authority}<ExternalLink className="h-2.5 w-2.5" />
                </a>
              ) : reg.authority}
            </div>
          </div>

          {/* 설명 */}
          <p className="text-xs text-muted-foreground leading-relaxed">{reg.description}</p>

          {/* 온라인 조회 안내 */}
          <div className="text-[11px] text-muted-foreground">
            {'\u{1F4CB}'}{' '}
            {reg.onlineVerify.url ? (
              <a href={reg.onlineVerify.url} target="_blank" rel="noopener noreferrer" className="underline">
                {reg.onlineVerify.note}
              </a>
            ) : reg.onlineVerify.note}
          </div>

          {/* 허가번호 입력 + 온라인 확인 버튼 (level=full인 경우) */}
          {reg.permitNumberLabel && (
            <div className="space-y-1.5">
              <Label className="text-xs">
                {reg.permitNumberLabel}{' '}
                <span className="text-muted-foreground">{t('reg.ifApplicable')}</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  value={permitNos[reg.id] ?? ''}
                  onChange={e => {
                    onPermitNoChange(reg.id, e.target.value)
                    // 값 바뀌면 이전 결과 초기화
                    if (verifyResults[reg.id]) {
                      setVerifyResults(prev => {
                        const next = { ...prev }
                        delete next[reg.id]
                        return next
                      })
                    }
                  }}
                  placeholder={reg.permitNumberPh}
                  className="text-sm h-8 flex-1"
                />
                {reg.onlineVerify.level === 'full' && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="shrink-0 h-8 text-xs px-2.5"
                    disabled={!(permitNos[reg.id] ?? '').trim() || verifyLoading[reg.id]}
                    onClick={() => handleVerify(reg.id)}
                  >
                    {verifyLoading[reg.id]
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : '온라인 확인'}
                  </Button>
                )}
              </div>
              {verifyResults[reg.id] && <VerifyBadge result={verifyResults[reg.id]} />}
            </div>
          )}

          {/* 서류 업로드 */}
          {reg.uploadLabel && (
            <div className="space-y-1.5">
              <Label className="text-xs flex flex-wrap items-center gap-1">
                <span>📎</span>
                <span className="font-medium text-foreground">{t('reg.uploadNow')}</span>
                <span className="text-muted-foreground font-normal">— {reg.uploadLabel}</span>
              </Label>
              <input
                type="file"
                name={`permit_file_${reg.id}`}
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={e => {
                  const file = e.target.files?.[0] ?? null
                  onFileChange(reg.id, file)
                }}
                className="block w-full text-xs text-muted-foreground cursor-pointer file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-muted file:text-foreground hover:file:bg-muted/80 file:cursor-pointer"
              />
              {files[reg.id] ? (
                <p className="text-[10px] text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />{files[reg.id].name}
                </p>
              ) : (
                <p className="text-[10px] text-muted-foreground/60">{t('reg.uploadAccept')}</p>
              )}
            </div>
          )}

          {/* 필수 동의 */}
          {reg.requiredAck && (
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={acks[reg.id] ?? false}
                onChange={e => onAckChange(reg.id, e.target.checked)}
                className="h-4 w-4 accent-primary mt-0.5"
              />
              <span className="text-xs text-muted-foreground leading-snug">
                <span className="font-semibold text-foreground">{t('reg.required')}</span>{' '}
                {t('reg.ackDeclaration')}
              </span>
            </label>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── 메인 페이지 ────────────────────────────────────────────────────────────
export default function SupplierSignupPage() {
  const router = useRouter()
  const t = useT()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [origin, setOrigin] = useState<Origin>('domestic')
  const [supplyTypes, setSupplyTypes] = useState<SupplyType[]>([])
  const [countryCode, setCountryCode] = useState<CountryCode | ''>('')
  const [orType, setOrType] = useState<OrType>('')
  const [orCompanyName, setOrCompanyName] = useState('')

  const [regulationAcks, setRegulationAcks] = useState<Record<string, boolean>>({})
  const [regulationPermitNos, setRegulationPermitNos] = useState<Record<string, string>>({})
  const [regulationFiles, setRegulationFiles] = useState<Record<string, File>>({})

  const [businessNumber, setBusinessNumber] = useState('')
  const [bizVerified, setBizVerified] = useState<'idle' | 'loading' | 'ok' | 'fail'>('idle')
  const [bizMessage, setBizMessage] = useState('')
  const [overseasBizId, setOverseasBizId] = useState('')

  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [consent, setConsent] = useState({ terms: false, privacy: false, thirdParty: false, marketing: false })
  const [verifiedPhone, setVerifiedPhone] = useState('')
  const [overseasPhone, setOverseasPhone] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')
  const [referralCode, setReferralCode] = useState('')

  // 레퍼럴 코드 파싱
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) setReferralCode(ref.trim().toUpperCase())
  }, [])

  // ── 보안: F12 / DevTools 차단, 우클릭 방지 ───────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey

      // F12 → DevTools
      if (e.key === 'F12') { e.preventDefault(); e.stopPropagation(); return }

      // Ctrl/Cmd + Shift + I / J / C → DevTools / Console / Inspector
      if (ctrl && e.shiftKey && ['i', 'j', 'c', 'I', 'J', 'C'].includes(e.key)) {
        e.preventDefault(); e.stopPropagation(); return
      }

      // Ctrl/Cmd + U → 소스 보기
      if (ctrl && e.key.toLowerCase() === 'u') { e.preventDefault(); e.stopPropagation(); return }

      // Ctrl/Cmd + S → 저장
      if (ctrl && e.key.toLowerCase() === 's') { e.preventDefault(); e.stopPropagation(); return }

      // 복사(C), 붙여넣기(V), 잘라내기(X), 전체선택(A), 실행취소(Z), 다시실행(Y)은 허용
      // 그 외 Ctrl 조합은 차단 (단, 일반 입력키 + Ctrl 조합)
      if (ctrl && !e.shiftKey) {
        const allowed = ['c', 'v', 'x', 'a', 'z', 'y', 'C', 'V', 'X', 'A', 'Z', 'Y']
        if (!allowed.includes(e.key) && !['Tab', 'Enter', 'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.preventDefault()
        }
      }
    }

    // 우클릭 컨텍스트 메뉴 차단 (Inspect Element 접근 방지)
    const handleContext = (e: MouseEvent) => { e.preventDefault() }

    window.addEventListener('keydown', handleKey, true)
    document.addEventListener('contextmenu', handleContext)

    return () => {
      window.removeEventListener('keydown', handleKey, true)
      document.removeEventListener('contextmenu', handleContext)
    }
  }, [])

  const effectiveCountryCode: CountryCode | '' = origin === 'domestic' ? 'KR' : countryCode
  const isOverseasChemical = origin === 'overseas' && supplyTypes.includes('chemical')
  const needsKoreanBiz = origin === 'domestic' || isOverseasChemical

  const isBothTypes = supplyTypes.includes('chemical') && supplyTypes.includes('equipment')
  const effectiveRegType: 'chemical' | 'equipment' | 'both' | '' =
    isBothTypes ? 'both' : (supplyTypes[0] ?? '')

  const currentRegs: CountryRegulation[] = effectiveCountryCode && effectiveRegType
    ? getRegulations(effectiveCountryCode as CountryCode, effectiveRegType as 'chemical' | 'equipment' | 'both')
    : []

  function toggleSupplyType(st: SupplyType) {
    setSupplyTypes(prev =>
      prev.includes(st) ? prev.filter(t => t !== st) : [...prev, st]
    )
  }

  // 국가/유형 변경 시 규제 상태 초기화
  useEffect(() => {
    setRegulationAcks({})
    setRegulationPermitNos({})
    setRegulationFiles({})
  }, [effectiveCountryCode, supplyTypes.join(',')])

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

    if (!consent.terms || !consent.privacy) { setError(t('err.agreeRequired')); return }
    if (supplyTypes.length === 0) { setError('공급 유형(화학물질 / 장비)을 하나 이상 선택해주세요.'); return }

    if (origin === 'overseas') {
      if (!countryCode) { setError('본사 소재 국가를 선택해주세요.'); return }
      if (isOverseasChemical && !orType) { setError('유일대리인 또는 한국지사 유형을 선택해주세요.'); return }
    }

    if (needsKoreanBiz && bizVerified !== 'ok') {
      setError(origin === 'overseas' ? t('err.overseasAgentBizNo') : t('err.bizRequired'))
      return
    }

    const unacknowledged = currentRegs.filter(r => r.requiredAck && !regulationAcks[r.id])
    if (unacknowledged.length > 0) {
      setError(`필수 규제 준수 선언을 모두 체크해주세요: ${unacknowledged.map(r => r.nameKo).join(', ')}`)
      return
    }

    if (selectedCategories.length === 0) { setError(t('err.categoryRequired')); return }
    if (origin === 'domestic' && !verifiedPhone) { setError(t('err.phoneRequired')); return }

    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string
    const confirm = formData.get('confirmPassword') as string
    if (password !== confirm) { setError(t('err.passwordMismatch')); return }

    const finalBizNumber = needsKoreanBiz ? businessNumber : overseasBizId

    selectedCategories.forEach(c => formData.append('categories', c))
    formData.set('businessNumber', finalBizNumber)
    formData.set('origin', origin)
    formData.set('supplyType', supplyTypes.join(','))
    formData.set('country_code', effectiveCountryCode || '')
    formData.set('regulation_acks', JSON.stringify(regulationAcks))
    formData.set('regulation_permit_numbers', JSON.stringify(regulationPermitNos))
    formData.set('thirdPartyConsent', consent.thirdParty ? 'true' : 'false')
    formData.set('marketingConsent', consent.marketing ? 'true' : 'false')
    formData.set('contactPhone', origin === 'domestic' ? verifiedPhone : overseasPhone)
    formData.set('referralCode', referralCode)
    formData.set('handlesHazmat', regulationAcks['KR_HWAGWAN'] ? 'true' : 'false')
    formData.set('hazmatLicenseNo', regulationPermitNos['KR_HWAGWAN'] ?? '')

    // React state의 파일을 FormData에 명시적 추가
    Object.entries(regulationFiles).forEach(([regId, file]) => {
      formData.set(`permit_file_${regId}`, file, file.name)
    })

    if (origin === 'overseas') {
      formData.set('overseasSupplyType', supplyTypes.join(','))
      formData.set('country', effectiveCountryCode || '')
      if (isOverseasChemical) {
        formData.set('orType', orType)
        formData.set('orCompanyName', orCompanyName.trim())
        formData.set('orBusinessNumber', businessNumber)
      }
    }

    setLoading(true)
    const result = await signupSupplier(formData)

    if (result?.error) { setError(result.error); setLoading(false); return }
    if (result?.emailPending) { setPendingEmail(result.email ?? ''); setLoading(false); return }
    router.push('/supplier')
    router.refresh()
  }

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

          {/* 소재지 */}
          <div className="space-y-2">
            <Label>{t('origin.label')} <span className="text-destructive">*</span></Label>
            <div className="grid grid-cols-2 gap-2">
              {(['domestic', 'overseas'] as Origin[]).map(o => (
                <button
                  type="button" key={o}
                  onClick={() => { setOrigin(o); setBizVerified('idle'); setBizMessage(''); setCountryCode(''); setSupplyTypes([]) }}
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

          {/* 해외: 국가 선택 (US → CN → EU → JP → 기타) */}
          {origin === 'overseas' && (
            <div className="space-y-2">
              <Label>{t('ov.country')} <span className="text-destructive">*</span></Label>
              <div className="grid grid-cols-3 gap-2">
                {OVERSEAS_COUNTRIES.map(c => (
                  <button
                    key={c.code} type="button"
                    onClick={() => setCountryCode(c.code)}
                    className={cn(
                      'rounded-lg border px-3 py-2.5 text-left transition',
                      countryCode === c.code ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-muted/50'
                    )}
                  >
                    <div className="text-xl">{c.flag}</div>
                    <div className="text-xs font-medium mt-0.5 leading-tight">{c.nameKo}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 공급 유형 */}
          <div className="space-y-2">
            <Label>
              {t('ov.supplyType')} <span className="text-destructive">*</span>
              <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">(복수 선택 가능)</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {(['chemical', 'equipment'] as SupplyType[]).map(st => {
                const selected = supplyTypes.includes(st)
                return (
                  <button
                    key={st} type="button"
                    onClick={() => toggleSupplyType(st)}
                    className={`rounded-lg border p-3 text-left transition ${
                      selected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-sm font-semibold">
                      {st === 'chemical' ? <FlaskConical className="h-3.5 w-3.5" /> : <Wrench className="h-3.5 w-3.5" />}
                      {t(st === 'chemical' ? 'ov.supplyChemical' : 'ov.supplyEquipment')}
                      {selected && <CheckCircle2 className="h-3.5 w-3.5 ml-auto text-primary" />}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t(st === 'chemical' ? 'ov.supplyChemicalDesc' : 'ov.supplyEquipmentDesc')}
                    </div>
                  </button>
                )
              })}
            </div>
            {isBothTypes && (
              <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-[11px] text-primary flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                화학물질과 장비를 모두 공급하는 사업자로 등록됩니다. 두 유형의 규제 요건이 모두 적용됩니다.
              </div>
            )}
          </div>

          {/* 해외 화학 공급자: 유일대리인/한국지사 */}
          {isOverseasChemical && (
            <div className="rounded-lg border border-amber-300 bg-amber-50/60 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <FlaskConical className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-snug">
                  <span className="font-semibold text-foreground">{t('ov.chemTitle')}</span><br />
                  {t('ov.chemNotice')}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('ov.chemAgentType')} <span className="text-destructive">*</span></Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['only_representative', 'korea_branch'] as OrType[]).map(ot => (
                    <button type="button" key={ot} onClick={() => setOrType(ot)}
                      className={`rounded-md border px-2 py-1.5 text-xs font-medium transition ${
                        orType === ot ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      {ot === 'only_representative' ? t('ov.chemOnlyRep') : t('ov.chemKoreaBranch')}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="orCompanyName" className="text-xs">{t('ov.chemAgentName')}</Label>
                <Input
                  id="orCompanyName"
                  value={orCompanyName}
                  onChange={e => setOrCompanyName(e.target.value)}
                  placeholder={t('ov.chemAgentNamePlaceholder')}
                  className="text-sm"
                />
              </div>
            </div>
          )}

          {/* 국가별 규제 준수 체크리스트 */}
          {currentRegs.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-secondary" />
                <span className="text-sm font-semibold">
                  {effectiveCountryCode
                    ? (COUNTRY_MAP[effectiveCountryCode as CountryCode]?.nameKo ?? effectiveCountryCode)
                    : ''}{' '}{t('reg.complianceTitle')}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">{t('reg.complianceDesc')}</p>
              <RegulationChecklist
                regulations={currentRegs}
                acks={regulationAcks}
                permitNos={regulationPermitNos}
                files={regulationFiles}
                onAckChange={(id, checked) => setRegulationAcks(prev => ({ ...prev, [id]: checked }))}
                onPermitNoChange={(id, value) => setRegulationPermitNos(prev => ({ ...prev, [id]: value }))}
                onFileChange={(id, file) => {
                  setRegulationFiles(prev => {
                    if (file === null) { const next = { ...prev }; delete next[id]; return next }
                    return { ...prev, [id]: file }
                  })
                }}
              />
            </div>
          )}

          {/* 회사명 */}
          <div className="space-y-2">
            <Label htmlFor="companyName">{t('ss.companyName')}</Label>
            <Input id="companyName" name="companyName" placeholder={t('ss.companyNamePlaceholder')} required />
          </div>

          {/* 사업자번호 */}
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
                <Button
                  type="button" variant="outline"
                  onClick={verifyBusiness}
                  disabled={businessNumber.replace(/-/g, '').length !== 10 || bizVerified === 'loading'}
                  className="shrink-0"
                >
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
            <div className="space-y-2">
              <Label htmlFor="overseasBizId">{t('ss.businessNumber')} ({t('ov.country')})</Label>
              <Input
                id="overseasBizId"
                value={overseasBizId}
                onChange={e => setOverseasBizId(e.target.value)}
                placeholder="e.g., EU VAT / EIN / Reg. No."
                required
              />
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

          {/* 담당자 연락처 */}
          {origin === 'domestic' ? (
            <PhoneVerify onVerified={setVerifiedPhone} label={t('ss.contactPhoneLabel')} />
          ) : (
            <div className="space-y-2">
              <Label htmlFor="overseasPhone">{t('ss.contactName')} — Phone</Label>
              <Input
                id="overseasPhone"
                value={overseasPhone}
                onChange={e => setOverseasPhone(e.target.value)}
                type="tel"
                placeholder="+1 555 000 0000"
              />
            </div>
          )}

          {/* 취급 카테고리 */}
          <div className="space-y-2">
            <Label>{t('ss.categories')} <span className="text-destructive">*</span></Label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORY_VALUES.map(value => (
                <div key={value} className="flex items-center gap-2">
                  <Checkbox
                    id={`cat-${value}`}
                    checked={selectedCategories.includes(value)}
                    onCheckedChange={() => toggleCategory(value)}
                  />
                  <label htmlFor={`cat-${value}`} className="text-sm cursor-pointer">{t(`cat.${value}`)}</label>
                </div>
              ))}
            </div>
          </div>

          {/* 이메일 */}
          <div className="space-y-2">
            <Label htmlFor="email">{t('common.email')}</Label>
            <Input id="email" name="email" type="email" placeholder="contact@company.com / contact@gmail.com" required autoComplete="email" />
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
