import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const authData = await getCurrentUser()
  if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const categories = await prisma.category.findMany({
    where: { scope: 'store', userId: authData.userId },
    orderBy: { position: 'asc' },
  })
  return NextResponse.json({ categories })
}

export async function POST(req: NextRequest) {
  const authData = await getCurrentUser()
  if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { name } = await req.json()
  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
  }

  const last = await prisma.category.findFirst({
    where: { scope: 'store', userId: authData.userId },
    orderBy: { position: 'desc' },
  })

  try {
    const category = await prisma.category.create({
      data: { name: name.trim(), scope: 'store', userId: authData.userId, position: last ? last.position + 1 : 0 },
    })
    return NextResponse.json({ category }, { status: 201 })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json({ error: 'That category already exists' }, { status: 409 })
    }
    throw e
  }
}
