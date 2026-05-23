import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import {
  Store,
  UserCheck,
  FileEdit,
  Bell,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  Star,
  CircleDollarSign,
  PackageCheck,
} from 'lucide-react'

export default function SupplierGuidePage() {
  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold mb-1">공급자 사용 가이드</h1>
        <p className="text-muted-foreground">BidVibe에서 새로운 거래처를 확보하는 방법을 안내합니다.</p>
      </div>

      {/* 핵심 개념 */}
      <section className="rounded-lg border border-primary/20 bg-primary/5 p-5 space-y-2">
        <h2 className="font-semibold text-primary">BidVibe 공급자란?</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          연구자들이 게시한 시약·소모품·장비 견적 요청에 직접 입찰합니다.
          영업 없이 플랫폼에서 새로운 거래처를 확보할 수 있습니다.
          구독 중인 공급자만 입찰할 수 있으며, Stage 1 기간 중에는 전체 무료입니다.
        </p>
        <div className="flex items-center gap-2 pt-1 text-sm font-medium text-primary">
          <TrendingUp className="h-4 w-4" />
          영업 없이 연구자가 먼저 요청 — 공급자는 입찰만
        </div>
      </section>

      {/* 시작하기 4단계 */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold">시작하기 — 4단계</h2>
        <div className="space-y-3">
          <StepCard
            step={1}
            icon={<UserCheck className="h-5 w-5 text-primary" />}
            title="회원가입 & 사업자 인증"
            desc="사업자번호를 입력하면 국세청 API로 실시간 상태를 확인합니다. 계속사업자만 가입 가능합니다. 처음 50개사는 Pro 6개월 무료 얼리버드 혜택을 받습니다."
            tip="사업자번호 10자리 입력 → 인증 버튼 → 즉시 가입 완료"
          />
          <StepCard
            step={2}
            icon={<FileEdit className="h-5 w-5 text-primary" />}
            title="프로필 & 카테고리 설정"
            desc="취급 카테고리와 배송 가능 지역을 설정합니다. 설정한 카테고리·지역에 맞는 요청만 입찰 광장에 노출됩니다."
            tip="설정 → 카테고리·지역 체크 → 저장"
          />
          <StepCard
            step={3}
            icon={<Store className="h-5 w-5 text-primary" />}
            title="입찰 광장에서 견적 제출"
            desc="입찰 광장에서 내 카테고리에 맞는 요청을 확인합니다. 단가·납기일·조건을 입력해 견적을 제출하면 됩니다. 묶음 요청의 경우 일부 품목만 선택해 입찰할 수도 있습니다."
            tip="요청 카드 클릭 → 견적 제출 → 완료"
          />
          <StepCard
            step={4}
            icon={<Bell className="h-5 w-5 text-primary" />}
            title="낙찰 알림 & 거래"
            desc="연구자가 내 견적을 수락하면 즉시 이메일 알림이 발송됩니다. 연구자 연락처가 공개되고, 이후 발주·결제·배송은 직접 진행합니다."
            tip="낙찰 → 이메일 알림 → 연락처 공개 → 직접 거래"
          />
        </div>
        <Link href="/supplier/settings" className={buttonVariants({ size: 'sm' })}>
          프로필 설정하기 <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </section>

      {/* 입찰 전략 */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold">입찰 전략 팁</h2>
        <div className="space-y-2">
          <TipCard
            icon={<ShieldCheck className="h-4 w-4 text-primary" />}
            title="빠른 응답이 경쟁력"
            desc="요청이 게시된 후 빠르게 입찰할수록 연구자의 눈에 먼저 띕니다. 알림 설정을 켜두세요."
          />
          <TipCard
            icon={<PackageCheck className="h-4 w-4 text-primary" />}
            title="조건을 명확하게"
            desc="납기 보장, 인증서 제공, 최소 주문량 등 조건을 구체적으로 적을수록 낙찰 가능성이 높아집니다."
          />
          <TipCard
            icon={<Star className="h-4 w-4 text-primary" />}
            title="리뷰가 신뢰를 만든다"
            desc="거래 완료 후 연구자가 남긴 리뷰는 신뢰 지표로 표시됩니다. 첫 거래에서 좋은 인상을 남기면 재방문율이 높아집니다."
          />
          <TipCard
            icon={<CircleDollarSign className="h-4 w-4 text-primary" />}
            title="시장 참고가 활용"
            desc="플랫폼이 제공하는 시장 참고가를 참고해 경쟁력 있는 단가를 설정하세요."
          />
        </div>
      </section>

      {/* 구독 플랜 */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold">구독 플랜</h2>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left font-medium">플랜</th>
                <th className="px-4 py-2 text-left font-medium">월 요금</th>
                <th className="px-4 py-2 text-left font-medium">입찰</th>
                <th className="px-4 py-2 text-left font-medium">API</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                { plan: 'Free', price: '0원', bid: '월 5건', api: '—' },
                { plan: 'Basic', price: '29,000원', bid: '무제한', api: '—' },
                { plan: 'Pro', price: '79,000원', bid: '무제한', api: '✅' },
                { plan: 'Enterprise', price: '협의', bid: '무제한', api: '✅' },
              ].map(row => (
                <tr key={row.plan}>
                  <td className="px-4 py-2 font-medium">{row.plan}</td>
                  <td className="px-4 py-2 text-muted-foreground">{row.price}</td>
                  <td className="px-4 py-2 text-muted-foreground">{row.bid}</td>
                  <td className="px-4 py-2 text-muted-foreground">{row.api}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">Stage 1 기간 중에는 모든 공급자 무료 이용 가능합니다.</p>
        <Link href="/supplier/billing" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          <CreditCard className="mr-2 h-4 w-4" /> 구독 관리
        </Link>
      </section>

      {/* FAQ */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold">자주 묻는 질문</h2>
        <div className="space-y-2">
          <FaqItem
            q="입찰 후 낙찰이 안 되면 어떻게 되나요?"
            a="마감일이 지나면 입찰이 자동 만료됩니다. 별도 불이익은 없으며 언제든 다른 요청에 입찰할 수 있습니다."
          />
          <FaqItem
            q="묶음 요청에서 일부 품목만 공급할 수 있나요?"
            a="가능합니다. 공급 가능한 품목만 선택해 부분 견적을 제출할 수 있습니다."
          />
          <FaqItem
            q="사업자번호 인증이 실패해요."
            a="휴업·폐업 사업자는 가입이 제한됩니다. 국세청에 등록된 사업자 상태를 확인해주세요."
          />
          <FaqItem
            q="카테고리를 바꾸면 기존 입찰에 영향이 있나요?"
            a="기존 입찰에는 영향 없습니다. 변경 이후 새로 게시되는 요청의 노출 필터에만 적용됩니다."
          />
        </div>
      </section>
    </div>
  )
}

function StepCard({ step, icon, title, desc, tip }: {
  step: number; icon: React.ReactNode; title: string; desc: string; tip: string
}) {
  return (
    <div className="flex gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
        {step}
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2 font-semibold">{icon} {title}</div>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
        <p className="text-xs text-primary/80 bg-primary/5 rounded px-2 py-1 inline-block">{tip}</p>
      </div>
    </div>
  )
}

function TipCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex gap-3 rounded-lg border border-border p-4">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <div className="font-medium text-sm">{title}</div>
        <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="font-medium text-sm mb-1">Q. {q}</div>
      <p className="text-sm text-muted-foreground">A. {a}</p>
    </div>
  )
}
