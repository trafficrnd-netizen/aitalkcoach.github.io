'use client'

import { useEffect, useState } from 'react'

type ResearcherProfile = {
  name: string | null
  institution: string | null
  department: string | null
  phone: string | null
  review_credits: number | null
  badge_level: string | null
}

type SupplierProfile = {
  company_name: string | null
  business_number: string | null
  representative: string | null
  address: string | null
  phone: string | null
  contact_name: string | null
  contact_phone: string | null
  categories: string[] | null
  plan: string | null
  credits: number | null
  early_bird: boolean | null
  handles_hazmat: boolean | null
  verification_status: string | null
  verified_at: string | null
}

type CustomerDetail = {
  userId: string
  email: string | undefined
  userType: 'researcher' | 'supplier'
  createdAt: string
  lastSignInAt: string | null
  emailConfirmedAt: string | null
  profile: ResearcherProfile | SupplierProfile | null
  activity: Record<string, number>
  recentActivity: {
    id: string
    status: string
    created_at: string
    title?: string
    deadline?: string
    request_id?: string
  }[]
}

interface Props {
  userId: string | null
  onClose: () => void
}

function fmt(d: string | null | undefined) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function formatBno(b: string | null | undefined) {
  if (!b) return '-'
  return b.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3')
}

function VerificationBadge({ status }: { status: string | null }) {
  const map: Record<string, { label: string; cls: string }> = {
    instant:  { label: '즉시인증',   cls: 'bg-green-100 text-green-700' },
    approved: { label: '승인완료',   cls: 'bg-green-100 text-green-700' },
    pending:  { label: '심사대기',   cls: 'bg-amber-100 text-amber-700' },
    rejected: { label: '거절',       cls: 'bg-red-100 text-red-700'    },
  }
  const cfg = map[status ?? ''] ?? { label: status ?? '-', cls: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open:     'bg-blue-100 text-blue-700',
    closed:   'bg-gray-100 text-gray-600',
    accepted: 'bg-green-100 text-green-700',
    pending:  'bg-amber-100 text-amber-700',
    rejected: 'bg-red-100 text-red-600',
  }
  const label: Record<string, string> = {
    open: '진행중', closed: '마감', accepted: '낙찰', pending: '대기', rejected: '거절',
  }
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {label[status] ?? status}
    </span>
  )
}

