import { NextResponse } from 'next/server'
import { getCachedSubstance, setCachedSubstance } from '@/lib/redis'

export interface SubstanceResult {
  cid: number
  name: string
  casNumber: string | null
  molecularWeight: number | null
  molecularFormula: string | null
  iupacName: string | null
}

const CAS_PATTERN = /^\d{2,7}-\d{2}-\d$/

// PubChem PUG REST: CID로 상세 정보 조회
async function fetchByCid(cid: number): Promise<SubstanceResult | null> {
  try {
    const [propsRes, synsRes] = await Promise.all([
      fetch(
        `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,IUPACName/JSON`,
        { next: { revalidate: 0 } }
      ),
      fetch(
        `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/synonyms/JSON`,
        { next: { revalidate: 0 } }
      ),
    ])

    if (!propsRes.ok) return null

    const propsData = await propsRes.json()
    const props = propsData.PropertyTable?.Properties?.[0]
    if (!props) return null

    let casNumber: string | null = null
    if (synsRes.ok) {
      const synsData = await synsRes.json()
      const synonyms: string[] = synsData.InformationList?.Information?.[0]?.Synonym ?? []
      casNumber = synonyms.find(s => CAS_PATTERN.test(s)) ?? null
    }

    return {
      cid,
      name: props.IUPACName ?? '',
      casNumber,
      molecularWeight: props.MolecularWeight ?? null,
      molecularFormula: props.MolecularFormula ?? null,
      iupacName: props.IUPACName ?? null,
    }
  } catch {
    return null
  }
}

// 자동완성 후보 검색 (이름 기반)
async function searchByName(query: string): Promise<SubstanceResult[]> {
  // 1. Autocomplete으로 후보 이름 목록 획득
  const acRes = await fetch(
    `https://pubchem.ncbi.nlm.nih.gov/rest/autocomplete/compound/${encodeURIComponent(query)}/JSON?limit=8`,
    { next: { revalidate: 0 } }
  )
  if (!acRes.ok) return []

  const acData = await acRes.json()
  const suggestions: string[] = acData.dictionary_terms?.compound ?? []
  if (suggestions.length === 0) return []

  // 2. 첫 5개 이름으로 CID 조회
  const topNames = suggestions.slice(0, 5)
  const cidRes = await fetch(
    `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(topNames[0])}/cids/JSON`,
    { next: { revalidate: 0 } }
  )
  if (!cidRes.ok) return []

  const cidData = await cidRes.json()
  const cids: number[] = cidData.IdentifierList?.CID?.slice(0, 5) ?? []

  const results = await Promise.all(cids.map(fetchByCid))
  return results.filter((r): r is SubstanceResult => r !== null)
}

// CAS 번호로 검색
async function searchByCas(cas: string): Promise<SubstanceResult[]> {
  const cidRes = await fetch(
    `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(cas)}/cids/JSON`,
    { next: { revalidate: 0 } }
  )
  if (!cidRes.ok) return []

  const cidData = await cidRes.json()
  const cids: number[] = cidData.IdentifierList?.CID?.slice(0, 3) ?? []

  const results = await Promise.all(cids.map(fetchByCid))
  return results.filter((r): r is SubstanceResult => r !== null)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json([])
  }

  const cacheKey = q.toLowerCase()

  // Redis 캐시 확인
  try {
    const cached = await getCachedSubstance(cacheKey)
    if (cached) {
      const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached
      return NextResponse.json(parsed)
    }
  } catch {
    // Redis 연결 실패 시 캐시 없이 진행
  }

  // PubChem 검색
  const isCas = CAS_PATTERN.test(q)
  const results = isCas ? await searchByCas(q) : await searchByName(q)

  // 캐시 저장
  try {
    await setCachedSubstance(cacheKey, results)
  } catch {
    // 캐시 저장 실패는 무시
  }

  return NextResponse.json(results)
}
