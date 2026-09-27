import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { checkSubscriptionExpiry } from '@/lib/notify'

export async function GET() {
  try {
    const authData = await getCurrentUser()
    
    if (!authData) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: authData.userId },
      select: {
        id: true,
        email: true,
        username: true,
        accountType: true,
        displayName: true,
        jobTitle: true,
        department: true,
        bio: true,
        aboutText: true,
        avatarUrl: true,
        phone: true,
        whatsapp: true,
        website: true,
        address: true,
        businessHours: true,
        leadFormEnabled: true,
        theme: true,
        template: true,
        bgType: true,
        bgColor: true,
        bgGradient: true,
        bgImage: true,
        buttonStyle: true,
        buttonSize: true,
        buttonColor: true,
        buttonTextColor: true,
        fontFamily: true,
        textColor: true,
        plan: true,
        planExpiresAt: true,
        businessId: true,
        links: {
          orderBy: { position: 'asc' }
        },
        socialLinks: {
          orderBy: { position: 'asc' }
        },
        ownedBusiness: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await checkSubscriptionExpiry(user.id)

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Me error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
