'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signupResearcher } from '@/lib/actions/auth'
import { isInstitutionalEmail, INSTITUTIONAL_EMAIL_ERROR } from '@/lib/email-validation'
import { PrivacyConsent } from '@/components/privacy-consent'
import { PhoneVerify } from '@/components/phone-verify'
import { MailCheck, Gift } from 'lucide-react'
import { useT } from '@/lib/i18n/context'

export default function ResearcherSignupPage() {
  const router = useRouter()
  const t = useT()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [consent, setConsent] = useState({ terms: false, privacy: false, thirdParty: false, marketing: false })
  const [verifiedPhone, setVerifiedPhone] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')
  const [referralCode, setReferralCode] = useState('')

  // URL의 ?ref= 초대 코드 읽기 (Suspense 불필요하도록 window 기반)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) setReferralCode(ref.trim().toUpperCase())
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (!consent.terms || !consent.privacy) {
      setError(t('err.agreeRequired'))
      return
    }

    if (!verifiedPhone) {
      setError(t('err.phoneRequiredResearcher'))
      return
    }

    setLoading(true)

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
      setLoading(false)
      return
    }

    formData.set('thirdPartyConsent', consent.thirdParty ? 'true' : 'false')
    formData.set('marketingConsent', consent.marketing ? 'true' : 'false')
    formData.set('phone', verifiedPhone)
    formData.set('referralCode', referralCode)

    const result = await signupResearcher(formData)

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

    router.push('/researcher')
    router.refresh()
  }

  // Email confirmation pending screen
  if (pendingEmail) {
    return (
      <div className="w-full max-w-sm">
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-8 text-center space-y-4">
          <MailCheck className="h-12 w-12 text-primary mx-auto" />
          <div>
            <h2 className="text-xl font-bold mb-1">{t('pending.title')}</h2>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{pendingEmail}</span>{t('pending.sentTo')}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('pending.clickLink')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('pending.checkSpam')}
          </p>
          <Link href="/login" className="block">
            <Button variant="outline" className="w-full">{t('pending.toLogin')}</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-lg border border-border bg-background p-8 shadow-sm">
        <h1 className="text-2xl font-bold mb-1">{t('sr.title')}</h1>
        <p className="text-sm text-muted-foreground mb-1">{t('sr.subtitle')}</p>
        <p className="text-xs text-amber-600 mb-6">{t('sr.emailNote')}</p>

        {/* 초대 코드 적용 안내 */}
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
          <div className="space-y-2">
            <Label htmlFor="name">{t('sr.name')}</Label>
            <Input id="name" name="name" placeholder={t('sr.namePlaceholder')} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t('common.email')}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={t('sr.emailPlaceholder')}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="institution">{t('sr.institution')}</Label>
            <Input id="institution" name="institution" placeholder={t('sr.institutionPlaceholder')} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">{t('sr.department')}</Label>
            <Input id="department" name="department" placeholder={t('sr.departmentPlaceholder')} />
          </div>

          <PhoneVerify onVerified={setVerifiedPhone} />

          <div className="space-y-2">
            <Label htmlFor="password">{t('common.password')}</Label>
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
            <Label htmlFor="confirmPassword">{t('common.confirmPassword')}</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
            />
          </div>

          <PrivacyConsent values={consent} onChange={setConsent} role="researcher" />

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('common.processing') : t('sr.submit')}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t('sr.haveAccount')}{' '}
          <Link href="/login" className="text-primary hover:underline">
            {t('common.login')}
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {t('sr.areYouSupplier')}{' '}
          <Link href="/signup/supplier" className="text-primary hover:underline">
            {t('login.signupSupplier')}
          </Link>
        </p>
      </div>
    </div>
  )
}
