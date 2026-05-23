import { Bell } from 'lucide-react'

export default function ResearcherNotificationsPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Bell className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">알림</h1>
          <p className="text-sm text-muted-foreground">견적 수신, 낙찰, 거래 관련 알림</p>
        </div>
      </div>
      <div className="rounded-xl border border-dashed border-border py-20 text-center text-muted-foreground">
        <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">새로운 알림이 없습니다</p>
        <p className="text-sm mt-1">견적이 도착하거나 거래 상태가 변경되면 여기에 표시됩니다</p>
      </div>
    </div>
  )
}
