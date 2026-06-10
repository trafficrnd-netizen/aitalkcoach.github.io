import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getQuoteMonitorRows } from '@/lib/admin/quote-monitor'

export const runtime = 'nodejs'

async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  return cookieStore.get('admin_session')?.value === 'authenticated'
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const rows = await getQuoteMonitorRows(100)
  return NextResponse.json({ rows })
}
