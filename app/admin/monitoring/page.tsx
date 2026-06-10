'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, RefreshCw } from 'lucide-react'

type MonitorBid = {
  bidId: string
  supplierName: string
  total: number
  isWinner: boolean
  quoteFileName: string | null
  downloadCount: number
  downloadedAt: string | null
  lastDownloadedAt: string | null
  deletedAt: string | null
}
type MonitorRow = {
  requestId: string
  requestTitle: string
  requestStatus: string
  requestType: string
  createdAt: string
  deadline: string | null
  researcherEmail: string
  transactionStatus: string | null
  transactionCompletedAt: string | null
  winningPrice: number | null
  winningSupplier: string | null
  bidCount: number
  bids: MonitorBid[]
}

const REQ_LABEL: Record<string, string> = {
  open: '입찰 중', closed: '낙찰 완료', expired: '기간 만료', cancelled: '취소됨',
}
const REQ_COLOR: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700', closed: 'bg-green-100 text-green-700',
  expired: 'bg-gray-100 text-gray-600', cancelled: 'bg-gray-100 text-gray-500',
}
const TX_LABEL: Record<string, string> = { in_progress: '진행 중', completed: '거래 완료' }

function fmt(d: string | null) {
  return d ? new Date(d).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
}
const TTL = 24 * 60 * 60 * 1000

function downloadState(b: MonitorBid): { label: string; color: string } {
  if (!b.downloadedAt) return { label: '미다운로드', color: 'text-gray-400' }
  const expired = b.deletedAt || Date.now() - new Date(b.downloadedAt).getTime() > TTL
  if (expired) return { label: `다운로드 완료·삭제 (${b.downloadCount}회)`, color: 'text-gray-500' }
  return { label: `다운로드됨 (${b.downloadCount}회)`, color: 'text-amber-600' }
}

export default function AdminMonitoringPage() {
  const router = useRouter()
  const [rows, setRows] = useState<MonitorRow[] | null>(null)
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    fetch('/api/admin/quote-monitor')
      .then(r => {
        if (r.status === 401) { router.push('/admin'); return null }
        return r.json()
      })
      .then(d => { if (d) { setRows(d.rows); setLoading(false) } })
      .catch(() => router.push('/admin'))
  }

  useEffect(load, [router])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
            <ArrowLeft className="h-4 w-4" /> 대시보드
          </Link>
          <h1 className="text-xl font-bold text-gray-900">거래 · 견적 모니터링</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" /> 새로고침
          </button>
          <a
            href="/api/admin/quote-monitor/export"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            <Download className="h-4 w-4" /> 기록 CSV 다운로드
          </a>
        </div>
      </div>

      <p className="mb-4 text-sm text-gray-500">
        거래 경과·낙찰가·고객의 견적 PDF 다운로드 기록을 모니터링합니다. 견적서는 다운로드 후 24시간이 지나면 서버에서 자동 삭제됩니다.
      </p>

      {loading && <p className="text-sm text-gray-400">불러오는 중…</p>}

      {!loading && rows && rows.length === 0 && (
        <p className="text-sm text-gray-400">표시할 요청이 없습니다.</p>
      )}

      <div className="space-y-4">
        {rows?.map(r => (
          <div key={r.requestId} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${REQ_COLOR[r.requestStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                    {REQ_LABEL[r.requestStatus] ?? r.requestStatus}
                  </span>
                  <span className="text-xs text-gray-400">{r.requestType === 'batch' ? '묶음' : '단건'}</span>
                  <h2 className="font-semibold text-gray-900">{r.requestTitle}</h2>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
                  <span>고객: {r.researcherEmail}</span>
                  <span>게시: {fmt(r.createdAt)}</span>
                  <span>마감: {r.deadline ?? '—'}</span>
                  <span>입찰 {r.bidCount}건</span>
                  {r.transactionStatus && (
                    <span className="font-medium text-gray-700">
                      거래: {TX_LABEL[r.transactionStatus] ?? r.transactionStatus}
                      {r.transactionCompletedAt ? ` (${fmt(r.transactionCompletedAt)})` : ''}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">낙찰가</p>
                <p className="text-lg font-bold text-gray-900">
                  {r.winningPrice != null ? `${r.winningPrice.toLocaleString()}원` : '—'}
                </p>
                {r.winningSupplier && <p className="text-xs text-gray-500">{r.winningSupplier}</p>}
              </div>
            </div>

            {r.bids.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                      <th className="py-2 pr-3 font-medium">공급사</th>
                      <th className="py-2 pr-3 font-medium text-right">견적가</th>
                      <th className="py-2 pr-3 font-medium">낙찰</th>
                      <th className="py-2 pr-3 font-medium">견적 PDF</th>
                      <th className="py-2 pr-3 font-medium">다운로드 기록</th>
                      <th className="py-2 pr-3 font-medium">최초 / 최근</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.bids.map(b => {
                      const st = downloadState(b)
                      return (
                        <tr key={b.bidId} className="border-b border-gray-100 last:border-0">
                          <td className="py-2 pr-3 text-gray-800">{b.supplierName}</td>
                          <td className="py-2 pr-3 text-right font-medium text-gray-900">{b.total.toLocaleString()}원</td>
                          <td className="py-2 pr-3">{b.isWinner ? <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs font-semibold text-green-700">낙찰</span> : ''}</td>
                          <td className="py-2 pr-3 text-gray-500">{b.quoteFileName ?? '—'}</td>
                          <td className={`py-2 pr-3 ${st.color}`}>{st.label}</td>
                          <td className="py-2 pr-3 text-xs text-gray-500">{fmt(b.downloadedAt)} / {fmt(b.lastDownloadedAt)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
