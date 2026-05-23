import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Settings } from 'lucide-react'

export default async function ResearcherSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('researcher_profiles')
    .select('name, institution, department')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">설정</h1>
          <p className="text-sm text-muted-foreground">계정 정보를 확인합니다</p>
        </div>
      </div>

      <div className="max-w-md rounded-xl border border-border bg-card p-6 space-y-4">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">이메일</p>
          <p className="text-sm font-medium">{user.email}</p>
        </div>
        {profile?.name && (
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">이름</p>
            <p className="text-sm font-medium">{profile.name}</p>
          </div>
        )}
        {profile?.institution && (
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">소속 기관</p>
            <p className="text-sm font-medium">{profile.institution}</p>
          </div>
        )}
        {profile?.department && (
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">부서 / 연구실</p>
            <p className="text-sm font-medium">{profile.department}</p>
          </div>
        )}
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            정보 변경이 필요하면 noreply@ai-traffic.kr로 문의해주세요.
          </p>
        </div>
      </div>
    </div>
  )
}
