import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts } from '@/lib/blog'

export const revalidate = 3600

const BASE_URL = 'https://ai-traffic.kr'

export const metadata: Metadata = {
  title: 'BidVibe 매거진 — 연구실 조달 인사이트',
  description: '연구실 시약·소모품·장비 조달의 효율, 역경매, 법규(화평법·화관법·KC인증) 인사이트.',
  alternates: { canonical: `${BASE_URL}/blog` },
  openGraph: {
    title: 'BidVibe 매거진',
    description: '연구실 조달 인사이트 · Lab procurement insights',
    url: `${BASE_URL}/blog`,
    type: 'website',
  },
}

export default function BlogIndexPage() {
  const posts = getAllPosts()

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <header className="mb-12">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">← BidVibe</Link>
          <h1 className="text-4xl font-extrabold text-primary mt-3 mb-2">매거진</h1>
          <p className="text-foreground/60">연구실 조달 효율 · 역경매 · 법규 인사이트</p>
        </header>

        {posts.length === 0 ? (
          <p className="text-foreground/60">아직 게시글이 없습니다.</p>
        ) : (
          <ul className="space-y-8">
            {posts.map((p) => (
              <li key={p.slug} className="border-b border-border/60 pb-8">
                <Link href={`/blog/${p.slug}`} className="group block">
                  <div className="text-xs text-muted-foreground mb-1.5">
                    {new Date(p.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    {p.tags && p.tags.length > 0 && (
                      <span className="ml-2">
                        {p.tags.map((t) => (
                          <span key={t} className="ml-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px]">{t}</span>
                        ))}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-primary group-hover:underline">{p.title}</h2>
                  <p className="text-foreground/70 mt-1.5 leading-relaxed">{p.excerpt}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-16 rounded-xl border border-accent/40 bg-accent/5 p-6 text-center">
          <p className="font-bold text-primary mb-1">요청하면 견적이 온다</p>
          <p className="text-sm text-foreground/60 mb-4">연구자 완전 무료 · 공급자 Pro 1개월 무료</p>
          <Link href="/landing1" className="inline-block rounded-lg bg-accent text-accent-foreground font-bold px-6 py-3 hover:bg-accent/90 transition">
            무료로 시작하기 →
          </Link>
        </div>
      </div>
    </main>
  )
}
