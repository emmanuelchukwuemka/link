import { NextRequest, NextResponse } from 'next/server'
import { findById, removeById } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import type { SocialLink } from '@/lib/types'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authData = await getCurrentUser()
    if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { id } = await params

    const existing = await findById<SocialLink>('SocialLink', id)
    if (!existing || existing.userId !== authData.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await removeById('SocialLink', id)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
