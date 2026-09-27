export function buttonSizePadding(size: string): string {
  if (size === 'small') return '0.5rem 1rem'
  if (size === 'large') return '1.25rem 1.5rem'
  return '0.85rem 1.25rem' // medium
}

export function buttonSizeFontClass(size: string): string {
  if (size === 'small') return 'text-sm'
  if (size === 'large') return 'text-lg'
  return 'text-base'
}
