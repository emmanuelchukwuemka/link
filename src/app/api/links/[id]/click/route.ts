import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Public: fired when a visitor clicks a profile link button
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.link.update({
      where: { id },
      data: { clicks: { increment: 1 } },
    })
    return NextResponse.json({ ok: true })
  } catch {
    // Link may not exist; don't let click tracking break the visitor's navigation
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
