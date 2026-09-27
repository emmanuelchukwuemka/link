import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

const VALID_STATUSES = ['new', 'contacted', 'interested', 'converted', 'lost']

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authData = await getCurrentUser()
    if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { id } = await params
    const { status } = await req.json()

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const existing = await prisma.lead.findUnique({ where: { id } })
    if (!existing || existing.ownerId !== authData.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const lead = await prisma.lead.update({ where: { id }, data: { status } })
    return NextResponse.json({ lead })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
