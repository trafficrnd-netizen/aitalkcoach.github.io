import { Sidebar } from '@/components/layout/sidebar'

export default function ResearcherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role="researcher" />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* pt-20 = 모바일 헤더(h-14=56px) + 기본 패딩(p-6=24px), md 이상은 pt-6 */}
        <main className="flex-1 overflow-y-auto px-4 pb-6 pt-20 md:p-6">{children}</main>
      </div>
    </div>
  )
}
