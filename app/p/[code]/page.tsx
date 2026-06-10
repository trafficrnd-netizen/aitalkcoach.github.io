import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { lookupSupplierByCode } from '@/lib/actions/supplier-program'
import { FollowSupplierButton } from './follow-button'
import { ShieldCheck, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

interface Props { params: { code: string } }

export async function generateMetadata({ params }: Props) {
  const res = await lookupSupplierByCode(params.code)
  const name = res.ok ? res.companyName : 'BidVibe 공급자 전용 채널'
  return {
    title: `${name} — 전용 견적 채널 | BidVibe`,
    description: `${name}의 전용 견적 요청 채널. 신원·사업자 검증된 공급자에게 직접 요청하세요.`,
    robots: { index: false, follow: false }, // 비공개 채널은 검색노출 X
  }
}

export default async function SupplierCodeLandingPage({ params }: Props) {
  const res = await lookupSupplierByCode(params.code)
  if (!res.ok) notFound()

  // 로그인 상태에 따른 CTA 분기
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userType = user?.user_metadata?.user_type
  const isResearcher = !!user && userType === 'researcher'

  const normalized = params.code.trim().toUpperCase()

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-16">
      <div className="max-w-md mx-auto">
        <Link href="/" className="block text-center mb-6 text-lg font-bold text-primary">BidVibe</Link>

        <div className="rounded-2xl border border-border bg-background p-8 shadow-sm">
          <div className="flex items-center gap-1.5 mb-2">
            <Badge variant="secondary" className="text-[10px]">공급자 전용 채널</Badge>
            {res.verified && (
              <Badge variant="outline" className="text-[10px] gap-1">
                <ShieldCheck className="h-2.5 w-2.5" /> 인증
              </Badge>
            )}
            {!res.active && (
              <Badge variant="outline" className="text-[10px] gap-1 border-amber-300 text-amber-700">
                <Lock className="h-2.5 w-2.5" /> 비활성
              </Badge>
            )}
          </div>

          <h1 className="text-2xl font-bold text-primary mb-1">{res.companyName}</h1>
          <p className="text-sm text-muted-foreground mb-1">
            BidVibe에서 검증된 공급자에게 직접 견적을 요청합니다.
          </p>
          <p className="font-mono text-xs text-muted-foreground mb-6">
            코드 <span className="font-bold text-foreground">{normalized}</span>
          </p>

          {res.categories.length > 0 && (
            <div className="mb-6">
              <p className="text-xs text-muted-foreground mb-1.5">취급 카테고리</p>
              <div className="flex flex-wrap gap-1.5">
                {res.categories.map(c => (
                  <span key={c} className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-foreground/80">{c}</span>
                ))}
              </div>
            </div>
          )}

          {!res.active && (
            <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700 mb-4 flex items-start gap-2">
              <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>이 코드는 현재 비활성 상태입니다 (얼리버드 종료 후 Pro 이상 구독 필요).</span>
            </div>
          )}

          {isResearcher && res.active ? (
            <div className="space-y-2">
              <FollowSupplierButton code={normalized} companyName={res.companyName} />
              <Link
                href={`/researcher/request?code=${normalized}`}
                className={`${buttonVariants({ variant: 'outline' })} w-full`}
              >
                이 공급자에게 견적 요청 →
              </Link>
            </div>
          ) : !user ? (
            <div className="space-y-2">
              <Link
                href={`/signup/researcher?supplier_code=${normalized}`}
                className={`${buttonVariants({})} w-full`}
              >
                연구자로 가입하고 견적 요청
              </Link>
              <Link href={`/login?redirectTo=/p/${normalized}`} className={`${buttonVariants({ variant: 'outline' })} w-full`}>
                기존 계정으로 로그인
              </Link>
            </div>
          ) : (
            <p className="text-sm text-center text-muted-foreground">
              연구자 계정으로만 이용 가능합니다.
            </p>
          )}

          <p className="mt-6 text-[11px] text-center text-muted-foreground leading-relaxed">
            전용 채널이라도 BidVibe의 거래 기록·상호 평가가 동일 적용되어 안전합니다.
            <br />원하시면 공개 입찰로도 동시에 받을 수 있습니다.
          </p>
        </div>
      </div>
    </main>
  )
}
