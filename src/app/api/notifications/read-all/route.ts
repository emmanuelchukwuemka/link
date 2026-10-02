import { NextResponse } from 'next/server'
import { updateWhere } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function PATCH() {
  const authData = await getCurrentUser()
  if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  await updateWhere('Notification', { userId: authData.userId, read: false }, { read: true })

  return NextResponse.json({ success: true })
}
