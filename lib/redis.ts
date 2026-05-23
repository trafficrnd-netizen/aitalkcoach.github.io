import { Redis } from '@upstash/redis'

// Strip BOM and whitespace that may be injected by some env var sources
const redisUrl = (process.env.UPSTASH_REDIS_REST_URL ?? '').replace(/^﻿/, '').trim()
const redisToken = (process.env.UPSTASH_REDIS_REST_TOKEN ?? '').replace(/^﻿/, '').trim()

export const redis = new Redis({
  url: redisUrl,
  token: redisToken,
})

// PubChem 응답 캐시 (TTL: 48시간)
const PUBCHEM_TTL = 60 * 60 * 48

export async function getCachedSubstance(key: string) {
  return redis.get(`pubchem:${key}`)
}

export async function setCachedSubstance(key: string, data: unknown) {
  return redis.set(`pubchem:${key}`, JSON.stringify(data), { ex: PUBCHEM_TTL })
}

// 공급자 등록 카운터 (얼리버드)
export async function getSupplierCount(): Promise<number> {
  const cached = await redis.get<number>('supplier:count')
  return cached ?? 0
}

export async function setSupplierCount(count: number) {
  return redis.set('supplier:count', count, { ex: 30 }) // 30초 캐시
}
