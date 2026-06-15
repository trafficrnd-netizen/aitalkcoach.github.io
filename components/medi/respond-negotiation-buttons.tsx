'use client'

import { useTransition, useState } from 'react'
import { Button } from '@/components/ui/button'
import { respondNegotiation } from '@/lib/actions/medi-negotiate'
import { CheckCircle2, XCircle } from 'lucide-react'

export function RespondNegotiationButtons({ negotiationId }: { negotiationId: string }) {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState<'accepted' | 'rejected' | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handle(action: 'accepted' | 'rejected') {
    startTransition(async () => {
      const result = await respondNegotiation(negotiationId, action)
      if (result?.error) setError(result.error)
      else setDone(action)
    })
  }

  if (done === 'accepted') return (
    <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600">
      <CheckCircle2 className="h-4 w-4" /> 수락됨
    </span>
  )
  if (done === 'rejected') return (
    <span className="flex items-center gap-1 text-sm font-semibold text-red-500">
      <XCircle className="h-4 w-4" /> 거절됨
    </span>
  )

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button
        size="sm"
        onClick={() => handle('accepted')}
        disabled={isPending}
        className="bg-emerald-600 hover:bg-emerald-700 gap-1"
      >
        <CheckCircle2 className="h-3.5 w-3.5" /> 수락
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => handle('rejected')}
        disabled={isPending}
        className="border-red-300 text-red-600 hover:bg-red-50 gap-1"
      >
        <XCircle className="h-3.5 w-3.5" /> 거절
      </Button>
    </div>
  )
}
