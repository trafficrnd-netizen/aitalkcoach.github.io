import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPostBySlug, getAllSlugs } from '@/lib/blog'

export const revalidate = 3600
const BASE_URL = 'https://ai-traffic.kr'

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = getPostBySlug(params.slug)
  if (!post) return { title: '글을 찾을 수 없습니다 | BidVibe 매거진' }
  const ogImage = `/og?title=${encodeURIComponent(post.title)}&sub=${encodeURIComponent('BidVibe 매거진')}`
  return {
    title: `${post.title} | BidVibe 매거진`,
    description: post.excerpt,
    keywords: post.tags,
    alternates: { canonical: `${BASE_URL}/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `${BASE_URL}/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.date,
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: { card: 'summary_large_image', title: post.title, description: post.excerpt, images: [ogImage] },
  }
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug)
  if (!post) notFound()

  // Article 구조화 데이터
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: { '@type': 'Organization', name: post.author ?? 'BidVibe' },
    publisher: { '@type': 'Organization', name: 'BidVibe', url: BASE_URL },
    mainEntityOfPage: `${BASE_URL}/blog/${post.slug}`,
    keywords: (post.tags ?? []).join(', '),
  }

  return (
    <main className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">← 매거진</Link>

        <article className="mt-6">
          <div className="text-xs text-muted-foreground mb-2">
            {new Date(post.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
            {post.author && <span className="ml-2">· {post.author}</span>}
          </div>

          {/* marked로 변환된 본문 — prose 스타일 인라인 적용 */}
          <div
            className="blog-prose"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />

          {post.tags && post.tags.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-2">
              {post.tags.map((t) => (
                <span key={t} className="rounded-full bg-muted px-3 py-1 text-xs text-foreground/70">#{t}</span>
              ))}
            </div>
          )}
        </article>

        <div className="mt-14 rounded-xl border border-accent/40 bg-accent/5 p-6 text-center">
          <p className="font-bold text-primary mb-1">요청하면 견적이 온다</p>
          <p className="text-sm text-foreground/60 mb-4">연구자 완전 무료 · 공급자 Pro 1개월 무료</p>
          <div className="flex gap-2 justify-center">
            <Link href="/landing1" className="rounded-lg bg-accent text-accent-foreground font-bold px-5 py-2.5 hover:bg-accent/90 transition">
              연구자 무료 가입
            </Link>
            <Link href="/landing2" className="rounded-lg border-2 border-primary/20 text-primary font-bold px-5 py-2.5 hover:bg-primary/5 transition">
              공급자 등록
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
