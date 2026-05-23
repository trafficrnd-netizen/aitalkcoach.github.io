'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface CreditRule {
  key: string
  role: 'researcher' | 'supplier'
  label: string
  description: string | null
  points: number
  frequency_type: string
  frequency_limit: number | null
  active: boolean
  sort_order: number
}

const FREQ_LABELS: Record<string, string> = {
  per_event: '매회',
  daily: '하루 1회',
  weekly: '주 1회',
  monthly: '월 1회',
  once: '계정당 1회',
}

export default function CreditRulesPage() {
  const router = useRouter()
  const [rules, setRules] = useState<CreditRule[]>([])
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/credit-rules')
      .then(r => {
        if (r.status === 401) { router.push('/admin'); return null }
        return r.json()
      })
      .then(d => { if (d) { setRules(d.rules); setLoading(false) } })
      .catch(() => router.push('/admin'))
  }, [router])

  async function patchRule(key: string, patch: Partial<CreditRule>) {
    setSavingKey(key)
    const res = await fetch('/api/admin/credit-rules', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, patch }),
    })
    if (res.ok) {
      setRules(prev => prev.map(r => (r.key === key ? { ...r, ...patch } : r)))
    } else {
      alert('저장 실패')
    }
    setSavingKey(null)
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-gray-500 text-sm">로딩 중…</div>
  }

  const researcherRules = rules.filter(r => r.role === 'researcher')
  const supplierRules = rules.filter(r => r.role === 'supplier')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4 flex items-center gap-4">
        <Link href="/admin/dashboard" className="text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">크레딧 적립행위 관리</h1>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-8">
        <section>
          <h2 className="mb-3 text-sm font-semibold text-gray-500">연구자 적립행위 ({researcherRules.length}개)</h2>
          <RuleTable rules={researcherRules} onPatch={patchRule} savingKey={savingKey} />
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-gray-500">공급자 적립행위 ({supplierRules.length}개)</h2>
          <RuleTable rules={supplierRules} onPatch={patchRule} savingKey={savingKey} />
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 text-xs text-gray-600 space-y-2">
          <p className="font-semibold text-gray-800">💡 적립행위 관리 가이드</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>활성화 토글</strong>: off로 두면 해당 행위가 발생해도 적립되지 않음. 새 행위는 inactive 상태로 시드되어 있으니 자유롭게 활성화</li>
            <li><strong>포인트 조정</strong>: 사용자 참여도를 보면서 매력도를 균형 조정. 1~10 범위 권장</li>
            <li><strong>빈도 제한</strong>: <code>once</code>는 평생 1회, <code>daily/weekly/monthly</code>는 기간 내 frequency_limit회까지 적립</li>
            <li>변경 즉시 적용됩니다 (배포 불필요)</li>
          </ul>
        </section>
      </main>
    </div>
  )
}

function RuleTable({
  rules, onPatch, savingKey,
}: {
  rules: CreditRule[]
  onPatch: (key: string, patch: Partial<CreditRule>) => void
  savingKey: string | null
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-3 py-2.5 text-left font-medium text-gray-600">활성</th>
            <th className="px-3 py-2.5 text-left font-medium text-gray-600">적립행위</th>
            <th className="px-3 py-2.5 text-center font-medium text-gray-600">포인트</th>
            <th className="px-3 py-2.5 text-center font-medium text-gray-600">빈도</th>
            <th className="px-3 py-2.5 text-left font-medium text-gray-600 max-w-[200px]">설명</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rules.map(r => (
            <tr key={r.key} className={savingKey === r.key ? 'opacity-50' : ''}>
              <td className="px-3 py-2.5">
                <button
                  onClick={() => onPatch(r.key, { active: !r.active })}
                  disabled={savingKey === r.key}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    r.active ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                    r.active ? 'translate-x-5' : 'translate-x-1'
                  }`} />
                </button>
              </td>
              <td className="px-3 py-2.5">
                <p className="text-gray-900 font-medium">{r.label}</p>
                <code className="text-[10px] text-gray-400">{r.key}</code>
              </td>
              <td className="px-3 py-2.5 text-center">
                <input
                  type="number"
                  min={1}
                  max={20}
                  defaultValue={r.points}
                  onBlur={e => {
                    const v = Number(e.target.value)
                    if (v && v !== r.points) onPatch(r.key, { points: v })
                  }}
                  disabled={savingKey === r.key}
                  className="w-14 rounded border border-gray-300 px-2 py-1 text-center text-sm"
                />
              </td>
              <td className="px-3 py-2.5 text-center text-xs text-gray-600">
                {FREQ_LABELS[r.frequency_type] ?? r.frequency_type}
              </td>
              <td className="px-3 py-2.5 text-xs text-gray-500 max-w-[250px]">{r.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
