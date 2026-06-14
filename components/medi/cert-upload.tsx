'use client'

import { useRef, useState } from 'react'
import { CheckCircle2, Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CertUploadProps {
  /** input name (FormData key) */
  name: string
  /** 표시 레이블 */
  label: string
  /** 부가 설명 */
  description?: string
  required?: boolean
  /** 파일 선택 콜백 */
  onFileChange?: (file: File | null) => void
  className?: string
}

/**
 * 에스테틱 버티컬 — 의료기기 판매업 허가증·사업자등록증 등 단일 서류 업로드.
 * PDF / JPG / PNG 허용. 드래그 앤 드롭 지원.
 */
export function CertUpload({
  name,
  label,
  description,
  required = false,
  onFileChange,
  className,
}: CertUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)

  function handleFile(f: File | null) {
    setFile(f)
    onFileChange?.(f)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0] ?? null
    if (dropped) handleFile(dropped)
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <p className="text-sm font-medium leading-none">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </p>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      {/* 히든 파일 input */}
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept=".pdf,.jpg,.jpeg,.png"
        className="sr-only"
        onChange={e => handleFile(e.target.files?.[0] ?? null)}
      />

      {file ? (
        /* 선택된 파일 표시 */
        <div className="flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 px-3 py-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
          <span className="flex-1 truncate text-xs font-medium text-green-800">
            {file.name}
          </span>
          <button
            type="button"
            onClick={() => { handleFile(null); if (inputRef.current) inputRef.current.value = '' }}
            className="rounded p-0.5 text-green-600 hover:bg-green-100"
            aria-label="파일 제거"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        /* 드롭존 */
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-5 text-center transition-colors',
            dragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-muted/40'
          )}
        >
          <Upload className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-xs font-medium text-foreground">
              클릭하거나 파일을 끌어다 놓으세요
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              PDF · JPG · PNG (최대 10 MB)
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
