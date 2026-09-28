const KEY = 'tapconnect-wishlist'

export function getWishlist(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

function save(ids: string[]) {
  localStorage.setItem(KEY, JSON.stringify(ids))
  window.dispatchEvent(new Event('wishlist-updated'))
}

export function isWishlisted(productId: string): boolean {
  return getWishlist().includes(productId)
}

export function toggleWishlist(productId: string): boolean {
  const ids = getWishlist()
  const idx = ids.indexOf(productId)
  if (idx === -1) {
    ids.push(productId)
    save(ids)
    return true
  }
  ids.splice(idx, 1)
  save(ids)
  return false
}
