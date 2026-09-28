'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Tag } from 'lucide-react'
import { ProductsServicesTabs } from '@/components/ProductsServicesTabs'

type Category = { id: string; name: string; position: number }
type StoreProduct = { category: string | null }

export default function StoreCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/store-categories').then((r) => r.json()),
      fetch('/api/store-products').then((r) => r.json()),
    ]).then(([catData, prodData]) => {
      if (catData.categories) setCategories(catData.categories)
      if (prodData.products) {
        const c: Record<string, number> = {}
        for (const p of prodData.products as StoreProduct[]) {
          if (p.category) c[p.category] = (c[p.category] || 0) + 1
        }
        setCounts(c)
      }
      setLoading(false)
    })
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError('')
    const res = await fetch('/api/store-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    })
    const data = await res.json()
    if (!res.ok) setError(data.error || 'Could not add category')
    else {
      setCategories((prev) => [...prev, data.category])
      setName('')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string, categoryName: string) => {
    if (!confirm(`Delete "${categoryName}"? Existing products keep their current category text, but it will no longer appear in the picker.`)) return
    const res = await fetch(`/api/store-categories/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setCategories((prev) => prev.filter((c) => c.id !== id))
    } else {
      const data = await res.json()
      alert(data.error || 'Could not delete category')
    }
  }

  if (loading) return <div className="text-center py-20 text-black">Loading...</div>

  return (
    <div className="max-w-2xl space-y-6">
      <ProductsServicesTabs />
      <div>
        <h1 className="text-2xl font-bold">Categories</h1>
        <p className="text-black text-sm mt-1">Organize the products shown on your profile.</p>
      </div>

      <form onSubmit={handleAdd} className="bg-white rounded-3xl p-5 shadow-sm flex gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category name"
          className="flex-1 px-4 py-2.5 rounded-lg bg-gray-100 outline-none text-sm text-black"
        />
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="px-5 py-2.5 rounded-full font-semibold text-sm bg-black text-white hover:bg-gray-800 disabled:opacity-60 flex items-center gap-2 whitespace-nowrap"
        >
          <Plus size={16} /> Add
        </button>
      </form>
      {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">{error}</div>}

      {categories.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center text-black shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Tag size={32} className="text-gray-400" />
          </div>
          No categories yet — add your first one above.
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm divide-y divide-gray-100">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-5 py-4">
              <span className="font-semibold text-black">{c.name}</span>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-gray-400">{counts[c.name] || 0} product{(counts[c.name] || 0) === 1 ? '' : 's'}</span>
                <button onClick={() => handleDelete(c.id, c.name)} className="text-gray-400 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
