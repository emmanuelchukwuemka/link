import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authData = await getCurrentUser()
  if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { id } = await params
  const category = await prisma.category.findUnique({ where: { id } })
  if (!category || category.scope !== 'store' || category.userId !== authData.userId) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 })
  }

  await prisma.category.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
