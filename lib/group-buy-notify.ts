/**
 * 그룹 바이 클러스터 형성 시 매칭 공급자에게 알림
 * 일별 cron에서 호출. 같은 시약을 N명+ 요청 중인 클러스터를,
 * 해당 카테고리를 취급하는 공급자에게 1일 1회 요약 메일로 전달.
 */
import { createClient } from '@supabase/supabase-js'
import { resend, FROM_EMAIL } from '@/lib/resend'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface Cluster {
  substance_name: string
  cas_number: string | null
  researcher_count: number
  request_count: number
  total_qty: number
  unit: string | null
}

export async function notifyGroupBuys(): Promise<{ clusters: number; emailed: number }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any

  // 연구자 3명 이상 클러스터만 (알림 가치 있는 규모)
  const { data: clusters } = await db.rpc('current_group_buys', { p_days: 7, p_min_researchers: 3 })
  const list = (clusters ?? []) as Cluster[]
  if (list.length === 0) return { clusters: 0, emailed: 0 }

  // 활성 공급자 (이메일 + 카테고리) 조회
  const { data: suppliers } = await db
    .from('supplier_profiles')
    .select('user_id, company_name')
    .limit(500)
  if (!suppliers || suppliers.length === 0) return { clusters: list.length, emailed: 0 }

  // 클러스터 요약 HTML (상위 8개)
  const top = list.slice(0, 8)
  const rows = top.map((c) =>
    `<tr>
       <td style="padding:8px 12px;border-bottom:1px solid #eee;">${c.substance_name}${c.cas_number ? ` <span style="color:#999;font-size:12px">(${c.cas_number})</span>` : ''}</td>
       <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${c.researcher_count}명</td>
       <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${Number(c.total_qty).toLocaleString()}${c.unit ? ` ${c.unit}` : ''}</td>
     </tr>`
  ).join('')

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;">
      <h2 style="color:#1E2F52;margin-bottom:4px;">📈 이번 주 그룹 바이 기회</h2>
      <p style="color:#6b7280;font-size:14px;margin-top:0;">여러 연구자가 동시에 요청 중인 시약입니다. 묶음 단가로 견적을 제출하면 낙찰 확률이 높습니다.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;">
        <thead>
          <tr style="background:#F3EDE2;">
            <th style="padding:8px 12px;text-align:left;">시약</th>
            <th style="padding:8px 12px;text-align:center;">요청 연구자</th>
            <th style="padding:8px 12px;text-align:right;">합산 수량</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <a href="https://ai-traffic.kr/supplier/marketplace" style="display:inline-block;background:#F4A261;color:#1A2236;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">입찰 광장에서 견적 제출 →</a>
      <p style="font-size:11px;color:#9ca3af;margin-top:20px;">ai-traffic.kr · 그룹 바이 알림은 클러스터가 형성된 주에만 발송됩니다.</p>
    </div>`

  // 공급자 이메일 수집 (auth.users에서)
  let emailed = 0
  const recipients: string[] = []
  for (const s of suppliers) {
    try {
      const { data: u } = await db.auth.admin.getUserById(s.user_id)
      if (u?.user?.email) recipients.push(u.user.email)
    } catch { /* skip */ }
  }

  // Resend 일일 한도 보호 — 배치 발송 (최대 50명)
  const batch = recipients.slice(0, 50)
  if (batch.length > 0) {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: batch,
        subject: `[ai-traffic.kr] 📈 이번 주 그룹 바이 기회 ${top.length}건`,
        html,
      })
      emailed = batch.length
    } catch (e) {
      console.error('[notifyGroupBuys] 발송 실패:', e)
    }
  }

  return { clusters: list.length, emailed }
}
