'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Building2 } from 'lucide-react'

interface DynFormula {
  base: number
  per_researcher: number
  max: number
  min: number
  early_bird_bonus?: number
}

interface QuotaSetting {
  role: 'researcher' | 'supplier'
  period: string
  early_bird_quota: number
  normal_quota: number
  dynamic_enabled: boolean
  dynamic_formula: DynFormula | null
  preview_early: number
  preview_normal: number
}

interface QuotaResponse {
  settings: QuotaSetting[]
  researcherCount: number
  supplierCount: number
  ratio: number | null
}

export default function QuotaSettingsPage() {
  const router = useRouter()
  const [data, setData] = useState<QuotaResponse | null>(null)
  const [saving, setSaving] = useState(false)

  const load = () => {
    fetch('/api/admin/quota-settings')
      .then(r => {
        if (r.status === 401) { router.push('/admin'); return null }
        return r.json()
      })
      .then(d => { if (d) setData(d) })
  }

  useEffect(load, [router])

  async function patchSetting(role: string, patch: Partial<QuotaSetting>) {
    setSaving(true)
    const res = await fetch('/api/admin/quota-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, patch }),
    })
    if (res.ok) load()
    else alert('저장 실패')
    setSaving(false)
  }

  if (!data) {
    return <div className="flex min-h-screen items-center justify-center text-gray-500 text-sm">로딩 중…</div>
  }

  const researcherSetting = data.settings.find(s => s.role === 'researcher')
  const supplierSetting = data.settings.find(s => s.role === 'supplier')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4 flex items-center gap-4">
        <Link href="/admin/dashboard" className="text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">주간 무료 견적 한도 설정</h1>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8 space-y-6">
        {/* 현재 사용자 수 */}
        <section className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Users className="h-4 w-4" /> 연구자
            </div>
            <p className="mt-1 text-2xl font-bold">{data.researcherCount}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Building2 className="h-4 w-4" /> 공급자
            </div>
            <p className="mt-1 text-2xl font-bold">{data.supplierCount}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">연구자/공급자 비율</p>
            <p className="mt-1 text-2xl font-bold">
              {data.ratio !== null ? `${data.ratio} : 1` : '—'}
            </p>
          </div>
        </section>

        {/* Researcher 설정 — 정적 */}
        {researcherSetting && (
          <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">연구자 무료 견적요청 한도</h2>
              <span className="text-xs text-gray-400">정적 설정</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FieldNumber
                label="얼리버드 기간 (회/주)"
                value={researcherSetting.early_bird_quota}
                onChange={v => patchSetting('researcher', { early_bird_quota: v })}
                disabled={saving}
              />
              <FieldNumber
                label="얼리버드 종료 후 (회/주)"
                value={researcherSetting.normal_quota}
                onChange={v => patchSetting('researcher', { normal_quota: v })}
                disabled={saving}
              />
            </div>
            <p className="text-xs text-gray-500">
              한도 초과 시 크레딧 1점이 차감됩니다. 크레딧이 없으면 견적 요청이 거부됩니다.
            </p>
          </section>
        )}

        {/* Supplier 설정 — 동적 */}
        {supplierSetting && (
          <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">공급자 무료 견적송신 한도</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">동적 공식 사용</span>
                <button
                  onClick={() => patchSetting('supplier', { dynamic_enabled: !supplierSetting.dynamic_enabled })}
                  disabled={saving}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    supplierSetting.dynamic_enabled ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                    supplierSetting.dynamic_enabled ? 'translate-x-5' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>

            {supplierSetting.dynamic_enabled && supplierSetting.dynamic_formula ? (
              <DynamicFormulaEditor
                formula={supplierSetting.dynamic_formula}
                researcherCount={data.researcherCount}
                onSave={f => patchSetting('supplier', { dynamic_formula: f })}
                disabled={saving}
              />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <FieldNumber
                  label="얼리버드 (건/주)"
                  value={supplierSetting.early_bird_quota}
                  onChange={v => patchSetting('supplier', { early_bird_quota: v })}
                  disabled={saving}
                />
                <FieldNumber
                  label="얼리버드 종료 후 (건/주)"
                  value={supplierSetting.normal_quota}
                  onChange={v => patchSetting('supplier', { normal_quota: v })}
                  disabled={saving}
                />
              </div>
            )}

            {/* 현재 적용 quota 미리보기 */}
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm">
              <p className="font-semibold text-amber-900 mb-1">📊 현재 적용되는 quota (실시간 계산)</p>
              <p className="text-amber-800">
                얼리버드 기간: <strong>{supplierSetting.preview_early}건/주</strong> · 종료 후: <strong>{supplierSetting.preview_normal}건/주</strong>
              </p>
            </div>
          </section>
        )}

        {/* 가이드 */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 text-xs text-gray-600 space-y-2">
          <p className="font-semibold text-gray-800">💡 마케팅 가이드</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>연구자</strong>: 정적 한도. 충분히 견적 받을 수 있도록 얼리버드 2회 → 종료 후 1회 권장</li>
            <li><strong>공급자</strong>: 동적 공식. 연구자가 적을 때는 낮게, 많아지면 비례 증가하여 시장 활성화 유도</li>
            <li>공식: <code>quota = clamp(base + per_researcher × 연구자수, min, max)</code></li>
            <li>예) 연구자 100명 + base=5, per_researcher=0.5 → 5 + 50 = 55 → max=50으로 클램프 → <strong>50건/주</strong></li>
          </ul>
        </section>
      </main>
    </div>
  )
}

