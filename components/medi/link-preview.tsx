'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, Loader2, X, Globe } from 'lucide-react'

interface OgData {
  url: string
  title: string | null
  description: string | null
  image: string | null
  siteName: string | null
  hostname: string
}

interface LinkPreviewProps {
  url: string
  onClear?: () => void
  /** true면 X 버튼 숨김 (읽기 전용 모드) */
  readonly?: boolean
}

export function LinkPreview({ url, onClear, readonly = false }: LinkPreviewProps) {
  const [data, setData] = useState<OgData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!url.trim()) { setData(null); return }

    const controller = new AbortController()
    setLoading(true)
    setError(false)

    fetch(`/api/og-preview?url=${encodeURIComponent(url)}`, { signal: controller.signal })
      .then(r => r.json())
      .then((json: OgData & { error?: string }) => {
        if (json.error) { setError(true); return }
        setData(json)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [url])

  if (!url.trim()) return null

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin shrink-0" />
        <span>링크 미리보기 로딩 중…</span>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <a
            href={url.startsWith('http') ? url : `https://${url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary underline underline-offset-2 truncate"
          >
            {url}
          </a>
        </div>
        {!readonly && onClear && (
          <button type="button" onClick={onClear} className="ml-2 shrink-0 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    )
  }

  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3 hover:bg-muted/60 transition-colors no-underline"
    >
      {data.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={data.image}
          alt=""
          className="h-14 w-20 shrink-0 rounded object-cover border border-border"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      )}
      <div className="flex-1 min-w-0">
        {data.title && (
          <p className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary">
            {data.title}
          </p>
        )}
        {data.description && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{data.description}</p>
        )}
        <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
          <Globe className="h-3 w-3 shrink-0" />
          <span className="truncate">{data.siteName ?? data.hostname}</span>
          <ExternalLink className="h-2.5 w-2.5 shrink-0" />
        </div>
      </div>
      {!readonly && onClear && (
        <button
          type="button"
          onClick={e => { e.preventDefault(); e.stopPropagation(); onClear?.() }}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </a>
  )
}
