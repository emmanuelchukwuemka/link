import { NextRequest, NextResponse } from 'next/server'
import { findOne, insert } from '@/lib/db'
import type { User } from '@/lib/types'

// Public QR scan destination: printed QR codes point here instead of directly
// at the profile, so a scan can be distinguished from a plain link click.
export async function GET(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params

  const user = await findOne<User>('User', { username })

  if (!user) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  try {
    await insert('AnalyticsEvent', { userId: user.id, type: 'QR_SCAN' })
  } catch (err) {
    console.error('QR scan analytics error:', err)
  }

  return NextResponse.redirect(new URL(`/${username}?src=qr`, req.url))
}
