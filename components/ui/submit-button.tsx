'use client'

import { useFormStatus } from 'react-dom'
import { cn } from '@/lib/utils'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pendingText?: string
}

/**
 * Server Action <form> 안에서 사용하는 버튼.
 * 제출 중 자동으로 disabled 처리 + pendingText 표시.
 */
export function SubmitButton({ children, pendingText = '처리 중…', className, ...props }: Props) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending || props.disabled}
      className={cn('transition-opacity disabled:opacity-60 disabled:cursor-not-allowed', className)}
      {...props}
    >
      {pending ? pendingText : children}
    </button>
  )
}
