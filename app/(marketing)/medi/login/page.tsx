import { Suspense } from 'react'
import { MediLoginForm } from './medi-login-form'

export const metadata = { title: 'BidMedi 로그인' }

export default function MediLoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
      <Suspense>
        <MediLoginForm />
      </Suspense>
    </div>
  )
}
