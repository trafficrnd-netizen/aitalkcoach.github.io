'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface UtmData {
  days: number
  totalSignups: number
  bySource: { source: string; total: number; researchers: number; suppliers: number }[]
  byCampaign: { campaign: string; total: number }[]
  byLanding: { path: string; total: number }[]
  daily: { date: string; count: number }[]
  recent: {
    created_at: string
    role: string
    utm_source: string | null
    utm_campaign: string | null
    utm_content: string | null
    landing_path: string | null
    referrer: string | null
  }[]
}

export default function UtmPage() {
  const router = useRouter()
  const [data, setData] = useState<UtmData | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/utm?days=${days}`)
      .then((r) => {
        if (r.status === 401) {
          router.push('/admin')
          return null
        }
        return r.json()
      })
      .then((d) => {
        if (d) setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [days, router])

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-gray-500 text-sm">로딩 중…</div>
  }

  if (!data) return null

  const maxDaily = Math.max(...data.daily.map((d) => d.count), 1)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="text-sm text-gray-500 hover:text-gray-900">
            ← 대시보드
          </Link>
          <h1 className="text-lg font-bold text-gray-900">마케팅 채널 분석</h1>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value={7}>지난 7일</option>
          <option value={30}>지난 30일</option>
          <option value={90}>지난 90일</option>
          <option value={365}>지난 1년</option>
        </select>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        {/* 요약 */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">총 추적 가입</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{data.totalSignups}</p>
            <p className="mt-0.5 text-xs text-gray-400">지난 {data.days}일</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">유효 채널 수</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{data.bySource.length}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Top 채널</p>
            <p className="mt-1 text-3xl font-bold text-purple-600">
              {data.bySource[0]?.source ?? '—'}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">{data.bySource[0]?.total ?? 0}건</p>
          </div>
        </section>

        {/* 일별 추세 */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-gray-900 mb-4">일별 가입 추세</h2>
          {data.daily.length === 0 ? (
            <p className="text-sm text-gray-500">데이터 없음</p>
          ) : (
            <div className="flex items-end gap-1 h-32">
              {data.daily.map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center justify-end" title={`${d.date}: ${d.count}건`}>
                  <div
                    className="w-full bg-purple-400 rounded-t"
                    style={{ height: `${(d.count / maxDaily) * 100}%` }}
                  />
                </div>
              ))}
            </div>
          )}
          <div className="mt-2 flex justify-between text-xs text-gray-400">
            {data.daily.length > 0 && (
              <>
                <span>{data.daily[0].date}</span>
                <span>{data.daily[data.daily.length - 1].date}</span>
              </>
            )}
          </div>
        </section>

        {/* 채널별 분석 */}
        <section className="grid md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="font-semibold text-gray-900 mb-4">채널(utm_source)별 가입</h2>
            {data.bySource.length === 0 ? (
              <p className="text-sm text-gray-500">데이터 없음</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200">
                    <th className="py-2">채널</th>
                    <th className="py-2 text-right">총</th>
                    <th className="py-2 text-right">연구자</th>
                    <th className="py-2 text-right">공급자</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bySource.map((s) => (
                    <tr key={s.source} className="border-b border-gray-100">
                      <td className="py-2 font-medium">{s.source}</td>
                      <td className="py-2 text-right font-bold">{s.total}</td>
                      <td className="py-2 text-right text-blue-600">{s.researchers}</td>
                      <td className="py-2 text-right text-amber-600">{s.suppliers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="font-semibold text-gray-900 mb-4">콘텐츠(utm_content)별 효과</h2>
            {data.byCampaign.length === 0 ? (
              <p className="text-sm text-gray-500">데이터 없음</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200">
                    <th className="py-2">콘텐츠/캠페인</th>
                    <th className="py-2 text-right">가입</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byCampaign.map((c) => (
                    <tr key={c.campaign} className="border-b border-gray-100">
                      <td className="py-2 font-mono text-xs">{c.campaign}</td>
                      <td className="py-2 text-right font-bold">{c.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* 랜딩 페이지 효과 */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-gray-900 mb-4">랜딩 페이지별 가입</h2>
          {data.byLanding.length === 0 ? (
            <p className="text-sm text-gray-500">데이터 없음</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200">
                  <th className="py-2">랜딩 경로</th>
                  <th className="py-2 text-right">가입 수</th>
                </tr>
              </thead>
              <tbody>
                {data.byLanding.map((l) => (
                  <tr key={l.path} className="border-b border-gray-100">
                    <td className="py-2 font-mono text-xs">{l.path}</td>
                    <td className="py-2 text-right font-bold">{l.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* 최근 가입 50건 */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-gray-900 mb-4">최근 추적 가입 (최대 50건)</h2>
          {data.recent.length === 0 ? (
            <p className="text-sm text-gray-500">데이터 없음</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left border-b border-gray-200 text-gray-500">
                    <th className="py-2 pr-3">시간</th>
                    <th className="py-2 pr-3">역할</th>
                    <th className="py-2 pr-3">source</th>
                    <th className="py-2 pr-3">content</th>
                    <th className="py-2 pr-3">landing</th>
                    <th className="py-2 pr-3">referrer</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.map((r, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {new Date(r.created_at).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-2 pr-3">
                        <span className={r.role === 'supplier' ? 'text-amber-600' : 'text-blue-600'}>{r.role}</span>
                      </td>
                      <td className="py-2 pr-3 font-mono">{r.utm_source ?? '—'}</td>
                      <td className="py-2 pr-3 font-mono">{r.utm_content ?? '—'}</td>
                      <td className="py-2 pr-3 font-mono">{r.landing_path ?? '—'}</td>
                      <td className="py-2 pr-3 max-w-xs truncate text-gray-500">{r.referrer ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
