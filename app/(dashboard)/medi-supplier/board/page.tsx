import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Megaphone, PlusCircle, CalendarDays, Tag, Trash2 } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { deleteMediAd } from '@/lib/actions/medi-ad'

export default async function MediSupplierBoardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: myAds } = await (supabase as any)
    .from('supplier_ads')
    .select('id, title, description, categories, products, regions, valid_until, image_url, created_at')
    .eq('supplier_id', user.id)
    .eq('vertical', 'aesthetic')
    .order('created_at', { ascending: false })
    .limit(20)

  const list = myAds ?? []
  const activeCount = list.filter((a: { valid_until: string }) => a.valid_until >= today).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Megaphone className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">광고 관리</h1>
            <p className="text-sm text-muted-foreground">
              의원에게 노출되는 광고를 관리하세요. (활성 {activeCount}개)
            </p>
          </div>
        </div>
        <Link href="/medi-supplier/board/new" className={buttonVariants({ size: 'sm', className: 'gap-1' })}>
          <PlusCircle className="h-4 w-4" /> 광고 등록
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="py-20 text-center space-y-4 text-muted-foreground">
          <Megaphone className="mx-auto h-8 w-8 opacity-30" />
          <p>등록된 광고가 없습니다.</p>
          <Link href="/medi-supplier/board/new" className={buttonVariants({ size: 'sm', className: 'gap-1' })}>
            <PlusCircle className="h-4 w-4" /> 첫 광고 등록하기
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((ad: {
            id: string
            title: string
            description: string | null
            categories: string[]
            products: string[]
            regions: string[]
            valid_until: string
            image_url: string | null
          }) => {
            const isActive = ad.valid_until >= today
            return (
              <li key={ad.id} className="rounded-xl border border-border bg-card px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Badge className={isActive
                        ? 'bg-emerald-100 text-emerald-700 border-0'
                        : 'bg-muted text-muted-foreground'}>
                        {isActive ? '활성' : '만료'}
                      </Badge>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3" /> ~{ad.valid_until}
                      </span>
                    </div>
                    <p className="font-semibold text-sm">{ad.title}</p>
                    {ad.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{ad.description}</p>
                    )}
                    {ad.products && ad.products.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {ad.products.slice(0, 4).map((p: string) => (
                          <span key={p} className="flex items-center gap-0.5 text-[10px] bg-primary/5 text-primary px-1.5 py-0.5 rounded-full">
                            <Tag className="h-2.5 w-2.5" /> {p}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <form action={deleteMediAd.bind(null, ad.id)}>
                    <button type="submit" className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
