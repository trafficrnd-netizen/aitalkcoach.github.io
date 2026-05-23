import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, FlaskConical, Clock, TrendingDown, Lock, Package, Star, BarChart3, Megaphone, Construction } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WaitlistForm } from '@/components/waitlist-form'
import { HowItWorks } from '@/components/how-it-works'

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="container py-20 text-center">
        <Badge variant="secondary" className="mb-4">베타 참여 모집 중</Badge>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          요청하면 견적이 온다
        </h1>
        <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
          연구실 시약·소모품·장비 역경매 B2B 조달 플랫폼
          <br />
          공급자들이 직접 경쟁 견적을 제출합니다.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup/researcher" className={cn(buttonVariants({ size: 'lg' }), 'gap-2')}>
            연구자로 시작하기 <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/signup/supplier" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
            공급자로 참여하기
          </Link>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4 text-sm">
          <span className="text-primary font-medium">🔬 연구자 — 가입부터 낙찰까지 완전 무료</span>
          <span className="hidden sm:inline text-muted-foreground">|</span>
          <span className="text-amber-600 font-medium">🎁 공급자 — 얼리버드 처음 20개사 Pro 1개월 무료</span>
        </div>
      </section>

      {/* 서비스 특징 카드 */}
      <section className="border-t border-border bg-muted py-16">
        <div className="container">
          <h2 className="text-center text-3xl font-bold mb-3">BidVibe만의 특징</h2>
          <p className="text-center text-muted-foreground mb-12">기존 조달 방식과 무엇이 다른지 확인하세요</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<FlaskConical className="h-7 w-7 text-primary" />}
              title="연구자 완전 무료"
              description="견적 요청·비교·낙찰·거래 완료까지 모든 기능이 무료입니다. 수수료도 없습니다."
              badge="연구자"
              badgeColor="primary"
            />
            <FeatureCard
              icon={<Lock className="h-7 w-7 text-primary" />}
              title="가격 비공개 입찰"
              description="공급자끼리 서로의 견적 금액을 볼 수 없습니다. 낙찰 전까지 완전 밀봉 방식으로 진정한 경쟁 가격을 이끌어냅니다."
              badge="Sealed Bid"
              badgeColor="primary"
            />
            <FeatureCard
              icon={<Package className="h-7 w-7 text-primary" />}
              title="묶음 견적 요청"
              description="여러 품목을 한 번에 묶어 요청하고 공급자별 품목 가격을 매트릭스로 비교합니다. 부분 입찰도 허용됩니다."
            />
            <FeatureCard
              icon={<Star className="h-7 w-7 text-amber-500" />}
              title="양방향 신뢰 평가"
              description="거래 완료 후 연구자↔공급자가 서로를 평가합니다. 가격·납기·커뮤니케이션 별점이 프로필에 누적됩니다."
            />
            <FeatureCard
              icon={<Megaphone className="h-7 w-7 text-amber-500" />}
              title="공급자 광고 게시판"
              description="공급자가 취급 품목과 연락처를 게시판에 직접 홍보합니다. 연구자는 로그인 첫 화면에서 바로 확인할 수 있습니다."
              badge="신규"
              badgeColor="amber"
            />
            <FeatureCard
              icon={<BarChart3 className="h-7 w-7 text-primary" />}
              title="입찰 데이터 통계"
              description="낙찰률, 평균 경쟁 건수, 카테고리별 수요 추이를 확인해 영업 전략을 데이터 기반으로 수립합니다."
              badge="Pro"
              badgeColor="primary"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-card">
        <div className="container">
          <h2 className="text-center text-3xl font-bold mb-12">이렇게 작동합니다</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <StepCard
              step="01"
              icon={<FlaskConical className="h-7 w-7 text-primary" />}
              title="견적 요청 게시"
              description="필요한 품목을 CAS 번호로 검색하거나 직접 입력해 요청을 게시합니다."
            />
            <StepCard
              step="02"
              icon={<TrendingDown className="h-7 w-7 text-primary" />}
              title="공급자 경쟁 입찰"
              description="등록된 공급자들이 비공개 방식으로 경쟁 견적을 제출합니다."
            />
            <StepCard
              step="03"
              icon={<Clock className="h-7 w-7 text-primary" />}
              title="최적 견적 선택"
              description="가격·납기·공급자 신뢰도를 비교해 가장 유리한 견적을 선택합니다."
            />
          </div>
        </div>
      </section>

      {/* 접이식 사용흐름 */}
      <HowItWorks />

      {/* 혜택 비교 */}
      <section className="bg-muted py-16">
        <div className="container">
          <h2 className="text-center text-3xl font-bold mb-12">역할별 혜택</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* 연구자 */}
            <div className="rounded-xl border-2 border-primary/40 bg-card p-6 shadow-sm">
              <div className="text-2xl mb-3">🔬</div>
              <h3 className="text-xl font-bold mb-1">연구자</h3>
              <p className="text-sm text-muted-foreground mb-4">기관·학교·기업 이메일로 가입</p>
              <ul className="space-y-2 text-sm">
                {[
                  '가입부터 낙찰까지 완전 무료',
                  '수수료 0원',
                  '묶음 견적 요청 지원',
                  '가격 비공개 경쟁 입찰',
                  '공급자 신뢰도 별점 확인',
                  '거래 완료 후 공급자 평가',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/signup/researcher" className={cn(buttonVariants({ size: 'sm' }), 'mt-6 w-full gap-1')}>
                무료로 시작하기 <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* 공급자 */}
            <div className="rounded-xl border-2 border-amber-400 bg-amber-50 p-6 shadow-sm">
              <div className="text-2xl mb-3">🏭</div>
              <h3 className="text-xl font-bold mb-1">공급자</h3>
              <p className="text-sm text-muted-foreground mb-4">사업자 인증 후 즉시 가입</p>
              <ul className="space-y-2 text-sm">
                {[
                  '얼리버드 처음 20개사 Pro 1개월 무료',
                  '영업 없이 신규 고객 확보',
                  '카테고리 매칭 요청 자동 표시',
                  '광고 게시판 홍보',
                  '입찰 통계 데이터 (Pro)',
                  '거래 후 신뢰도 별점 누적',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/signup/supplier" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-6 w-full border-amber-400 text-amber-800 hover:bg-amber-100')}>
                얼리버드 참여하기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 구독 플랜 — 준비 중 */}
      <section id="pricing" className="py-16 bg-card">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-2">공급자 구독 플랜</h2>
          <p className="text-muted-foreground mb-10">연구자는 모든 기능을 영구 무료로 사용합니다</p>
          <div className="max-w-sm mx-auto rounded-xl border border-dashed border-border bg-muted/60 px-8 py-10 flex flex-col items-center gap-3">
            <Construction className="h-8 w-8 text-muted-foreground" />
            <p className="font-semibold text-foreground">요금제 준비 중</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              베타 기간 동안 모든 기능을 무료로 이용하실 수 있습니다.<br />
              정식 요금제 공개 시 사전 등록자에게 우선 안내드립니다.
            </p>
          </div>
          <p className="mt-6 text-sm text-amber-600 font-medium">
            🎁 얼리버드: 처음 20개사에 Pro 1개월 무료 제공
          </p>
        </div>
      </section>

      {/* 대기자 이메일 수집 */}
      <section id="waitlist" className="border-t border-border bg-muted py-20">
        <div className="container max-w-xl">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-3">베타 참여 모집</Badge>
            <h2 className="text-3xl font-bold mb-3">오픈 소식을 가장 먼저 받으세요</h2>
            <p className="text-muted-foreground">
              사전 등록자에게 베타 초대장과 우선 접근권을 드립니다.
            </p>
          </div>
          <WaitlistForm />
        </div>
      </section>
    </>
  )
}

function FeatureCard({
  icon, title, description, badge, badgeColor,
}: {
  icon: React.ReactNode
  title: string
  description: string
  badge?: string
  badgeColor?: 'primary' | 'amber'
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        {icon}
        {badge && (
          <span className={cn(
            'text-xs font-semibold px-2 py-0.5 rounded-full',
            badgeColor === 'amber'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-primary/10 text-primary'
          )}>
            {badge}
          </span>
        )}
      </div>
      <h3 className="font-semibold text-base mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  )
}

function StepCard({ step, icon, title, description }: { step: string; icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/50 p-6 shadow-sm relative">
      <span className="absolute top-4 right-4 text-3xl font-black text-muted-foreground/20 select-none leading-none">{step}</span>
      <div className="mb-4">{icon}</div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  )
}
