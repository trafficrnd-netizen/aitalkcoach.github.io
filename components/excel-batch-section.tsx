'use client'

import { useRef, useState } from 'react'
import { FileSpreadsheet, Download, Upload, CheckCircle, AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  downloadReagentTemplate,
  downloadProteinTemplate,
  downloadSupplyTemplate,
  parseResearcherExcel,
  type ParsedBatchItem,
} from '@/lib/excel-templates'
import { type BatchItem, emptyItem } from '@/components/batch-item-row'
import { cn } from '@/lib/utils'

type UploadType = 'reagent' | 'protein' | 'supply'

const TYPE_CONFIG: Record<UploadType, { label: string; icon: string; note: string }> = {
  reagent:  { label: '시약·화학물질', icon: '🧪', note: '물질명·CAS·순도·수량 포함' },
  protein:  { label: '단백질·펩타이드', icon: '🧬', note: '제품명·분류·수량 포함' },
  supply:   { label: '소모품·실험기구', icon: '📦', note: '제품명·대분류·수량 포함' },
}

interface Props {
  onItemsAdd: (items: BatchItem[]) => void
}

export function ExcelBatchSection({ onItemsAdd }: Props) {
  const [open, setOpen] = useState(false)
  const [uploadType, setUploadType] = useState<UploadType>('reagent')
  const [parsed, setParsed] = useState<ParsedBatchItem[] | null>(null)
  const [parseError, setParseError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleDownload(type: UploadType) {
    if (type === 'reagent') downloadReagentTemplate()
    else if (type === 'protein') downloadProteinTemplate()
    else downloadSupplyTemplate()
  }

  async function handleFile(file: File) {
    setParseError('')
    setParsed(null)
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setParseError('Excel 파일(.xlsx/.xls) 또는 CSV 파일만 업로드 가능합니다.')
      return
    }
    try {
      const items = await parseResearcherExcel(file, uploadType)
      if (items.length === 0) {
        setParseError('유효한 데이터 행이 없습니다. 물질명과 수량을 확인하세요.')
        return
      }
      setParsed(items)
    } catch (e) {
      setParseError(`파일 읽기 오류: ${e instanceof Error ? e.message : '알 수 없는 오류'}`)
    }
  }

  async function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) await handleFile(file)
    e.target.value = ''
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) await handleFile(file)
  }

  function handleAddItems() {
    if (!parsed) return
    const newItems: BatchItem[] = parsed.map(p => ({
      ...emptyItem(),
      itemType: p.itemType,
      itemSubType: p.itemSubType,
      supplyTopType: p.supplyTopType as BatchItem['supplyTopType'],
      substanceName: p.substanceName,
      casNumber: p.casNumber,
      qty: p.qty,
      unit: p.unit || 'mL',
      purity: p.purity,
      volume: p.volume,
      note: p.note,
    }))
    onItemsAdd(newItems)
    setParsed(null)
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-lg border-2 border-dashed border-border px-4 py-3 text-left hover:border-primary/40 hover:bg-muted/30 transition-colors"
      >
        <FileSpreadsheet className="h-5 w-5 text-primary shrink-0" />
        <div>
          <div className="text-sm font-medium">Excel 파일로 일괄 입력</div>
          <div className="text-xs text-muted-foreground">표준 양식 다운로드 후 작성 → 업로드</div>
        </div>
      </button>
    )
  }

  return (
    <div className="rounded-lg border-2 border-primary/20 bg-primary/3 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">Excel 일괄 입력</span>
        </div>
        <button type="button" onClick={() => { setOpen(false); setParsed(null); setParseError('') }}
          className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Step 1: 양식 유형 선택 */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Step 1 — 품목 유형 선택 및 양식 다운로드</p>
        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(TYPE_CONFIG) as [UploadType, typeof TYPE_CONFIG[UploadType]][]).map(([type, cfg]) => (
            <button
              key={type}
              type="button"
              onClick={() => { setUploadType(type); setParsed(null); setParseError('') }}
              className={cn(
                'flex flex-col items-center gap-1 rounded-md border px-2 py-2.5 text-center transition-colors',
                uploadType === type
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border bg-background text-foreground hover:border-primary/40'
              )}
            >
              <span className="text-xl">{cfg.icon}</span>
              <span className="text-xs font-medium">{cfg.label}</span>
              <span className="text-[10px] text-muted-foreground">{cfg.note}</span>
            </button>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full mt-1"
          onClick={() => handleDownload(uploadType)}
        >
          <Download className="h-4 w-4 mr-1.5" />
          {TYPE_CONFIG[uploadType].label} 양식 다운로드
        </Button>
      </div>

      {/* Step 2: 업로드 */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Step 2 — 작성 완료된 Excel 업로드</p>
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={cn(
            'cursor-pointer rounded-md border-2 border-dashed px-4 py-6 text-center transition-colors',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/40 hover:bg-muted/30'
          )}
        >
          <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            파일을 드래그하거나 클릭하여 업로드
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">.xlsx, .xls 파일 지원</p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {/* 파싱 오류 */}
      {parseError && (
        <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {parseError}
        </div>
      )}

      {/* 파싱 결과 미리보기 */}
      {parsed && parsed.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">{parsed.length}개 품목 인식됨</span>
          </div>
          <div className="rounded-md border border-border overflow-hidden max-h-48 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="px-2 py-1.5 text-left font-medium">#</th>
                  <th className="px-2 py-1.5 text-left font-medium">품목명</th>
                  <th className="px-2 py-1.5 text-left font-medium">수량</th>
                  <th className="px-2 py-1.5 text-left font-medium">단위</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {parsed.map((item, i) => (
                  <tr key={i}>
                    <td className="px-2 py-1.5 text-muted-foreground">{i + 1}</td>
                    <td className="px-2 py-1.5 font-medium truncate max-w-[180px]">{item.substanceName}</td>
                    <td className="px-2 py-1.5">{item.qty}</td>
                    <td className="px-2 py-1.5">{item.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={handleAddItems} className="flex-1">
              <CheckCircle className="h-4 w-4 mr-1.5" />
              {parsed.length}개 품목 목록에 추가
            </Button>
            <Button type="button" variant="outline" onClick={() => setParsed(null)}>
              취소
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
