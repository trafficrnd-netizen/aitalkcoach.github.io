import { AdminDevProtect } from '@/components/admin/dev-protect'

export const metadata = { title: 'BidVibe Admin' }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminDevProtect />
      {children}
    </div>
  )
}
