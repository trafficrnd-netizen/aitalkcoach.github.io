'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, FlaskConical, Store } from 'lucide-react'

const RESEARCHER_STEPS = [
  { title: '회원가입', desc: '기관·학교·기업 이메일로 가입합니다. 완전 무료입니다.' },
  { title: '견적 요청 게시', desc: 'CAS 번호 검색 또는 직접 입력으로 필요 품목을 게시합니다. 여러 품목 묶음 요청도 가능합니다.' },
  { title: '입찰 대기', desc: '공급자들이 경쟁 견적을 제출합니다. 마감일 전까지 금액은 비공개입니다.' },
  { title: '견적 비교 & 낙찰', desc: '가격·납기·공급자 신뢰도를 한눈에 비교하고 최적 견적을 선택합니다.' },
  { title: '거래 완료 & 평가', desc: '납품 후 거래 완료를 확인하고 공급자를 평가합니다.' },
]

const SUPPLIER_STEPS = [
  { title: '사업자 인증 가입', desc: '사업자번호 실시간 검증으로 즉시 가입 완료됩니다.' },
  { title: '프로필 설정', desc: '취급 카테고리를 설정하면 관련 견적 요청이 자동으로 표시됩니다.' },
  { title: '입찰 광장 탐색', desc: '공개된 견적 요청 목록을 확인하고 원하는 요청에 입찰합니다.' },
  { title: '견적 제출', desc: '금액·납기·특이사항을 입력합니다. 묶음 요청은 가능한 품목만 부분 입찰도 됩니다.' },
  { title: '낙찰 & 납품', desc: '낙찰 시 이메일 알림을 받고 납품을 진행합니다. 거래 후 연구자 평가도 받습니다.' },
]

export function HowItWorks() {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-t border-border">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-center gap-2 py-5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        {open ? '사용 흐름 닫기' : '연구자 · 공급자 사용 흐름 자세히 보기'}
      </button>

      {open && (
        <div className="container pb-16">
          <div className="grid md:grid-cols-2 gap-10">
            {/* 연구자 */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <FlaskConical className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-lg">연구자 사용 흐름</h3>
              </div>
              <ol className="space-y-4">
                {RESEARCHER_STEPS.map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <div>
                      <div className="font-semibold text-sm">{s.title}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">{s.desc}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* 공급자 */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Store className="h-5 w-5 text-amber-600" />
                <h3 className="font-bold text-lg">공급자 사용 흐름</h3>
              </div>
              <ol className="space-y-4">
                {SUPPLIER_STEPS.map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <div>
                      <div className="font-semibold text-sm">{s.title}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">{s.desc}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
