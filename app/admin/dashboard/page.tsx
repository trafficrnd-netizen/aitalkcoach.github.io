'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Coins, Sliders, BarChart3 } from 'lucide-react'

type Stats = {
  totalResearchers: number
  totalSuppliers: number
  totalRequests: number
  totalTransactions: number
  totalAwarded: number
  totalWaitlist: number
  openRequests: number
  completedTransactions: number
}

type AdminData = {
  stats: Stats
  recentSuppliers: { user_id: string; company_name: string; created_at: string }[]
  recentResearchers: { id: string; email: string; created_at: string }[]
  recentRequests: { id: string; title: string; status: string; type: string; created_at: string }[]
  recentAwarded: { id: string; request_id: string; supplier_id: string; created_at: string }[]
  waitlist: { email: string; role: string; created_at: string }[]
}

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AdminDashboard() {
  const router = useRouter()
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [earlybird, setEarlybird] = useState<boolean | null>(null)
  const [ebToggling, setEbToggling] = useState(false)

  useEffect(() => {
    fetch('/api/admin/data')
      .then(r => {
        if (r.status === 401) { router.push('/admin'); return null }
        return r.json()
      })
      .then(d => { if (d) { setData(d); setLoading(false) } })
      .catch(() => router.push('/admin'))

    fetch('/api/admin/earlybird')
      .then(r => r.json())
      .then(d => setEarlybird(d.active))
      .catch(() => {})
  }, [router])

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin')
  }

  async function toggleEarlybird() {
    if (earlybird === null) return
    setEbToggling(true)
    const res = await fetch('/api/admin/earlybird', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !earlybird }),
    })
    const d = await res.json()
    setEarlybird(d.active)
    setEbToggling(false)
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-gray-500 text-sm">로딩 중…</div>
  }

  if (!data) return null

  const { stats } = data

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">ai-traffic 어드민</h1>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-900">로그아웃</button>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-8">

        {/* 크레딧/쿼터 시스템 네비게이션 (NEW) */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 mb-3">기본 세팅 (크레딧·쿼터 관리)</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Link
              href="/admin/credit-rules"
              className="group rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-900 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-100">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">크레딧 적립행위</p>
                  <p className="mt-0.5 text-xs text-gray-500">규칙·포인트·활성여부 관리</p>
                </div>
              </div>
            </Link>
            <Link
              href="/admin/quota-settings"
              className="group rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-900 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100">
                  <Sliders className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">무료 견적 한도</p>
                  <p className="mt-0.5 text-xs text-gray-500">연구자·공급자 quota 조율</p>
                </div>
              </div>
            </Link>
            <Link
              href="/admin/engagement"
              className="group rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-900 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">참여도 모니터링</p>
                  <p className="mt-0.5 text-xs text-gray-500">행위별 빈도 + TOP 사용자</p>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* 얼리버드 토글 */}
        <section className="rounded-xl border border-gray-200 bg-white px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">얼리버드 기간</p>
            <p className="text-xs text-gray-500 mt-0.5">
              활성 시 공급자에게 매주 광고 토큰 1개 자동 지급됩니다. 종료 시 플랜 기반 지급으로 전환됩니다.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${earlybird ? 'text-green-600' : 'text-gray-400'}`}>
              {earlybird === null ? '로딩 중' : earlybird ? '진행 중' : '종료됨'}
            </span>
            <button
              onClick={toggleEarlybird}
              disabled={ebToggling || earlybird === null}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${earlybird ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${earlybird ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </section>

        {/* Stats */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 mb-3">현황 요약</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="연구자" value={stats.totalResearchers} />
            <StatCard label="공급자" value={stats.totalSuppliers} />
            <StatCard label="견적 요청" value={stats.totalRequests} sub={`진행 중 ${stats.openRequests}건`} />
            <StatCard label="낙찰 건수" value={stats.totalAwarded} sub={`완료 ${stats.completedTransactions}건`} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-2">
            <StatCard label="대기자 명단" value={stats.totalWaitlist} />
            <StatCard label="전체 거래" value={stats.totalTransactions} />
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent suppliers */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 mb-3">최근 가입 공급자</h2>
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              {data.recentSuppliers.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">없음</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium text-gray-600">회사명</th>
                      <th className="px-4 py-2.5 text-right font-medium text-gray-600">가입일</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.recentSuppliers.map(s => (
                      <tr key={s.user_id}>
                        <td className="px-4 py-2.5 text-gray-900">{s.company_name}</td>
                        <td className="px-4 py-2.5 text-right text-gray-400">{formatDate(s.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* Recent researchers */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 mb-3">최근 가입 연구자</h2>
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              {data.recentResearchers.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">없음</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium text-gray-600">이메일</th>
                      <th className="px-4 py-2.5 text-right font-medium text-gray-600">가입일</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.recentResearchers.map(r => (
                      <tr key={r.id}>
                        <td className="px-4 py-2.5 text-gray-900 truncate max-w-[200px]">{r.email}</td>
                        <td className="px-4 py-2.5 text-right text-gray-400">{formatDate(r.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* Recent requests */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 mb-3">최근 견적 요청</h2>
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              {data.recentRequests.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">없음</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium text-gray-600">제목</th>
                      <th className="px-4 py-2.5 text-center font-medium text-gray-600">상태</th>
                      <th className="px-4 py-2.5 text-right font-medium text-gray-600">일시</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.recentRequests.map(r => (
                      <tr key={r.id}>
                        <td className="px-4 py-2.5 text-gray-900 truncate max-w-[160px]">{r.title}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                            r.status === 'open' ? 'bg-green-100 text-green-700' :
                            r.status === 'closed' ? 'bg-gray-100 text-gray-600' : 'bg-gray-50 text-gray-400'
                          }`}>
                            {r.status === 'open' ? '입찰 중' : r.status === 'closed' ? '마감' : r.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-400">{formatDate(r.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* Waitlist */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 mb-3">대기자 명단 ({data.waitlist.length}명)</h2>
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden max-h-80 overflow-y-auto">
              {data.waitlist.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">없음</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium text-gray-600">이메일</th>
                      <th className="px-4 py-2.5 text-center font-medium text-gray-600">역할</th>
                      <th className="px-4 py-2.5 text-right font-medium text-gray-600">등록일</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.waitlist.map((w, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 text-gray-900 truncate max-w-[180px]">{w.email}</td>
                        <td className="px-4 py-2 text-center text-xs text-gray-500">{w.role === 'researcher' ? '연구자' : '공급자'}</td>
                        <td className="px-4 py-2 text-right text-gray-400">{formatDate(w.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>

        {/* Recent awarded */}
        {data.recentAwarded.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 mb-3">최근 낙찰 케이스</h2>
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-600">요청 ID</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-600">공급자 ID</th>
                    <th className="px-4 py-2.5 text-right font-medium text-gray-600">낙찰일</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.recentAwarded.map(a => (
                    <tr key={a.id}>
                      <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">{a.request_id.slice(0, 8)}…</td>
                      <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">{a.supplier_id.slice(0, 8)}…</td>
                      <td className="px-4 py-2.5 text-right text-gray-400">{formatDate(a.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
