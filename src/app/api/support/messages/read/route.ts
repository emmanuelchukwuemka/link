import { NextResponse } from 'next/server'
import { updateWhere } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function POST() {
  const authData = await getCurrentUser()
  if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  await updateWhere('SupportMessage', { userId: authData.userId, sender: 'admin', read: false }, { read: true })

  return NextResponse.json({ success: true })
}
