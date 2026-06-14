import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })

  // 기본 유효성
  let parsed: URL
  try {
    parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
  } catch {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 })
  }

  try {
    const res = await fetch(parsed.href, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BidVibeBot/1.0)' },
      signal: AbortSignal.timeout(5000),
    })
    const html = await res.text()

    const getMeta = (property: string): string | null => {
      // og: 또는 name= 방식 둘 다 지원
      const ogMatch = html.match(
        new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i')
      ) ?? html.match(
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i')
      )
      return ogMatch?.[1] ?? null
    }

    const title =
      getMeta('og:title') ??
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ??
      null

    const description = getMeta('og:description') ?? getMeta('description')
    const image = getMeta('og:image')
    const siteName = getMeta('og:site_name') ?? parsed.hostname

    return NextResponse.json({
      url: parsed.href,
      title: title?.slice(0, 120) ?? null,
      description: description?.slice(0, 200) ?? null,
      image: image ?? null,
      siteName,
      hostname: parsed.hostname,
    })
  } catch {
    // fetch 실패 시 URL 기본 정보만
    return NextResponse.json({
      url: parsed.href,
      title: null,
      description: null,
      image: null,
      siteName: null,
      hostname: parsed.hostname,
    })
  }
}
