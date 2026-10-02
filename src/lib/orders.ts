import { findMany } from './db'
import type { Order, OrderItem, Product, Payment } from './types'

export function generateOrderNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `TC${stamp}${rand}`
}

// Batch-loads OrderItem (+ its Product) for a set of orders, replacing Prisma's
// `include: { items: { include: { product: true } } }`.
export async function attachOrderItems<T extends Order>(
  orders: T[]
): Promise<(T & { items: (OrderItem & { product: Product | undefined })[] })[]> {
  if (orders.length === 0) return []
  const orderIds = orders.map((o) => o.id)
  const items = await findMany<OrderItem>('OrderItem', { where: { orderId: orderIds } })
  const productIds = [...new Set(items.map((i) => i.productId))]
  const products = productIds.length ? await findMany<Product>('Product', { where: { id: productIds } }) : []
  const productMap = new Map(products.map((p) => [p.id, p]))
  return orders.map((o) => ({
    ...o,
    items: items.filter((i) => i.orderId === o.id).map((i) => ({ ...i, product: productMap.get(i.productId) })),
  }))
}

export async function attachPayments<T extends Order>(orders: T[]): Promise<(T & { payments: Payment[] })[]> {
  if (orders.length === 0) return []
  const orderIds = orders.map((o) => o.id)
  const payments = await findMany<Payment>('Payment', { where: { orderId: orderIds } })
  return orders.map((o) => ({ ...o, payments: payments.filter((p) => p.orderId === o.id) }))
}
