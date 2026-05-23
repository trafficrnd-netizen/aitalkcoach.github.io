'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, Award } from 'lucide-react'

interface RuleStat { key: string; label: string; role: string; count: number; totalPoints: number }
interface UserStat { user_id: string; display: string; credits: number }
interface EngagementData {
  period: string
  totalEvents: number
  byRule: RuleStat[]
  topResearchers: UserStat[]
  topSuppliers: UserStat[]
}

export default function EngagementPage() {
  const router = useRouter()
  const [data, setData] = useState<EngagementData | null>(null)

  useEffect(() => {
    fetch('/api/admin/engagement')
      .then(r => {
        if (r.status === 401) { router.push('/admin'); return null }
        return r.json()
      })
      .then(d => { if (d) setData(d) })
  }, [router])

  if (!data) {
    return <div className="flex min-h-screen items-center justify-center text-gray-500 text-sm">로딩 중…</div>
  }

  const maxCount = Math.max(...data.byRule.map(r => r.count), 1)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4 flex items-center gap-4">
        <Link href="/admin/dashboard" className="text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">크레딧 참여도 모니터링</h1>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        {/* 요약 */}
        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">{data.period} 총 적립 이벤트</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{data.totalEvents.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">활성 적립행위 종류</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{data.byRule.length}</p>
          </div>
        </section>

        {/* 적립행위별 발생 빈도 */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-gray-700" />
            <h2 className="text-base font-semibold text-gray-900">적립행위별 빈도 (최근 30일)</h2>
          </div>
          {data.byRule.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">아직 적립 이벤트가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {data.byRule.map(r => (
                <div key={r.key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-gray-900">{r.label}</span>
                      <span className="ml-2 text-xs text-gray-400">{r.role === 'researcher' ? '연구자' : '공급자'}</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      <strong className="text-gray-900">{r.count.toLocaleString()}</strong> 건 ·{' '}
                      <span className="text-amber-700">+{r.totalPoints.toLocaleString()}P</span>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded ${r.role === 'researcher' ? 'bg-blue-500' : 'bg-emerald-500'}`}
                      style={{ width: `${(r.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* TOP 사용자 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <UserTopList title="연구자 누적 크레딧 TOP 20" users={data.topResearchers} color="blue" />
          <UserTopList title="공급자 누적 크레딧 TOP 20" users={data.topSuppliers} color="emerald" />
        </div>
      </main>
    </div>
  )
}

function UserTopList({ title, users, color }: { title: string; users: UserStat[]; color: 'blue' | 'emerald' }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-5 py-3 flex items-center gap-2">
        <Award className={`h-4 w-4 ${color === 'blue' ? 'text-blue-600' : 'text-emerald-600'}`} />
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      {users.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">아직 데이터가 없습니다.</p>
      ) : (
        <ol className="divide-y divide-gray-50">
          {users.map((u, i) => (
            <li key={u.user_id} className="flex items-center justify-between px-5 py-2.5 text-sm">
              <div className="flex items-center gap-3">
                <span className="w-6 text-xs font-bold text-gray-400 text-right">{i + 1}</span>
                <span className="text-gray-900 truncate max-w-[200px]">{u.display}</span>
              </div>
              <span className="text-xs font-semibold text-amber-700">{u.credits.toLocaleString()} P</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
