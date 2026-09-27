import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function PUT(req: NextRequest) {
  try {
    const authData = await getCurrentUser()
    if (!authData) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { links } = await req.json() // Array of {id, position}

    if (!Array.isArray(links)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 })
    }

    // Process all updates in a transaction
    await prisma.$transaction(
      links.map((link: { id: string, position: number }) => 
        prisma.link.updateMany({
          where: { 
            id: link.id,
            userId: authData.userId // Ensure user owns the link
          },
          data: { position: link.position }
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
