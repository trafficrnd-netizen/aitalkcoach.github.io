import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { getPublicSupplierProfile } from '@/lib/actions/public-profile'
import { ShieldCheck, Trophy, Star, History } from 'lucide-react'

interface Props { params: { code: string } }

const BASE_URL = 'https://ai-traffic.kr'

const CATEGORY_LABEL: Record<string, string> = {
  reagent: '시약·화학물질', consumable: '소모품·실험기구', equipment: '장비·기기',
  bio: '생물학·세포배양', safety: '안전·보호구', other: '기타',
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const res = await getPublicSupplierProfile(params.code)
  if ('error' in res) return { title: '공급자 프로필 | BidVibe', robots: { index: false } }
  const title = `${res.companyName} — 검증된 연구실 공급자 | BidVibe`
  const desc = `${res.companyName}: ${res.tier ? res.tier.toUpperCase() + ' 등급 · ' : ''}거래 검증 공급자. 시약·소모품·장비 견적을 BidVibe에서 받아보세요.`
  const ogImage = `/og?title=${encodeURIComponent(res.companyName)}&sub=${encodeURIComponent('BidVibe 검증 공급자')}`
  return {
    title,
    description: desc,
    alternates: { canonical: `${BASE_URL}/s/${res.code}` },
    openGraph: { title, description: desc, url: `${BASE_URL}/s/${res.code}`, type: 'profile', images: [{ url: ogImage, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title, description: desc, images: [ogImage] },
  }
}

function tierColor(t: string | null) {
  if (t === 'gold') return '#D4AF37'
  if (t === 'silver') return '#A8A8A8'
  if (t === 'bronze') return '#CD7F32'
  return null
}

export default async function PublicSupplierPage({ params }: Props) {
  const res = await getPublicSupplierProfile(params.code)
  if ('error' in res) notFound()

  const color = tierColor(res.tier)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: res.companyName,
    url: `${BASE_URL}/s/${res.code}`,
    ...(res.reviewCount > 0 && {
      aggregateRating: { '@type': 'AggregateRating', ratingValue: res.reviewAvg, reviewCount: res.reviewCount },
    }),
  }

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-lg mx-auto">
        <Link href="/" className="block text-center mb-6 text-lg font-bold text-primary">BidVibe</Link>

        <div className="rounded-2xl border border-border bg-background p-8 shadow-sm">
          {/* 헤더 */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant="secondary" className="text-[10px]">검증 공급자</Badge>
            {res.verified && (
              <Badge variant="outline" className="text-[10px] gap-1"><ShieldCheck className="h-2.5 w-2.5" /> 사업자 인증</Badge>
            )}
            {color && (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border"
                    style={{ borderColor: color, color, background: `${color}15` }}>
                <Trophy className="h-2.5 w-2.5" /> {res.tier}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-primary mb-1">{res.companyName}</h1>
          <p className="text-sm text-muted-foreground mb-4">
            {res.origin === 'overseas' ? `해외 공급자${res.country ? ` · ${res.country}` : ''}` : '국내 공급자'}
          </p>

          {/* 평점 */}
          {res.reviewCount > 0 && (
            <div className="flex items-center gap-1.5 mb-4 text-sm">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-bold text-foreground">{res.reviewAvg}</span>
              <span className="text-muted-foreground">({res.reviewCount}개 리뷰)</span>
            </div>
          )}

          {/* 카테고리 */}
          {res.categories.length > 0 && (
            <div className="mb-5">
              <p className="text-xs text-muted-foreground mb-1.5">취급 카테고리</p>
              <div className="flex flex-wrap gap-1.5">
                {res.categories.map((c) => (
                  <span key={c} className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-foreground/80">
                    {CATEGORY_LABEL[c] ?? c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 카탈로그 */}
          {res.catalog.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-2">
                <History className="h-3.5 w-3.5 text-primary" /> 주요 공급 이력
              </div>
              <ul className="space-y-1.5">
                {res.catalog.map((c, i) => (
                  <li key={i} className="flex items-center justify-between rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm">
                    <span className="font-medium truncate">{c.substance_name}</span>
                    <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
                      거래 {c.transactions_count}건
                      {c.avg_unit_price != null && <> · 평균 {Number(c.avg_unit_price).toLocaleString()}원{c.last_unit ? `/${c.last_unit}` : ''}</>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA */}
          {res.referralCodeActive ? (
            <Link href={`/p/${res.code}`} className={`${buttonVariants({})} w-full`}>
              이 공급자에게 견적 요청 →
            </Link>
          ) : (
            <Link href="/signup/researcher" className={`${buttonVariants({})} w-full`}>
              BidVibe에서 견적 받기 →
            </Link>
          )}

          <p className="mt-4 text-[11px] text-center text-muted-foreground leading-relaxed">
            이 프로필은 BidVibe 거래·검증 데이터를 기반으로 자동 생성됩니다.
            <br />연구자는 완전 무료로 견적을 받을 수 있습니다.
          </p>
        </div>
      </div>
    </main>
  )
}
