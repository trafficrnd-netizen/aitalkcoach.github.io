'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react'

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

const COLLECTION_ITEMS: Record<'researcher' | 'supplier', string> = {
  researcher: '이름, 이메일, 소속기관, 부서/연구실',
  supplier: '회사명, 사업자번호, 대표자명, 이메일, 연락처, 사업장 주소',
}

const THIRD_PARTY_ITEMS: Record<'researcher' | 'supplier', string> = {
  researcher: '소속기관명, 이름, 연락처 (이메일)',
  supplier: '회사명, 대표자명, 연락처 (이메일·전화)',
}

export function PrivacyConsent({ values, onChange, role }: Props) {
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
        <span className="font-semibold text-sm">전체 동의 (선택 항목 포함)</span>
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
          <span className="text-primary font-medium">[필수]</span>{' '}
          이용약관에 동의합니다
        </span>
        <a
          href="/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-xs text-muted-foreground underline hover:text-foreground shrink-0"
          onClick={e => e.stopPropagation()}
        >
          전문보기
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
            <span className="text-primary font-medium">[필수]</span>{' '}
            개인정보 수집·이용에 동의합니다
          </span>
          <button
            type="button"
            onClick={() => setPrivacyOpen(v => !v)}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground shrink-0 flex items-center gap-0.5"
          >
            상세보기
            {privacyOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </label>

        {privacyOpen && (
          <div className="ml-6 rounded-md border border-border bg-background p-3 text-xs text-muted-foreground space-y-2">
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              <span className="font-medium text-foreground whitespace-nowrap">수집 항목</span>
              <span>{COLLECTION_ITEMS[role]}</span>
              <span className="font-medium text-foreground whitespace-nowrap">수집 목적</span>
              <span>서비스 이용, 견적 요청·수신, 거래 진행, 본인 확인</span>
              <span className="font-medium text-foreground whitespace-nowrap">보유 기간</span>
              <span>회원 탈퇴 시까지 (단, 관련 법령에 따라 일부 보존)</span>
            </div>
            <div className="flex items-start gap-1.5 rounded-md bg-primary/5 border border-primary/20 px-3 py-2 mt-2">
              <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <p className="text-primary font-medium leading-snug">
                수집된 개인정보는 제3자에게 무단 제공·판매·공유하지 않습니다.
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
            <span className="font-medium">[선택]</span>{' '}
            개인정보 제3자 제공에 동의합니다
          </span>
          <button
            type="button"
            onClick={() => setThirdPartyOpen(v => !v)}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground shrink-0 flex items-center gap-0.5"
          >
            상세보기
            {thirdPartyOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </label>

        {thirdPartyOpen && (
          <div className="ml-6 rounded-md border border-border bg-background p-3 text-xs text-muted-foreground space-y-1">
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              <span className="font-medium text-foreground whitespace-nowrap">제공받는 자</span>
              <span>견적·거래 상대방 ({role === 'researcher' ? '공급자' : '연구자'})</span>
              <span className="font-medium text-foreground whitespace-nowrap">제공 항목</span>
              <span>{THIRD_PARTY_ITEMS[role]}</span>
              <span className="font-medium text-foreground whitespace-nowrap">제공 목적</span>
              <span>낙찰 후 거래 진행 및 연락</span>
              <span className="font-medium text-foreground whitespace-nowrap">보유 기간</span>
              <span>거래 완료 후 1년</span>
            </div>
            <p className="text-[11px] text-muted-foreground/70 pt-1">
              비동의 시에도 서비스 이용은 가능하나, 낙찰 후 상대방과의 직접 연락이 제한될 수 있습니다.
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
          <span className="font-medium">[선택]</span>{' '}
          서비스 안내 및 마케팅 이메일 수신에 동의합니다
        </span>
      </label>

      {!requiredChecked && (
        <p className="text-xs text-destructive">필수 항목에 모두 동의해야 가입할 수 있습니다.</p>
      )}
    </div>
  )
}
