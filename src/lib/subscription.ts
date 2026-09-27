export const PRO_PLAN_PRICE_NAIRA = 10000
export const FREE_LINK_LIMIT = 5
export const FREE_TEMPLATE = 'minimal'
export const FREE_FONT = 'Inter'

export function isProActive(plan: string, planExpiresAt: Date | null): boolean {
  return plan === 'pro' && (!planExpiresAt || planExpiresAt > new Date())
}

export function extendProExpiry(current: Date | null): Date {
  const base = current && current.getTime() > Date.now() ? current : new Date()
  const next = new Date(base)
  next.setFullYear(next.getFullYear() + 1)
  return next
}

export type BusinessPlanName = 'free' | 'tier10' | 'tier25' | 'tier50' | 'tier100' | 'enterprise'

export const BUSINESS_PLANS: Record<BusinessPlanName, { label: string; employeeLimit: number; priceNaira: number | null }> = {
  free: { label: 'Free', employeeLimit: 3, priceNaira: 0 },
  tier10: { label: 'Team 10', employeeLimit: 10, priceNaira: 50000 },
  tier25: { label: 'Team 25', employeeLimit: 25, priceNaira: 100000 },
  tier50: { label: 'Team 50', employeeLimit: 50, priceNaira: 180000 },
  tier100: { label: 'Team 100', employeeLimit: 100, priceNaira: 300000 },
  enterprise: { label: 'Enterprise', employeeLimit: Infinity, priceNaira: null },
}

export function businessEmployeeLimit(plan: string): number {
  return BUSINESS_PLANS[(plan as BusinessPlanName)]?.employeeLimit ?? BUSINESS_PLANS.free.employeeLimit
}
