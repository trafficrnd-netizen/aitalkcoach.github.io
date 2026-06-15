import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Megaphone, Phone, Tag, MapPin, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const AESTHETIC_CATS = [
  '레이저/HIFU 카트리지', '미용기기 소모품', '모델링팩', '시트마스크',
  '앰플/세럼', '클렌징제품', '일회용 위생용품', '베드커버/시트',
  '타월/가운', '시술도구',
]

export default async function ClinicBoardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: adRows } = await (supabase as any)
    .from('supplier_ads')
    .select('id, supplier_id, title, description, categories, products, regions, contact_info, valid_until, image_url, created_at')
    .eq('vertical', 'aesthetic')
    .gte('valid_until', today)
    .order('created_at', { ascending: false })
    .limit(40)

  const supplierIds: string[] = Array.from(new Set<string>((adRows ?? []).map((a: { supplier_id: string }) => a.supplier_id)))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profiles } = supplierIds.length ? await (supabase as any)
    .from('supplier_profiles').select('user_id, company_name').in('user_id', supplierIds) : { data: [] }

  const profileMap: Record<string, string> = {}
  for (const p of (profiles ?? [])) profileMap[p.user_id] = p.company_name

  const list = adRows ?? []

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Megaphone className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">공급사 광고게시판</h1>
          <p className="text-sm text-muted-foreground">인증된 에스테틱 소모품 공급사들의 제품 소개를 확인하세요.</p>
        </div>
      </div>

      {/* 카테고리 필터 태그 (정적 UI, 서버 컴포넌트이므로 링크로 처리 가능하지만 여기서는 표시만) */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {AESTHETIC_CATS.map(cat => (
          <span key={cat} className="rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">
            {cat}
          </span>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <Megaphone className="mx-auto mb-3 h-8 w-8 opacity-30" />
          <p>등록된 광고가 없습니다.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((ad: {
            id: string
            supplier_id: string
            title: string
            description: string | null
            categories: string[]
            products: string[]
            regions: string[]
            contact_info: string | null
            valid_until: string
            image_url: string | null
          }) => (
            <div key={ad.id} className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-sm transition-shadow">
              {ad.image_url && (
                <div className="h-36 overflow-hidden bg-muted">
                  <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-4 space-y-2">
                <div className="text-xs font-bold text-primary">{profileMap[ad.supplier_id] ?? '공급사'}</div>
                <h3 className="font-bold text-sm leading-snug">{ad.title}</h3>
                {ad.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{ad.description}</p>
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
                <div className="flex flex-wrap gap-2 pt-1">
                  {ad.regions?.slice(0, 2).map((r: string) => (
                    <span key={r} className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <MapPin className="h-2.5 w-2.5" /> {r}
                    </span>
                  ))}
                </div>
                {ad.contact_info && (
                  <div className="flex items-center gap-1.5 pt-1 border-t border-border/50">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-medium">{ad.contact_info}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
