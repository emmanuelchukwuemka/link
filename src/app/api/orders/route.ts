import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { generateOrderNumber } from '@/lib/orders'
import { initializeTransaction, isPaystackConfigured } from '@/lib/paystack'

type CartItemInput = {
  productId: string
  color?: string
  customization?: boolean
  customizationNotes?: string
  customizationFileUrl?: string
  quantity: number
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      items, customerName, customerEmail, customerPhone,
      state, city, address, deliveryInstructions,
    } = body as {
      items: CartItemInput[]
      customerName: string
      customerEmail: string
      customerPhone: string
      state: string
      city: string
      address: string
      deliveryInstructions?: string
    }

    if (!items?.length || !customerName || !customerEmail || !customerPhone || !state || !city || !address) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Server-side price computation only — never trust client-provided prices.
    const productIds = [...new Set(items.map(i => i.productId))]
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } })
    const productMap = new Map(products.map(p => [p.id, p]))

    let subtotal = 0
    const orderItemsData = items.map((item) => {
      const product = productMap.get(item.productId)
      if (!product) throw new Error(`Product ${item.productId} not found`)
      const qty = Math.max(1, Math.min(1000, parseInt(String(item.quantity), 10) || 1))
      const unitPrice = (product.priceSale ?? product.priceRegular) + (item.customization ? product.customizationPrice : 0)
      subtotal += unitPrice * qty
      return {
        productId: product.id,
        color: item.color || null,
        customization: !!item.customization,
        customizationNotes: item.customization ? (item.customizationNotes?.slice(0, 2000) || null) : null,
        customizationFileUrl: item.customization ? (item.customizationFileUrl || null) : null,
        quantity: qty,
        unitPrice,
      }
    })

    const zone = await prisma.deliveryZone.findFirst({
      where: { name: { equals: city } },
    })
    const deliveryFee = zone?.fee ?? (await prisma.deliveryZone.findUnique({ where: { name: 'Other' } }))?.fee ?? 0

    const total = subtotal + deliveryFee
    const orderNumber = generateOrderNumber()

    const authData = await getCurrentUser()

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: authData?.userId,
        customerName,
        customerEmail,
        customerPhone,
        state,
        city,
        address,
        deliveryInstructions,
        deliveryFee,
        subtotal,
        total,
        items: { create: orderItemsData },
      },
      include: { items: { include: { product: true } } },
    })

    if (!isPaystackConfigured()) {
      // Dev fallback: no live Paystack keys configured yet. The order is created
      // and payment can be simulated so the rest of the pipeline is testable.
      await prisma.payment.create({
        data: { orderId: order.id, reference: orderNumber, amount: total, status: 'pending' },
      })
      return NextResponse.json({ order, devMode: true }, { status: 201 })
    }

    const origin = req.nextUrl.origin
    const tx = await initializeTransaction({
      email: customerEmail,
      amountNaira: total,
      reference: orderNumber,
      callbackUrl: `${origin}/api/payments/verify`,
    })

    await prisma.payment.create({
      data: { orderId: order.id, reference: orderNumber, amount: total, status: 'pending' },
    })

    return NextResponse.json({ order, authorizationUrl: tx.authorization_url }, { status: 201 })
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
