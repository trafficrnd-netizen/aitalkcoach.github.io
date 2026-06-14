import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Settings } from 'lucide-react'
import { ChangePasswordForm } from '@/components/change-password-form'

export default async function MediSupplierSettingsPage() {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await db
    .from('supplier_profiles')
    .select('company_name, verticals')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <div className="max-w-md space-y-8">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">설정</h1>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-2">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">계정 정보</h2>
        {profile?.company_name && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">회사명</span>
            <span className="font-medium">{profile.company_name}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">이메일</span>
          <span className="font-medium">{user.email}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">구분</span>
          <span className="font-medium">공급사 (BidMedi)</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">플랜</span>
          <span className="font-medium text-emerald-600">전액 무료</span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">비밀번호 변경</h2>
        <ChangePasswordForm />
      </div>
    </div>
  )
}
