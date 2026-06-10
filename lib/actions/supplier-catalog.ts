'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export interface CatalogSupplier {
  supplierId: string
  companyName: string
  transactionsCount: number
  avgUnitPrice: number | null
  lastPrice: number | null
  lastUnit: string | null
  lastDate: string | null
  tier: string | null
  referralCode: string | null
}

/** 시약(CAS/이름)으로 공급 이력 보유 공급자 조회 — 견적 작성 시 보조 */
export async function getCatalogForSubstance(args: { cas?: string | null; name: string }, limit = 5): Promise<CatalogSupplier[]> {
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any).rpc('suppliers_for_substance', {
    p_cas: args.cas ?? null,
    p_name: args.name,
    p_limit: limit,
  })
  return (data ?? []).map((r: {
    supplier_id: string; company_name: string; transactions_count: number;
    avg_unit_price: number | null; last_price: number | null; last_unit: string | null;
    last_date: string | null; tier: string | null; referral_code: string | null
  }) => ({
    supplierId: r.supplier_id,
    companyName: r.company_name,
    transactionsCount: r.transactions_count,
    avgUnitPrice: r.avg_unit_price ?? null,
    lastPrice: r.last_price ?? null,
    lastUnit: r.last_unit ?? null,
    lastDate: r.last_date ?? null,
    tier: r.tier ?? null,
    referralCode: r.referral_code ?? null,
  }))
}

/** 거래 ID로 카탈로그 누적 — completeTransaction에서 호출 */
export async function recordTransactionToCatalog(transactionId: string): Promise<number> {
  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any).rpc('record_transaction_to_catalog', { p_transaction_id: transactionId })
  return typeof data === 'number' ? data : 0
}
