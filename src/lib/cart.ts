export type CartItem = {
  productId: string
  name: string
  slug: string
  image: string | null
  unitPrice: number
  color?: string
  customization: boolean
  customizationPrice: number
  customizationNotes?: string
  customizationFileUrl?: string
  quantity: number
}

const KEY = 'tapconnect-cart'

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

function save(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items))
  window.dispatchEvent(new Event('cart-updated'))
}

export function addToCart(item: CartItem) {
  const items = getCart()
  const existing = items.find(
    (i) => i.productId === item.productId && i.color === item.color && i.customization === item.customization
  )
  if (existing) {
    existing.quantity += item.quantity
  } else {
    items.push(item)
  }
  save(items)
}

export function updateCartQuantity(index: number, quantity: number) {
  const items = getCart()
  if (quantity <= 0) {
    items.splice(index, 1)
  } else {
    items[index].quantity = quantity
  }
  save(items)
}

export function removeFromCart(index: number) {
  const items = getCart()
  items.splice(index, 1)
  save(items)
}

export function clearCart() {
  save([])
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + (i.unitPrice + (i.customization ? i.customizationPrice : 0)) * i.quantity, 0)
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0)
}
