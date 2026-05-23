'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [institution, setInstitution] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    const res = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, institution }),
    })
    const data = await res.json()

    if (res.ok) {
      setStatus('done')
      setMessage('등록되었습니다! 서비스 오픈 시 이메일로 알려드립니다.')
    } else {
      setStatus('error')
      setMessage(data.error ?? '오류가 발생했습니다.')
    }
  }

  if (status === 'done') {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/5 px-6 py-8 text-center">
        <div className="text-3xl mb-3">✓</div>
        <p className="font-semibold text-lg mb-1">등록 완료!</p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          type="text"
          placeholder="이름"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <Input
          type="text"
          placeholder="소속 기관"
          value={institution}
          onChange={e => setInstitution(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="이메일 주소 *"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="flex-1"
        />
        <Button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? '등록 중...' : '사전 등록'}
        </Button>
      </div>
      {status === 'error' && (
        <p className="text-sm text-destructive">{message}</p>
      )}
      <p className="text-xs text-muted-foreground">
        스팸 없음. 오픈 소식과 베타 초대장만 발송됩니다.
      </p>
    </form>
  )
}
