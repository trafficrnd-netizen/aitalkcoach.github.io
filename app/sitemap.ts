import type { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/blog'

export const revalidate = 86400 // 24시간

const BASE_URL = 'https://ai-traffic.kr'

/**
 * 사이트맵 — Google·Naver·Bing 공용
 * 정적 페이지 + 랜딩 + 블로그. 가입자/견적 페이지는 비공개이므로 제외.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL,             lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE_URL}/landing1`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/landing2`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/blog`,     lastModified: now, changeFrequency: 'daily',  priority: 0.8 },
    { url: `${BASE_URL}/login`,    lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/signup/researcher`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/signup/supplier`,  lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ]

  const blogPages: MetadataRoute.Sitemap = getAllPosts().map((p) => ({
    url: `${BASE_URL}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...blogPages]
}
