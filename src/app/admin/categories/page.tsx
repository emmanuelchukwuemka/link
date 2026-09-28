'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Tag, Pencil, Check, X } from 'lucide-react'

type Category = { id: string; name: string; position: number }

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/categories').then((r) => r.json()),
      fetch('/api/admin/products').then((r) => r.json()),
    ]).then(([catData, prodData]) => {
      if (catData.categories) setCategories(catData.categories)
      if (prodData.products) {
        const c: Record<string, number> = {}
        for (const p of prodData.products) c[p.category] = (c[p.category] || 0) + 1
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
    const res = await fetch('/api/admin/categories', {
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

  const startEdit = (c: Category) => {
    setEditingId(c.id)
    setEditingName(c.name)
    setError('')
  }

  const saveEdit = async () => {
    if (!editingName.trim() || !editingId) return
    const res = await fetch(`/api/admin/categories/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editingName.trim() }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Could not rename category')
      return
    }
    setCategories((prev) => prev.map((c) => (c.id === editingId ? data.category : c)))
    setEditingId(null)
  }

  const handleDelete = async (id: string, categoryName: string) => {
    if (!confirm(`Delete "${categoryName}"? Existing products keep their current category text, but it will no longer appear in the picker.`)) return
    const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setCategories((prev) => prev.filter((c) => c.id !== id))
    } else {
      const data = await res.json()
      alert(data.error || 'Could not delete category')
    }
  }

  if (loading) return <div className="text-center py-20 text-black">Loading...</div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-black">Categories</h1>
        <p className="text-gray-600 text-sm mt-1">Organize your TapConnect product catalog.</p>
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
          className="px-5 py-2.5 rounded-full font-semibold text-sm bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 flex items-center gap-2 whitespace-nowrap"
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
              {editingId === c.id ? (
                <input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                  autoFocus
                  className="flex-1 px-3 py-1.5 rounded-lg bg-gray-100 outline-none text-sm text-black mr-3"
                />
              ) : (
                <span className="font-semibold text-black">{c.name}</span>
              )}
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-gray-400">{counts[c.name] || 0} product{(counts[c.name] || 0) === 1 ? '' : 's'}</span>
                {editingId === c.id ? (
                  <>
                    <button onClick={saveEdit} className="text-green-600 hover:text-green-700">
                      <Check size={16} />
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-black">
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(c)} className="text-gray-400 hover:text-black">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(c.id, c.name)} className="text-gray-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
