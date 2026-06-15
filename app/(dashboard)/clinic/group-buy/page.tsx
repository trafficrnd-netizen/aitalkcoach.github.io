'use client'

import { useEffect, useState, useTransition } from 'react'
import { Users, Clock, Package, CheckCircle2, LogIn } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { joinGroupBuy, leaveGroupBuy } from '@/lib/actions/medi-negotiate'

const TYPE_LABELS: Record<string, string> = {
  device: '기기소모품', hygiene: '위생/일회용', pack: '팩/마스크',
  care: '클렌징/케어', tool: '시술도구', bed: '베드/침대보호', textile: '타월/가운',
}

interface GroupBuy {
  id: string
  product_name: string
  product_type: string | null
  min_participants: number
  current_count: number
  target_price: number | null
  unit: string
  status: string
  expires_at: string | null
  is_joined: boolean
}

export default function ClinicGroupBuyPage() {
  const [list, setList] = useState<GroupBuy[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [joiningId, setJoiningId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any
      const { data: gbs } = await db
        .from('medi_group_buys')
        .select('id, product_name, product_type, min_participants, current_count, target_price, unit, status, expires_at')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(20)

      if (!gbs?.length) { setList([]); setLoading(false); return }

      let joinedIds = new Set<string>()
      if (user?.id) {
        const { data: parts } = await db
          .from('medi_group_buy_participants')
          .select('group_buy_id')
          .eq('clinic_id', user.id)
        for (const p of (parts ?? [])) joinedIds.add(p.group_buy_id)
      }

      setList(gbs.map((g: GroupBuy) => ({ ...g, is_joined: joinedIds.has(g.id) })))
      setLoading(false)
    }
    load()
  }, [])

  async function handleToggle(gb: GroupBuy) {
    if (!userId) return
    setJoiningId(gb.id)
    startTransition(async () => {
      if (gb.is_joined) {
        await leaveGroupBuy(gb.id)
      } else {
        await joinGroupBuy(gb.id, 1)
      }
      setList(prev => prev.map(g =>
        g.id === gb.id
          ? { ...g, is_joined: !g.is_joined, current_count: g.is_joined ? g.current_count - 1 : g.current_count + 1 }
          : g
      ))
      setJoiningId(null)
    })
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">그룹바이</h1>
          <p className="text-sm text-muted-foreground">여러 의원이 함께 구매하여 단가를 낮춥니다.</p>
        </div>
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-6 text-sm">
        <p className="font-semibold text-primary mb-1">그룹바이란?</p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          동일 제품을 여러 의원이 함께 구매 신청하면 목표 인원 달성 시 공급사에 단체 입찰을 요청합니다.
          목표 인원에 도달하면 BidMedi가 해당 그룹바이를 공급사에 공개 견적 요청으로 전환합니다.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">불러오는 중...</div>
      ) : list.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <Users className="mx-auto mb-3 h-8 w-8 opacity-30" />
          <p>진행 중인 그룹바이가 없습니다.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map(gb => {
            const pct = Math.min(100, Math.round((gb.current_count / gb.min_participants) * 100))
            const reached = gb.current_count >= gb.min_participants
            const daysLeft = gb.expires_at
              ? Math.ceil((new Date(gb.expires_at).getTime() - Date.now()) / 86_400_000)
              : null
            const typeLabel = TYPE_LABELS[gb.product_type ?? ''] ?? gb.product_type ?? ''

            return (
              <li key={gb.id} className="rounded-xl border border-border bg-card px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {typeLabel && <Badge variant="secondary" className="text-[10px]">{typeLabel}</Badge>}
                      {reached && (
                        <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] gap-1">
                          <CheckCircle2 className="h-2.5 w-2.5" /> 목표 달성!
                        </Badge>
                      )}
                    </div>

                    <p className="font-semibold text-sm">{gb.product_name}</p>

                    {gb.target_price && (
                      <p className="text-sm text-primary font-medium">
                        목표 단가: {gb.target_price.toLocaleString('ko-KR')}원/{gb.unit}
                      </p>
                    )}

                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {gb.current_count} / {gb.min_participants}명 참여
                        </span>
                        {daysLeft !== null && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {daysLeft > 0 ? `D-${daysLeft}` : '오늘 마감'}
                          </span>
                        )}
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${reached ? 'bg-emerald-500' : 'bg-primary'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {!userId ? (
                      <a href="/medi/login" className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors">
                        <LogIn className="h-3.5 w-3.5 mr-1" />로그인
                      </a>
                    ) : (
                      <Button
                        size="sm"
                        variant={gb.is_joined ? 'outline' : 'default'}
                        onClick={() => handleToggle(gb)}
                        disabled={isPending && joiningId === gb.id}
                        className={gb.is_joined ? 'border-primary text-primary' : ''}
                      >
                        {isPending && joiningId === gb.id
                          ? '...'
                          : gb.is_joined ? '참여 취소' : '참여하기'}
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
