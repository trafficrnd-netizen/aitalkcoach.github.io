import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { marked } from 'marked'

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog')

export interface BlogPostMeta {
  slug: string
  title: string
  date: string
  excerpt: string
  tags?: string[]
  cover?: string | null
  author?: string | null
}

export interface BlogPost extends BlogPostMeta {
  html: string
  raw: string
}

/** 모든 게시글 메타 목록 (최신순) */
export function getAllPosts(): BlogPostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return []
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'))
  const posts: BlogPostMeta[] = files.map((file) => {
    const slug = file.replace(/\.(md|mdx)$/, '')
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8')
    const { data } = matter(raw)
    return {
      slug,
      title: data.title ?? slug,
      date: data.date ?? '1970-01-01',
      excerpt: data.excerpt ?? '',
      tags: data.tags ?? [],
      cover: data.cover ?? null,
      author: data.author ?? null,
    }
  })
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1))
}

/** 슬러그로 게시글 조회 (HTML 포함) */
export function getPostBySlug(slug: string): BlogPost | null {
  const tries = ['.md', '.mdx']
  for (const ext of tries) {
    const file = path.join(BLOG_DIR, `${slug}${ext}`)
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, 'utf-8')
      const { data, content } = matter(raw)
      const html = marked.parse(content, { gfm: true, breaks: false }) as string
      return {
        slug,
        title: data.title ?? slug,
        date: data.date ?? '1970-01-01',
        excerpt: data.excerpt ?? '',
        tags: data.tags ?? [],
        cover: data.cover ?? null,
        author: data.author ?? null,
        html,
        raw: content,
      }
    }
  }
  return null
}

/** 모든 슬러그 (generateStaticParams 용) */
export function getAllSlugs(): string[] {
  return getAllPosts().map((p) => p.slug)
}
