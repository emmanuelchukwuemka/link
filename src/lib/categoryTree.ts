import type { Category, Product } from './types'

export type CategoryNode = {
  id: string
  name: string
  position: number
  parentId: string | null
  directCount: number
  totalCount: number
  children: CategoryNode[]
}

export function buildCategoryTree(categories: Category[], products: Pick<Product, 'category'>[]): CategoryNode[] {
  const directCounts = new Map<string, number>()
  for (const p of products) directCounts.set(p.category, (directCounts.get(p.category) || 0) + 1)

  const byId = new Map<string, CategoryNode>()
  for (const c of categories) {
    byId.set(c.id, {
      id: c.id,
      name: c.name,
      position: c.position,
      parentId: c.parentId,
      directCount: directCounts.get(c.name) || 0,
      totalCount: 0,
      children: [],
    })
  }

  const roots: CategoryNode[] = []
  for (const c of categories) {
    const node = byId.get(c.id)!
    if (c.parentId && byId.has(c.parentId)) byId.get(c.parentId)!.children.push(node)
    else roots.push(node)
  }

  const computeTotal = (node: CategoryNode): number => {
    node.totalCount = node.directCount + node.children.reduce((sum, child) => sum + computeTotal(child), 0)
    return node.totalCount
  }
  roots.forEach(computeTotal)

  return roots
}
