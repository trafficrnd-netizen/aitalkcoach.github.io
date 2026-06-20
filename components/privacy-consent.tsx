'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react'
import { useT } from '@/lib/i18n/context'

export type ConsentValues = {
  terms: boolean
  privacy: boolean
  thirdParty: boolean
  marketing: boolean
}

type Props = {
  values: ConsentValues
  onChange: (values: ConsentValues) => void
  role: 'researcher' | 'supplier'
}

export function PrivacyConsent({ values, onChange, role }: Props) {
  const t = useT()
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [thirdPartyOpen, setThirdPartyOpen] = useState(false)

  function toggle(key: keyof ConsentValues) {
    onChange({ ...values, [key]: !values[key] })
  }

  function toggleAll(checked: boolean) {
    onChange({ terms: checked, privacy: checked, thirdParty: checked, marketing: checked })
  }

  const allChecked = values.terms && values.privacy && values.thirdParty && values.marketing
  const requiredChecked = values.terms && values.privacy

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
      {/* 전체 동의 */}
      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={allChecked}
          onChange={e => toggleAll(e.target.checked)}
          className="h-4 w-4 accent-primary"
        />
        <span className="font-semibold text-sm">{t('consent.agreeAll')}</span>
      </label>

      <div className="border-t border-border" />

      {/* [필수] 이용약관 */}
      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={values.terms}
          onChange={() => toggle('terms')}
          className="h-4 w-4 accent-primary"
        />
        <span className="text-sm">
          <span className="text-primary font-medium">{t('consent.required')}</span>{' '}
          {t('consent.terms')}
        </span>
        <a
          href="/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-xs text-muted-foreground underline hover:text-foreground shrink-0"
          onClick={e => e.stopPropagation()}
        >
          {t('consent.viewFull')}
        </a>
      </label>

      {/* [필수] 개인정보 수집·이용 */}
      <div className="space-y-2">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={values.privacy}
            onChange={() => toggle('privacy')}
            className="h-4 w-4 accent-primary"
          />
          <span className="text-sm">
            <span className="text-primary font-medium">{t('consent.required')}</span>{' '}
            {t('consent.privacy')}
          </span>
          <button
            type="button"
            onClick={() => setPrivacyOpen(v => !v)}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground shrink-0 flex items-center gap-0.5"
          >
            {t('consent.viewDetail')}
            {privacyOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </label>

        {privacyOpen && (
          <div className="ml-6 rounded-md border border-border bg-background p-3 text-xs text-muted-foreground space-y-2">
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              <span className="font-medium text-foreground whitespace-nowrap">{t('consent.collect')}</span>
              <span>{role === 'researcher' ? t('consent.collectR') : t('consent.collectS')}</span>
              <span className="font-medium text-foreground whitespace-nowrap">{t('consent.purpose')}</span>
              <span>{t('consent.purposeVal')}</span>
              <span className="font-medium text-foreground whitespace-nowrap">{t('consent.retention')}</span>
              <span>{t('consent.retentionVal')}</span>
            </div>
            <div className="flex items-start gap-1.5 rounded-md bg-primary/5 border border-primary/20 px-3 py-2 mt-2">
              <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <p className="text-primary font-medium leading-snug">
                {t('consent.noShare')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* [선택] 개인정보 제3자 제공 */}
      <div className="space-y-2">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={values.thirdParty}
            onChange={() => toggle('thirdParty')}
            className="h-4 w-4 accent-primary"
          />
          <span className="text-sm text-muted-foreground">
            <span className="font-medium">{t('consent.optional')}</span>{' '}
            {t('consent.thirdParty')}
          </span>
          <button
            type="button"
            onClick={() => setThirdPartyOpen(v => !v)}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground shrink-0 flex items-center gap-0.5"
          >
            {t('consent.viewDetail')}
            {thirdPartyOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </label>

        {thirdPartyOpen && (
          <div className="ml-6 rounded-md border border-border bg-background p-3 text-xs text-muted-foreground space-y-1">
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              <span className="font-medium text-foreground whitespace-nowrap">{t('consent.thirdPartyRecipient')}</span>
              <span>{role === 'researcher' ? t('consent.thirdPartyRecipientR') : t('consent.thirdPartyRecipientS')}</span>
              <span className="font-medium text-foreground whitespace-nowrap">{t('consent.thirdPartyItems')}</span>
              <span>{role === 'researcher' ? t('consent.thirdPartyItemsR') : t('consent.thirdPartyItemsS')}</span>
              <span className="font-medium text-foreground whitespace-nowrap">{t('consent.thirdPartyPurpose')}</span>
              <span>{t('consent.thirdPartyPurposeVal')}</span>
              <span className="font-medium text-foreground whitespace-nowrap">{t('consent.thirdPartyRetention')}</span>
              <span>{t('consent.thirdPartyRetentionVal')}</span>
            </div>
            <p className="text-[11px] text-muted-foreground/70 pt-1">
              {t('consent.thirdPartyNote')}
            </p>
          </div>
        )}
      </div>

      {/* [선택] 마케팅 수신 */}
      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={values.marketing}
          onChange={() => toggle('marketing')}
          className="h-4 w-4 accent-primary"
        />
        <span className="text-sm text-muted-foreground">
          <span className="font-medium">{t('consent.optional')}</span>{' '}
          {t('consent.marketing')}
        </span>
      </label>

      {!requiredChecked && (
        <p className="text-xs text-destructive">{t('consent.requiredNote')}</p>
      )}
    </div>
  )
}
