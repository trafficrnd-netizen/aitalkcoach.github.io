import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Settings } from 'lucide-react'
import { getServerT } from '@/lib/i18n/server'
import { DeleteAccountButton } from '@/components/delete-account-button'
import { NotificationEmailsSection } from '@/components/notification-emails-section'
import { ChangePasswordForm } from '@/components/change-password-form'

interface NotificationEmailEntry {
  email: string
  label: string
  verified: boolean
  created_at: string
}

export default async function ResearcherSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string; verify_error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('researcher_profiles')
    .select('name, institution, department, credits, notification_emails')
    .eq('user_id', user.id)
    .maybeSingle()

  const t = getServerT()
  const params = await searchParams
  const notice: 'verified' | 'error' | null = params?.verified
    ? 'verified'
    : params?.verify_error
    ? 'error'
    : null

  const notificationEmails: NotificationEmailEntry[] = profile?.notification_emails ?? []

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">{t('rset.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('rset.sub')}</p>
        </div>
      </div>

      <div className="max-w-xl space-y-6">
        {/* 계정 정보 */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">{t('rset.emailLabel')}</p>
            <p className="text-sm font-medium">{user.email}</p>
          </div>
          {profile?.name && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">{t('rset.nameLabel')}</p>
              <p className="text-sm font-medium">{profile.name}</p>
            </div>
          )}
          {profile?.institution && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">{t('rset.institutionLabel')}</p>
              <p className="text-sm font-medium">{profile.institution}</p>
            </div>
          )}
          {profile?.department && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">{t('rset.deptLabel')}</p>
              <p className="text-sm font-medium">{profile.department}</p>
            </div>
          )}

          {/* 크레딧 잔액 */}
          <div className="flex items-center gap-3 rounded-lg bg-accent/10 border border-accent/30 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 text-lg">
              🪙
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('rset.creditsLabel')}</p>
              <p className="text-base font-bold text-foreground">
                {(profile?.credits ?? 0).toLocaleString()} P
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {t('rset.contactNote')}
            </p>
          </div>
        </div>

        {/* 비밀번호 변경 */}
        <ChangePasswordForm />

        {/* 알림 이메일 관리 (NEW) */}
        <NotificationEmailsSection
          primaryEmail={user.email!}
          initial={notificationEmails}
          notice={notice}
          noticeMessage={params?.verify_error}
        />

        {/* 회원탈퇴 */}
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-destructive">회원탈퇴</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              탈퇴하면 계정과 모든 데이터가 영구적으로 삭제됩니다.
            </p>
          </div>
          <DeleteAccountButton email={user.email!} />
        </div>
      </div>
    </div>
  )
}
