export default function ResearcherLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* 헤더 영역 */}
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-md bg-muted" />
        <div className="h-4 w-72 rounded bg-muted/70" />
      </div>
      {/* 카드 그리드 */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl border border-border bg-muted/50" />
        ))}
      </div>
      {/* 리스트 영역 */}
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 rounded-lg border border-border bg-muted/40" />
        ))}
      </div>
    </div>
  )
}
