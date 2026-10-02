import { NextRequest, NextResponse } from 'next/server'
import { query, newId } from '@/lib/db'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
    }

    await query(
      'INSERT INTO `NewsletterSubscriber` (`id`, `email`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `email` = `email`',
      [newId(), email]
    )

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    console.error('Newsletter signup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
