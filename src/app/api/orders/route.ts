import { NextRequest, NextResponse } from 'next/server'
import { findMany, findOne, insert, withTransaction } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { generateOrderNumber } from '@/lib/orders'
import { initializeTransaction, isPaystackConfigured } from '@/lib/paystack'
import type { Product, DeliveryZone, Order, OrderItem } from '@/lib/types'

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
    const products = await findMany<Product>('Product', { where: { id: productIds } })
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

    const zone = await findOne<DeliveryZone>('DeliveryZone', { name: city })
    const deliveryFee = zone?.fee ?? (await findOne<DeliveryZone>('DeliveryZone', { name: 'Other' }))?.fee ?? 0

    const total = subtotal + deliveryFee
    const orderNumber = generateOrderNumber()

    const authData = await getCurrentUser()

    const order = await withTransaction(async (tx) => {
      const createdOrder = await insert<Order>(
        'Order',
        {
          orderNumber,
          userId: authData?.userId ?? null,
          customerName,
          customerEmail,
          customerPhone,
          state,
          city,
          address,
          deliveryInstructions: deliveryInstructions ?? null,
          deliveryFee,
          subtotal,
          total,
        },
        undefined,
        tx
      )
      for (const item of orderItemsData) {
        await insert('OrderItem', { ...item, orderId: createdOrder.id }, undefined, tx)
      }
      return createdOrder
    })
    const orderItemRows = await findMany<OrderItem>('OrderItem', { where: { orderId: order.id } })
    const orderWithItems = { ...order, items: orderItemRows.map((i) => ({ ...i, product: productMap.get(i.productId) })) }

    if (!isPaystackConfigured()) {
      // Dev fallback: no live Paystack keys configured yet. The order is created
      // and payment can be simulated so the rest of the pipeline is testable.
      await insert('Payment', { orderId: order.id, reference: orderNumber, amount: total, status: 'pending' })
      return NextResponse.json({ order: orderWithItems, devMode: true }, { status: 201 })
    }

    const origin = req.nextUrl.origin
    const tx2 = await initializeTransaction({
      email: customerEmail,
      amountNaira: total,
      reference: orderNumber,
      callbackUrl: `${origin}/api/payments/verify`,
    })

    await insert('Payment', { orderId: order.id, reference: orderNumber, amount: total, status: 'pending' })

    return NextResponse.json({ order: orderWithItems, authorizationUrl: tx2.authorization_url }, { status: 201 })
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
