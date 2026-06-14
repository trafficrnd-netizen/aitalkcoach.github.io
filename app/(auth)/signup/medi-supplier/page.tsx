'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { MailCheck, Sparkles, ShieldCheck } from 'lucide-react'
import { useT } from '@/lib/i18n/context'
import { signupMediSupplier } from '@/lib/actions/medi-auth'
import { PrivacyConsent } from '@/components/privacy-consent'
import { PhoneVerify } from '@/components/phone-verify'
import { CertUpload } from '@/components/medi/cert-upload'
import { isInstitutionalEmail, INSTITUTIONAL_EMAIL_ERROR } from '@/lib/email-validation'

export default function MediSupplierSignupPage() {
  const router = useRouter()
  const t = useT()

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  const [verifiedPhone, setVerifiedPhone] = useState('')
  const [businessNumber, setBusinessNumber] = useState('')
  const [bizVerified, setBizVerified] = useState<'idle'|'loading'|'ok'|'fail'>('idle')
  const [bizMessage, setBizMessage] = useState('')
  const [consent, setConsent] = useState({ terms: false, privacy: false, thirdParty: false, marketing: false })
  const [certMedDevice, setCertMedDevice] = useState<File | null>(null)
  const [certBizReg, setCertBizReg] = useState<File | null>(null)

  function formatBizNo(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 10)
    if (d.length <= 3) return d
    if (d.length <= 5) return `${d.slice(0,3)}-${d.slice(3)}`
    return `${d.slice(0,3)}-${d.slice(3,5)}-${d.slice(5)}`
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
    if (data.valid) { setBizVerified('ok'); setBizMessage(data.message) }
    else { setBizVerified('fail'); setBizMessage(data.message) }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (!consent.terms || !consent.privacy) { setError(t('err.agreeRequired')); return }
    if (bizVerified !== 'ok') { setError(t('err.bizRequired')); return }
    if (!verifiedPhone) { setError(t('err.phoneRequired')); return }

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    if (!isInstitutionalEmail(email)) { setError(INSTITUTIONAL_EMAIL_ERROR); return }

    const password = formData.get('password') as string
    const confirm  = formData.get('confirmPassword') as string
    if (password !== confirm) { setError(t('err.passwordMismatch')); return }

    formData.set('businessNumber', businessNumber)
    formData.set('contactPhone', verifiedPhone)

    // 파일을 FormData에 명시적으로 추가
    if (certMedDevice) formData.set('cert_med_device', certMedDevice, certMedDevice.name)
    if (certBizReg)    formData.set('cert_biz_reg', certBizReg, certBizReg.name)

    setLoading(true)
    const result = await signupMediSupplier(formData)
    setLoading(false)

    if (result?.error) { setError(result.error); return }
    if (result?.emailPending) { setPendingEmail(result.email ?? ''); return }
    router.push('/medi/supplier/board')
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
          <Link href="/login"><Button variant="outline" className="w-full">{t('pending.toLogin')}</Button></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-lg border border-border bg-background p-8 shadow-sm">
        {/* 헤더 */}
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="text-lg font-extrabold tracking-tight">{t('medi.brand')}</span>
        </div>
        <h1 className="text-2xl font-bold mb-1">{t('medi.signup.supplierTitle')}</h1>
        <p className="text-sm text-muted-foreground mb-1">{t('medi.signup.supplierSub')}</p>
        <Badge variant="secondary" className="mb-6 bg-emerald-100 text-emerald-700 border-0">
          {t('medi.signup.freeBadge')}
        </Badge>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 회사명 */}
          <div className="space-y-1.5">
            <Label htmlFor="companyName">{t('ss.companyName')} <span className="text-destructive">*</span></Label>
            <Input id="companyName" name="companyName" placeholder={t('ss.companyNamePlaceholder')} required />
          </div>

          {/* 사업자번호 */}
          <div className="space-y-1.5">
            <Label htmlFor="businessNumber">{t('medi.signup.bizNo')} <span className="text-destructive">*</span></Label>
            <div className="flex gap-2">
              <Input
                id="businessNumber"
                value={businessNumber}
                onChange={e => { setBusinessNumber(formatBizNo(e.target.value)); setBizVerified('idle') }}
                placeholder="000-00-00000"
                maxLength={12}
                required
              />
              <Button
                type="button" variant="outline"
                onClick={verifyBusiness}
                disabled={businessNumber.replace(/-/g,'').length !== 10 || bizVerified === 'loading'}
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

          {/* 대표자명 */}
          <div className="space-y-1.5">
            <Label htmlFor="representative">{t('ss.representative')}</Label>
            <Input id="representative" name="representative" placeholder={t('ss.representativePlaceholder')} />
          </div>

          {/* 주소 */}
          <div className="space-y-1.5">
            <Label htmlFor="address">{t('medi.signup.address')}</Label>
            <Input id="address" name="address" placeholder={t('medi.signup.addressPh')} />
          </div>

          {/* 대표 전화 */}
          <div className="space-y-1.5">
            <Label htmlFor="phone">{t('medi.signup.phone')}</Label>
            <Input id="phone" name="phone" type="tel" placeholder="02-0000-0000" />
          </div>

          {/* 담당자명 */}
          <div className="space-y-1.5">
            <Label htmlFor="contactName">{t('medi.signup.contactName')} <span className="text-destructive">*</span></Label>
            <Input id="contactName" name="contactName" placeholder={t('ss.representativePlaceholder')} required />
          </div>

          {/* 담당자 휴대폰 (OTP) */}
          <PhoneVerify onVerified={setVerifiedPhone} label={t('medi.signup.contactPhone')} />

          {/* ── 인증 서류 업로드 ── */}
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-secondary" />
              <span className="text-sm font-semibold">{t('medi.cert.sectionTitle')}</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {t('medi.cert.sectionDesc')}
            </p>
            <CertUpload
              name="cert_med_device"
              label={t('medi.cert.medDevice')}
              description={t('medi.cert.medDeviceDesc')}
              onFileChange={setCertMedDevice}
            />
            <CertUpload
              name="cert_biz_reg"
              label={t('medi.cert.bizReg')}
              description={t('medi.cert.bizRegDesc')}
              onFileChange={setCertBizReg}
            />
          </div>

          {/* 이메일 */}
          <div className="space-y-1.5">
            <Label htmlFor="email">{t('common.email')} <span className="text-destructive">*</span></Label>
            <Input id="email" name="email" type="email" placeholder="contact@company.com" required autoComplete="email" />
          </div>

          {/* 비밀번호 */}
          <div className="space-y-1.5">
            <Label htmlFor="password">{t('common.password')} <span className="text-destructive">*</span></Label>
            <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">{t('common.confirmPassword')} <span className="text-destructive">*</span></Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" required autoComplete="new-password" />
          </div>

          <PrivacyConsent values={consent} onChange={setConsent} role="supplier" />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('common.processing') : t('medi.signup.submit')}
          </Button>
        </form>

        <div className="mt-4 space-y-1 text-center text-sm text-muted-foreground">
          <p>
            <Link href="/login" className="text-primary hover:underline">{t('medi.signup.toLogin')}</Link>
          </p>
          <p>
            <Link href="/medi" className="text-primary hover:underline">{t('medi.signup.toMedi')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
