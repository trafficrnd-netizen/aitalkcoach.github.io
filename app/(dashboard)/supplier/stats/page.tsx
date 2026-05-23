import { BarChart3 } from 'lucide-react'

export default function SupplierStatsPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">통계</h1>
          <p className="text-sm text-muted-foreground">입찰·낙찰·견적 성과 분석</p>
        </div>
      </div>
      <div className="rounded-xl border border-dashed border-border py-20 text-center text-muted-foreground">
        <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">통계 대시보드 준비 중</p>
        <p className="text-sm mt-1">거래 데이터가 쌓이면 입찰 성공률, 평균 낙찰가 등의 통계를 제공할 예정입니다</p>
      </div>
    </div>
  )
}
