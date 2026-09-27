import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function PATCH() {
  const authData = await getCurrentUser()
  if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  await prisma.notification.updateMany({
    where: { userId: authData.userId, read: false },
    data: { read: true },
  })

  return NextResponse.json({ success: true })
}
