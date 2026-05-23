'use client'

import { useFormState } from 'react-dom'
import { submitVerificationFile } from '@/lib/actions/bid-verification'
import { SubmitButton } from '@/components/ui/submit-button'
import { AlertCircle } from 'lucide-react'

interface Props {
  bidId: string
}

type State = { error?: string } | null

async function formAction(prev: State, formData: FormData): Promise<State> {
  const result = await submitVerificationFile(formData)
  return result ?? null
}

export function VerifyForm({ bidId }: Props) {
  const [state, action] = useFormState(formAction, null)

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="bidId" value={bidId} />

      {state?.error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">
          자료 파일 <span className="text-destructive">*</span>
        </label>
        <input
          type="file"
          name="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.heic"
          required
          className="block w-full text-sm text-foreground
            file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0
            file:text-sm file:font-medium file:bg-primary/10 file:text-primary
            hover:file:bg-primary/20
            border border-border rounded-lg p-2 cursor-pointer
            focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          PDF · JPG · PNG · WEBP · HEIC 형식, 최대 10MB
        </p>
      </div>

      <SubmitButton
        pendingText="업로드 중…"
        className="w-full inline-flex items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        자료 제출하기
      </SubmitButton>
    </form>
  )
}
