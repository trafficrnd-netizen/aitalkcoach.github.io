'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle, Loader2, MessageSquare } from 'lucide-react'

interface Props {
  onVerified: (phone: string) => void
  label?: string
}

function normalizePhone(raw: string): string {
  return raw.replace(/[\s\-().]/g, '')
}

/** 수신번호 표시용 포맷 (하이픈 없는 숫자 → 읽기 편한 형식) */
function formatReceivingNumber(num: string): string {
  const d = num.replace(/\D/g, '')
  if (d.length === 8)  return `${d.slice(0, 4)}-${d.slice(4)}`          // 1666-3538
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` // 070-XXX-XXXX
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}` // 010-XXXX-XXXX
  return num
}

export function PhoneVerify({ onVerified, label = '휴대폰 번호 (본인인증 필수)' }: Props) {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [receivingNumber, setReceivingNumber] = useState('')
  const [step, setStep] = useState<'idle' | 'sent' | 'verified'>('idle')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)

  function startCountdown() {
    setCountdown(300)
    const id = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(id); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  async function handleGetCode() {
    setError('')
    const normalized = normalizePhone(phone)
    if (!/^0(1[016789])\d{7,8}$/.test(normalized)) {
      setError('올바른 휴대폰 번호를 입력해주세요.')
      return
    }
    setLoading(true)
    const res = await fetch('/api/phone-otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: normalized }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error ?? '코드 생성에 실패했습니다.')
      return
    }
    setCode(data.code)
    setReceivingNumber(data.receivingNumber ?? '')
    setStep('sent')
    startCountdown()
  }

  async function handleVerify() {
    setError('')
    setVerifying(true)
    const normalized = normalizePhone(phone)
    const res = await fetch('/api/phone-otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: normalized }),
    })
    const data = await res.json()
    setVerifying(false)
    if (!res.ok) {
      setError(data.error ?? '인증에 실패했습니다.')
      return
    }
    setStep('verified')
    onVerified(normalized)
  }

  const mmss = `${String(Math.floor(countdown / 60)).padStart(2, '0')}:${String(countdown % 60).padStart(2, '0')}`
  // SMS 앱 딥링크 — 수신번호·코드 자동 입력
  const smsHref = receivingNumber
    ? `sms:${receivingNumber}?body=${encodeURIComponent(code)}`
    : '#'

  if (step === 'verified') {
    return (
      <div className="space-y-1.5">
        <p className="text-sm font-medium">{label}</p>
        <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{phone} — 인증 완료</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        {label} <span className="text-destructive">*</span>
      </p>

      {/* 전화번호 입력 + 코드 요청 */}
      <div className="flex gap-2">
        <Input
          type="tel"
          value={phone}
          onChange={e => {
            setPhone(e.target.value)
            setStep('idle')
            setCode('')
            setError('')
          }}
          placeholder="010-0000-0000"
          disabled={step === 'sent' && countdown > 0}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleGetCode}
          disabled={loading || !phone}
          className="shrink-0"
        >
          {loading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : step === 'sent' ? '재시도' : '코드 받기'}
        </Button>
      </div>

      {/* MO 인증 안내 (코드 발급 후 표시) */}
      {step === 'sent' && code && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
          {/* 상단: 안내 + 타이머 */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-blue-800">
              아래 코드를 문자로 보내주세요
            </p>
            {countdown > 0 && (
              <span className="text-xs text-muted-foreground tabular-nums">{mmss}</span>
            )}
          </div>

          {/* 코드 표시 */}
          <div className="text-center py-1">
            <p className="text-3xl font-bold tracking-[0.35em] text-blue-900 select-all">
              {code}
            </p>
            {receivingNumber && (
              <p className="text-xs text-blue-600 mt-1.5">
                수신번호: <span className="font-semibold">{formatReceivingNumber(receivingNumber)}</span>
              </p>
            )}
          </div>

          {/* SMS 앱 바로가기 버튼 */}
          {receivingNumber && (
            <a
              href={smsHref}
              className="flex items-center justify-center gap-2 w-full rounded-md bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 active:bg-blue-800 transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              SMS 앱으로 바로 보내기
            </a>
          )}

          <p className="text-xs text-blue-600 text-center leading-relaxed">
            또는 문자 앱에서 {formatReceivingNumber(receivingNumber)}로 직접 발송 후
          </p>

          {/* 인증 확인 버튼 */}
          <Button
            type="button"
            onClick={handleVerify}
            disabled={verifying || countdown === 0}
            className="w-full"
          >
            {verifying && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {verifying ? '확인 중…' : '인증 확인'}
          </Button>
        </div>
      )}

      {/* 만료 안내 */}
      {countdown === 0 && step === 'sent' && (
        <p className="text-xs text-amber-600">
          코드가 만료되었습니다. &apos;재시도&apos;를 눌러 새 코드를 받아주세요.
        </p>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
