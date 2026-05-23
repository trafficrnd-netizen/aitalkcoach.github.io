import { CopyProtect } from '@/components/layout/copy-protect'

export default function RequestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <CopyProtect />
      {children}
    </div>
  )
}