function FieldNumber({
  label, value, onChange, disabled,
}: { label: string; value: number; onChange: (v: number) => void; disabled: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      <input
        type="number"
        min={0}
        defaultValue={value}
        disabled={disabled}
        onBlur={e => {
          const v = Number(e.target.value)
          if (v >= 0 && v !== value) onChange(v)
        }}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 outline-none"
      />
    </label>
  )
}

function DynamicFormulaEditor({
  formula, researcherCount, onSave, disabled,
}: {
  formula: DynFormula
  researcherCount: number
  onSave: (f: DynFormula) => void
  disabled: boolean
}) {
  const [draft, setDraft] = useState<DynFormula>(formula)
  const preview = Math.max(
    draft.min,
    Math.min(draft.max, draft.base + draft.per_researcher * researcherCount)
  )

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FieldNumber label="base (기본값)" value={draft.base} onChange={v => setDraft(d => ({ ...d, base: v }))} disabled={disabled} />
        <FieldNumber label="per_researcher (연구자 1명당 증가)" value={draft.per_researcher} onChange={v => setDraft(d => ({ ...d, per_researcher: v }))} disabled={disabled} />
        <FieldNumber label="min (최소)" value={draft.min} onChange={v => setDraft(d => ({ ...d, min: v }))} disabled={disabled} />
        <FieldNumber label="max (최대)" value={draft.max} onChange={v => setDraft(d => ({ ...d, max: v }))} disabled={disabled} />
        <FieldNumber label="early_bird_bonus" value={draft.early_bird_bonus ?? 0} onChange={v => setDraft(d => ({ ...d, early_bird_bonus: v }))} disabled={disabled} />
      </div>
      <div className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 p-3">
        <div className="text-xs text-gray-600">
          <code className="text-gray-800">{draft.base} + {draft.per_researcher} × {researcherCount}</code>
          <span className="mx-1">→</span>
          <code className="text-gray-800">clamp({draft.min}, {draft.max})</code>
          <span className="mx-1">=</span>
          <strong className="text-gray-900">{Math.floor(preview)}건/주</strong>
        </div>
        <button
          onClick={() => onSave(draft)}
          disabled={disabled || JSON.stringify(draft) === JSON.stringify(formula)}
          className="rounded bg-gray-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          공식 저장
        </button>
      </div>
    </div>
  )
}
