import { NextRequest, NextResponse } from 'next/server'
import { findMany, findOne, insert, withTransaction } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { generateOrderNumber } from '@/lib/orders'
import { initializeTransaction, isPaystackConfigured } from '@/lib/paystack'
import { getCatalogProductById } from '@/lib/catalog'
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
    let products: Product[] = []
    try {
      products = await findMany<Product>('Product', { where: { id: productIds } })
    } catch {}

    const productMap = new Map(products.map(p => [p.id, p]))

    // Ensure all 100 catalog products are resolvable even if not yet in DB
    for (const pid of productIds) {
      if (!productMap.has(pid)) {
        const catProd = getCatalogProductById(pid)
        if (catProd) {
          productMap.set(pid, catProd as unknown as Product)
          try {
            await insert('Product', {
              id: catProd.id,
              name: catProd.name,
              slug: catProd.slug,
              subtitle: catProd.subtitle,
              category: catProd.category,
              sku: catProd.sku,
              stock: catProd.stock,
              description: catProd.description,
              images: catProd.images,
              length: catProd.length,
              width: catProd.width,
              colors: catProd.colors,
              priceRegular: catProd.priceRegular,
              priceSale: catProd.priceSale,
              productionTime: catProd.productionTime,
              availability: catProd.availability,
              customizationPrice: catProd.customizationPrice,
            }, { id: false })
          } catch {}
        }
      }
    }

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

    let zone: DeliveryZone | null = null
    try {
      zone = await findOne<DeliveryZone>('DeliveryZone', { name: city })
      if (!zone) {
        zone = await findOne<DeliveryZone>('DeliveryZone', { name: 'Other' })
      }
    } catch {}

    const deliveryFee = zone?.fee ?? (subtotal >= 30000 ? 0 : 3500)
    const total = subtotal + deliveryFee
    const orderNumber = generateOrderNumber()

    const authData = await getCurrentUser()

    let order: Order
    try {
      order = await withTransaction(async (tx) => {
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
    } catch {
      // In-memory order fallback if DB offline
      order = {
        id: 'ord-' + Date.now(),
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
        status: 'pending',
        paymentStatus: 'pending',
        profileSetupRequired: false,
        courierName: null,
        trackingNumber: null,
        shippedAt: null,
        deliveredAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }

    let orderItemRows: OrderItem[] = []
    try {
      orderItemRows = await findMany<OrderItem>('OrderItem', { where: { orderId: order.id } })
    } catch {}

    const orderWithItems = {
      ...order,
      items: orderItemRows.length > 0
        ? orderItemRows.map((i) => ({ ...i, product: productMap.get(i.productId) }))
        : orderItemsData.map((i, idx) => ({ id: 'item-' + idx, orderId: order.id, ...i, product: productMap.get(i.productId) })),
    }

    if (!isPaystackConfigured()) {
      // Dev fallback
      try {
        await insert('Payment', { orderId: order.id, reference: orderNumber, amount: total, status: 'pending' })
      } catch {}
      return NextResponse.json({ order: orderWithItems, devMode: true }, { status: 201 })
    }

    const origin = req.nextUrl.origin
    const tx2 = await initializeTransaction({
      email: customerEmail,
      amountNaira: total,
      reference: orderNumber,
      callbackUrl: `${origin}/api/payments/verify`,
    })

    try {
      await insert('Payment', { orderId: order.id, reference: orderNumber, amount: total, status: 'pending' })
    } catch {}

    return NextResponse.json({ order: orderWithItems, authorizationUrl: tx2.authorization_url }, { status: 201 })
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
