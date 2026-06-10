'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { followSupplierByCode } from '@/lib/actions/supplier-program'
import { Heart, Check } from 'lucide-react'

export function FollowSupplierButton({ code, companyName }: { code: string; companyName: string }) {
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  function follow() {
    setErr(null)
    startTransition(async () => {
      const r = await followSupplierByCode(code)
      if (!r.ok) {
        setErr(r.reason === 'code_inactive' ? '비활성 코드입니다.' : '등록 실패')
        return
      }
      setDone(true)
    })
  }

  if (done) {
    return (
      <div className="rounded-md bg-secondary/15 border border-secondary/30 px-3 py-2.5 text-sm text-secondary-foreground flex items-center gap-2">
        <Check className="h-4 w-4 shrink-0" />
        <span>{companyName} 팔로우 완료 — 향후 견적 요청 시 우선 통지됩니다.</span>
      </div>
    )
  }

  return (
    <>
      <Button onClick={follow} disabled={pending} className="w-full gap-1.5">
        <Heart className="h-4 w-4" />
        {pending ? '등록 중…' : '이 공급자 팔로우'}
      </Button>
      {err && <p className="text-xs text-destructive">{err}</p>}
    </>
  )
}
