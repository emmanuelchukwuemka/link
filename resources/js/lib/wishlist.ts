const KEY = 'tapconnect-wishlist';

export function getWishlist(): number[] {
    if (typeof window === 'undefined') return [];
    try {
        return JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch {
        return [];
    }
}

function save(ids: number[]) {
    localStorage.setItem(KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event('wishlist-updated'));
}

export function isWishlisted(productId: number): boolean {
    return getWishlist().includes(productId);
}

export function toggleWishlist(productId: number): boolean {
    const ids = getWishlist();
    const idx = ids.indexOf(productId);
    if (idx === -1) {
        ids.push(productId);
        save(ids);
        return true;
    }
    ids.splice(idx, 1);
    save(ids);
    return false;
}
