import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreditCard } from 'lucide-react'

const PLAN_LABEL: Record<string, string> = {
  free: 'Free (베타)',
  basic: 'Basic',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

export default async function SupplierBillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('supplier_profiles')
    .select('plan, early_bird, credits')
    .eq('user_id', user.id)
    .maybeSingle()

  const plan = profile?.plan ?? 'free'

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">구독 관리</h1>
          <p className="text-sm text-muted-foreground">현재 플랜과 결제 정보</p>
        </div>
      </div>

      <div className="max-w-md space-y-4">
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-xs text-muted-foreground mb-1">현재 플랜</p>
          <p className="text-2xl font-bold text-primary">{PLAN_LABEL[plan] ?? plan}</p>
          {profile?.early_bird && (
            <p className="mt-1 text-sm text-amber-600 font-medium">🎁 얼리버드 혜택 적용 중</p>
          )}
          <div className="mt-4 pt-4 border-t border-border space-y-2 text-sm text-muted-foreground">
            <p>베타 기간 동안 모든 기능을 무료로 이용하실 수 있습니다.</p>
            <p>정식 서비스 출시 시 플랜 전환 안내를 이메일로 발송해 드립니다.</p>
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
          <p className="font-medium text-sm">결제 기능 준비 중</p>
          <p className="text-xs mt-1">베타 종료 후 토스페이먼츠 정기결제가 연동될 예정입니다</p>
        </div>
      </div>
    </div>
  )
}
