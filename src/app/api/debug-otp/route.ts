import { NextRequest, NextResponse } from 'next/server'
import { findMany } from '@/lib/db'
import type { OtpCode } from '@/lib/types'

export async function GET(req: NextRequest) {
  const secret = process.env.DEBUG_SECRET
  if (!secret) return NextResponse.json({ error: 'Not available' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  if (searchParams.get('secret') !== secret) return NextResponse.json({ error: 'Not available' }, { status: 404 })

  const email = searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

  const rows = await findMany<OtpCode>('OtpCode', { where: { email }, orderBy: '`createdAt` DESC', limit: 3 })
  return NextResponse.json({ codes: rows })
}