export function CustomerPanel({ userId, onClose }: Props) {
  const [detail, setDetail] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userId) { setDetail(null); return }
    setLoading(true)
    setError('')
    fetch(`/api/admin/customer/${userId}`)
      .then(r => r.json())
      .then(d => { setDetail(d); setLoading(false) })
      .catch(() => { setError('데이터를 불러오지 못했습니다.'); setLoading(false) })
  }, [userId])

  if (!userId) return null

  const isResearcher = detail?.userType === 'researcher'
  const rp = isResearcher ? (detail?.profile as ResearcherProfile | null) : null
  const sp = !isResearcher ? (detail?.profile as SupplierProfile | null) : null

  return (
    <>
      {/* 백드롭 */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />
      {/* 슬라이드 패널 */}
      <aside className="fixed right-0 top-0 h-full w-[420px] max-w-full bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-sm font-bold text-gray-900">고객 상세 정보</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 바디 */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center h-32 text-sm text-gray-400">
              불러오는 중…
            </div>
          )}
          {error && (
            <div className="m-5 rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
          )}

          {detail && (
            <div className="divide-y divide-gray-50">
              {/* 기본 정보 */}
              <section className="px-5 py-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    isResearcher ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {isResearcher ? '연구자' : '공급자'}
                  </span>
                  {!isResearcher && sp?.verification_status && (
                    <VerificationBadge status={sp.verification_status} />
                  )}
                  {detail.emailConfirmedAt
                    ? <span className="text-xs text-green-600 font-medium">✓ 이메일 인증</span>
                    : <span className="text-xs text-red-500 font-medium">✗ 이메일 미인증</span>
                  }
                </div>
                <p className="text-sm font-semibold text-gray-900 break-all">{detail.email ?? '-'}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-gray-500">
                  <span className="text-gray-400">가입일</span>
                  <span>{fmtDate(detail.createdAt)}</span>
                  <span className="text-gray-400">마지막 로그인</span>
                  <span>{fmt(detail.lastSignInAt)}</span>
                  {!isResearcher && sp?.verified_at && (
                    <>
                      <span className="text-gray-400">인증 완료일</span>
                      <span>{fmtDate(sp.verified_at)}</span>
                    </>
                  )}
                </div>
              </section>

              {/* 연구자 프로필 */}
              {isResearcher && rp && (
                <section className="px-5 py-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">프로필</p>
                  <dl className="space-y-2 text-sm">
                    <Row label="이름"     value={rp.name} />
                    <Row label="소속기관" value={rp.institution} />
                    <Row label="부서"     value={rp.department} />
                    <Row label="연락처"   value={rp.phone} />
                    <Row label="배지"     value={rp.badge_level} />
                    <Row label="리뷰크레딧" value={rp.review_credits?.toString()} />
                  </dl>
                </section>
              )}

              {/* 공급자 프로필 */}
              {!isResearcher && sp && (
                <section className="px-5 py-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">프로필</p>
                  <dl className="space-y-2 text-sm">
                    <Row label="회사명"       value={sp.company_name} />
                    <Row label="사업자번호"   value={formatBno(sp.business_number)} />
                    <Row label="대표자"       value={sp.representative} />
                    <Row label="주소"         value={sp.address} />
                    <Row label="회사 전화"    value={sp.phone} />
                    <Row label="담당자"       value={sp.contact_name} />
                    <Row label="담당자 연락처" value={sp.contact_phone} />
                    <Row label="플랜"         value={sp.plan} />
                    <Row label="크레딧"       value={sp.credits?.toString()} />
                    <Row label="얼리버드"     value={sp.early_bird ? '✓' : '-'} />
                    <Row label="위험물 취급"  value={sp.handles_hazmat ? '✓' : '-'} />
                    {sp.categories && sp.categories.length > 0 && (
                      <div className="flex gap-2 text-xs">
                        <dt className="w-24 shrink-0 text-gray-400">카테고리</dt>
                        <dd className="flex flex-wrap gap-1">
                          {sp.categories.map(c => (
                            <span key={c} className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-600">{c}</span>
                          ))}
                        </dd>
                      </div>
                    )}
                  </dl>
                </section>
              )}

              {/* 활동 요약 */}
              <section className="px-5 py-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">활동 요약</p>
                {isResearcher ? (
                  <div className="grid grid-cols-3 gap-2">
                    <Stat label="전체 요청"  value={detail.activity.totalRequests  ?? 0} />
                    <Stat label="진행 중"    value={detail.activity.openRequests   ?? 0} color="blue" />
                    <Stat label="마감"       value={detail.activity.closedRequests ?? 0} color="gray" />
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    <Stat label="전체 입찰" value={detail.activity.totalBids    ?? 0} />
                    <Stat label="낙찰"      value={detail.activity.acceptedBids ?? 0} color="green" />
                    <Stat label="대기"      value={detail.activity.pendingBids  ?? 0} color="amber" />
                    <Stat label="낙찰률"
                      value={detail.activity.totalBids > 0
                        ? Math.round((detail.activity.acceptedBids / detail.activity.totalBids) * 100)
                        : 0}
                      suffix="%" color={detail.activity.acceptedBids > 0 ? 'green' : 'gray'}
                    />
                  </div>
                )}
              </section>

              {/* 최근 활동 */}
              {detail.recentActivity.length > 0 && (
                <section className="px-5 py-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    최근 {isResearcher ? '견적 요청' : '입찰'}
                  </p>
                  <ul className="space-y-2">
                    {detail.recentActivity.map(item => (
                      <li key={item.id} className="flex items-start justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          {isResearcher
                            ? <p className="truncate text-gray-700 font-medium">{item.title ?? '-'}</p>
                            : <p className="font-mono text-gray-500">{item.request_id?.slice(0, 8) ?? '-'}…</p>
                          }
                          <p className="text-gray-400 mt-0.5">{fmtDate(item.created_at)}</p>
                        </div>
                        <StatusBadge status={item.status} />
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex gap-2 text-xs">
      <dt className="w-24 shrink-0 text-gray-400">{label}</dt>
      <dd className="text-gray-700 break-all">{value || '-'}</dd>
    </div>
  )
}

function Stat({
  label, value, suffix = '', color = 'default'
}: {
  label: string; value: number; suffix?: string; color?: 'green' | 'blue' | 'amber' | 'gray' | 'default'
}) {
  const colorMap = {
    green:   'text-green-600',
    blue:    'text-blue-600',
    amber:   'text-amber-600',
    gray:    'text-gray-400',
    default: 'text-gray-800',
  }
  return (
    <div className="rounded-lg bg-gray-50 p-2.5 text-center">
      <p className={`text-lg font-bold ${colorMap[color]}`}>{value}{suffix}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  )
}
