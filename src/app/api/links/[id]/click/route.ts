import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// Public: fired when a visitor clicks a profile link button
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await query('UPDATE `Link` SET `clicks` = `clicks` + 1 WHERE `id` = ?', [id])
    return NextResponse.json({ ok: true })
  } catch {
    // Link may not exist; don't let click tracking break the visitor's navigation
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
