import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import {
  FlaskConical,
  Search,
  SendHorizonal,
  CheckCircle2,
  ChevronRight,
  FileSpreadsheet,
  ShieldCheck,
  TrendingDown,
  MessageSquare,
} from 'lucide-react'

export default function ResearcherGuidePage() {
  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold mb-1">연구자 사용 가이드</h1>
        <p className="text-muted-foreground">BidVibe로 최적 견적을 받는 방법을 안내합니다.</p>
      </div>

      {/* 핵심 개념 */}
      <section className="rounded-lg border border-primary/20 bg-primary/5 p-5 space-y-2">
        <h2 className="font-semibold text-primary">BidVibe는 어떻게 작동하나요?</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          기존에는 시약·소모품·장비를 구매할 때 공급자마다 직접 연락해 견적을 받아야 했습니다.
          BidVibe는 반대입니다. 요청을 한 번 게시하면 공급자들이 먼저 경쟁 견적을 제출합니다.
          연구자는 무료로 이용할 수 있습니다.
        </p>
        <div className="flex items-center gap-2 pt-1 text-sm font-medium text-primary">
          <TrendingDown className="h-4 w-4" />
          공급자 간 경쟁 → 더 낮은 가격, 더 빠른 납기
        </div>
      </section>

      {/* 시작하기 4단계 */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold">시작하기 — 4단계</h2>
        <div className="space-y-3">
          <StepCard
            step={1}
            icon={<Search className="h-5 w-5 text-primary" />}
            title="물질 검색"
            desc="CAS 번호나 물질명을 입력하면 PubChem 데이터베이스에서 자동완성됩니다. 데이터베이스에 없는 물질은 직접 이름을 입력할 수 있습니다."
            tip="64-17-5 입력 → 에탄올 자동 완성"
          />
          <StepCard
            step={2}
            icon={<FlaskConical className="h-5 w-5 text-primary" />}
            title="견적 요청 게시"
            desc="수량, 순도, 납기일 등을 입력하고 게시합니다. 여러 품목은 묶음 요청으로 한 번에 처리할 수 있습니다."
            tip="수량·단위·순도·납기·배송지 입력 → 미리보기 → 게시"
          />
          <StepCard
            step={3}
            icon={<SendHorizonal className="h-5 w-5 text-primary" />}
            title="공급자 입찰 대기"
            desc="게시 후 공급자들이 경쟁 입찰합니다. 입찰 금액은 마감 전까지 비공개(Sealed Bid)입니다. 새 입찰이 도착하면 이메일로 알림을 받습니다."
            tip="입찰 건수는 확인 가능 / 금액은 수락 후 공개"
          />
          <StepCard
            step={4}
            icon={<CheckCircle2 className="h-5 w-5 text-primary" />}
            title="견적 비교 후 수락"
            desc="납기·조건·공급자 신뢰도를 비교해 가장 유리한 견적을 선택합니다. 수락 즉시 공급자 연락처가 공개됩니다."
            tip="가격뿐 아니라 납기·신뢰도도 함께 비교"
          />
        </div>
        <Link href="/researcher/request" className={buttonVariants({ size: 'sm' })}>
          첫 견적 요청하기 <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </section>

      {/* 묶음 견적 */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold">묶음 견적 요청</h2>
        <p className="text-sm text-muted-foreground">
          여러 품목을 한 번에 요청할 때 사용합니다. 공급자는 전체 또는 일부 품목만 선택해 입찰할 수 있고, 연구자는 품목×공급자 가격 매트릭스로 비교합니다.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <MethodCard
            icon={<FlaskConical className="h-4 w-4 text-primary" />}
            title="직접 입력"
            desc="화면에서 행을 추가하며 품목을 하나씩 입력합니다."
          />
          <MethodCard
            icon={<FileSpreadsheet className="h-4 w-4 text-primary" />}
            title="엑셀 업로드"
            desc="양식을 다운로드해 품목을 작성한 후 파일을 업로드합니다."
          />
        </div>
      </section>

      {/* 핵심 규칙 */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold">알아두면 좋은 규칙</h2>
        <div className="space-y-2">
          <RuleCard
            icon={<ShieldCheck className="h-4 w-4 text-primary" />}
            title="가격 비공개 (Sealed Bid)"
            desc="입찰 진행 중 다른 공급자의 금액은 볼 수 없습니다. 내가 수락한 공급자의 금액만 공개됩니다. 공급자 간 담합을 방지하는 구조입니다."
          />
          <RuleCard
            icon={<MessageSquare className="h-4 w-4 text-primary" />}
            title="거래는 플랫폼 밖에서"
            desc="BidVibe는 견적 매칭까지만 담당합니다. 실제 발주·결제·배송은 공급자와 직접 진행합니다. 수수료는 없습니다."
          />
          <RuleCard
            icon={<CheckCircle2 className="h-4 w-4 text-primary" />}
            title="연구자는 완전 무료"
            desc="견적 요청, 비교, 수락, 채팅 모두 무료입니다. 공급자만 구독료를 냅니다."
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold">자주 묻는 질문</h2>
        <div className="space-y-2">
          <FaqItem
            q="검색해도 물질이 안 나와요."
            a="PubChem에 등록되지 않은 물질이거나 CAS 번호가 잘못됐을 수 있습니다. 물질명을 직접 입력해서 요청할 수 있습니다."
          />
          <FaqItem
            q="요청 후 입찰이 안 오면 어떻게 되나요?"
            a="마감일이 지나면 요청이 자동 만료됩니다. 조건을 조정해 재게시할 수 있습니다."
          />
          <FaqItem
            q="수락 후 취소할 수 있나요?"
            a="수락 후 취소는 공급자와 직접 협의해야 합니다. 플랫폼은 연락처 교환까지 지원합니다."
          />
          <FaqItem
            q="입찰 금액이 보이지 않아요."
            a="정상입니다. Sealed Bid 방식으로 마감 전 금액은 비공개입니다. 수락 후 해당 공급자 금액이 공개됩니다."
          />
        </div>
      </section>
    </div>
  )
}

function StepCard({
  step, icon, title, desc, tip,
}: {
  step: number
  icon: React.ReactNode
  title: string
  desc: string
  tip: string
}) {
  return (
    <div className="flex gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
        {step}
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2 font-semibold">
          {icon} {title}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
        <p className="text-xs text-primary/80 bg-primary/5 rounded px-2 py-1 inline-block">{tip}</p>
      </div>
    </div>
  )
}

function MethodCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-lg border border-border p-4 space-y-1">
      <div className="flex items-center gap-2 font-medium text-sm">{icon} {title}</div>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  )
}

function RuleCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
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
