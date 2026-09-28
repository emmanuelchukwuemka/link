'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Plus, Trash2, Pencil, Check, X, ChevronDown, ChevronRight, GripVertical,
  Search, Watch, KeyRound,
} from 'lucide-react'
import { fallbackVisual } from '@/lib/productVisual'

type CategoryNode = {
  id: string
  name: string
  position: number
  parentId: string | null
  directCount: number
  totalCount: number
  children: CategoryNode[]
}

function moveItem(list: CategoryNode[], draggedId: string, targetId: string): CategoryNode[] {
  const dragIdx = list.findIndex((x) => x.id === draggedId)
  const targetIdx = list.findIndex((x) => x.id === targetId)
  if (dragIdx === -1 || targetIdx === -1 || dragIdx === targetIdx) return list
  const next = [...list]
  const [moved] = next.splice(dragIdx, 1)
  next.splice(targetIdx, 0, moved)
  return next
}

function reorderTree(nodes: CategoryNode[], parentId: string | null, draggedId: string, targetId: string): CategoryNode[] {
  if (parentId === null) return moveItem(nodes, draggedId, targetId)
  return nodes.map((n) => {
    if (n.id === parentId) return { ...n, children: moveItem(n.children, draggedId, targetId) }
    if (n.children.length) return { ...n, children: reorderTree(n.children, parentId, draggedId, targetId) }
    return n
  })
}

function CategoryThumb({ name }: { name: string }) {
  const visual = fallbackVisual(name)
  return (
    <div className="w-11 h-11 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
      {'photo' in visual ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={visual.photo} alt="" className="w-full h-full object-cover" />
      ) : (
        <visual.icon size={18} className="text-gray-500" />
      )}
    </div>
  )
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryNode[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [addingSubFor, setAddingSubFor] = useState<string | null>(null)
  const [newSubName, setNewSubName] = useState('')
  const [draggedId, setDraggedId] = useState<string | null>(null)

  const load = () => {
    fetch('/api/admin/categories').then((res) => res.json()).then((data) => {
      if (data.categories) setCategories(data.categories)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAddRoot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setSaving(true)
    setError('')
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    })
    const data = await res.json()
    if (!res.ok) setError(data.error || 'Could not add category')
    else {
      setCategories((prev) => [...prev, { ...data.category, directCount: 0, totalCount: 0, children: [] }])
      setNewName('')
    }
    setSaving(false)
  }

  const handleAddSub = async (parentId: string) => {
    if (!newSubName.trim()) return
    setError('')
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newSubName.trim(), parentId }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Could not add subcategory')
      return
    }
    setCategories((prev) => prev.map((c) => c.id === parentId
      ? { ...c, children: [...c.children, { ...data.category, directCount: 0, totalCount: 0, children: [] }] }
      : c))
    setNewSubName('')
    setAddingSubFor(null)
    setExpanded((prev) => new Set(prev).add(parentId))
  }

  const startEdit = (node: CategoryNode) => {
    setEditingId(node.id)
    setEditingName(node.name)
    setError('')
  }

  const saveEdit = async (id: string) => {
    if (!editingName.trim()) return
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editingName.trim() }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Could not rename category')
      return
    }
    setCategories((prev) => prev.map((c) => {
      if (c.id === id) return { ...c, name: data.category.name }
      return { ...c, children: c.children.map((s) => (s.id === id ? { ...s, name: data.category.name } : s)) }
    }))
    setEditingId(null)
  }

  const handleDelete = async (node: CategoryNode) => {
    const warning = node.children.length > 0
      ? `Delete "${node.name}" and its ${node.children.length} subcategor${node.children.length === 1 ? 'y' : 'ies'}? Existing products keep their category text, but it won't appear in the picker.`
      : `Delete "${node.name}"? Existing products keep their category text, but it won't appear in the picker.`
    if (!confirm(warning)) return

    const res = await fetch(`/api/admin/categories/${node.id}`, { method: 'DELETE' })
    if (res.ok) {
      setCategories((prev) => prev
        .filter((c) => c.id !== node.id)
        .map((c) => ({ ...c, children: c.children.filter((s) => s.id !== node.id) })))
    } else {
      const data = await res.json()
      alert(data.error || 'Could not delete category')
    }
  }

  const handleDrop = async (parentId: string | null, targetId: string) => {
    if (!draggedId || draggedId === targetId) { setDraggedId(null); return }
    const next = reorderTree(categories, parentId, draggedId, targetId)
    setCategories(next)
    setDraggedId(null)

    const siblings = parentId === null ? next : next.find((c) => c.id === parentId)?.children || []
    await fetch('/api/admin/categories/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentId, orderedIds: siblings.map((s) => s.id) }),
    })
  }

  if (loading) return <div className="text-center py-20 text-black">Loading...</div>

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
      <div className="space-y-5 min-w-0">
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
          <Link href="/admin/products" className="hover:text-black">Products</Link>
          <ChevronRight size={12} />
          <span className="text-gray-600">Categories</span>
        </div>

        <div>
          <p className="text-xs font-bold tracking-widest text-blue-600 uppercase mb-1">Products</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-black mb-2">Categories</h1>
          <p className="text-gray-600 text-sm max-w-lg">Organize your TapConnect product catalog. Create main categories and subcategories for better management.</p>
        </div>

        <form onSubmit={handleAddRoot} className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New category name..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-gray-200 outline-none text-sm text-black focus:border-black transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !newName.trim()}
            className="px-5 py-3 rounded-xl font-semibold text-sm bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={16} /> Add Category
          </button>
        </form>

        {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">{error}</div>}

        {categories.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center text-black shadow-sm">
            No categories yet — add your first one above.
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm divide-y divide-gray-100 overflow-hidden">
            {categories.map((node) => (
              <div key={node.id}>
                <div
                  draggable
                  onDragStart={() => setDraggedId(node.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(null, node.id)}
                  className="flex items-center gap-3 px-4 py-4"
                >
                  <button
                    onClick={() => toggleExpand(node.id)}
                    disabled={node.children.length === 0}
                    className="p-1 text-gray-400 hover:text-black disabled:opacity-0"
                  >
                    {expanded.has(node.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>

                  <CategoryThumb name={node.name} />

                  <div className="flex-1 min-w-0">
                    {editingId === node.id ? (
                      <input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit(node.id)}
                        autoFocus
                        className="px-2 py-1 rounded-lg bg-gray-100 outline-none text-sm font-semibold text-black"
                      />
                    ) : (
                      <p className="font-semibold text-black">{node.name}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {node.totalCount} product{node.totalCount === 1 ? '' : 's'}
                      {node.children.length > 0 && ` · ${node.children.length} subcategor${node.children.length === 1 ? 'y' : 'ies'}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {editingId === node.id ? (
                      <>
                        <button onClick={() => saveEdit(node.id)} className="text-green-600 hover:text-green-700 p-1.5"><Check size={15} /></button>
                        <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-black p-1.5"><X size={15} /></button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => { setAddingSubFor(addingSubFor === node.id ? null : node.id); setExpanded((prev) => new Set(prev).add(node.id)) }}
                          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 whitespace-nowrap"
                        >
                          <Plus size={12} /> Add Subcategory
                        </button>
                        <button onClick={() => startEdit(node)} className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-black hover:bg-gray-50">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(node)} className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-red-500 hover:bg-red-50">
                          <Trash2 size={13} />
                        </button>
                        <span className="p-1.5 text-gray-300 cursor-grab active:cursor-grabbing">
                          <GripVertical size={15} />
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {expanded.has(node.id) && (
                  <div className="bg-gray-50/60 pl-6">
                    {node.children.map((child) => (
                      <div
                        key={child.id}
                        draggable
                        onDragStart={() => setDraggedId(child.id)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDrop(node.id, child.id)}
                        className="flex items-center gap-3 pl-6 pr-4 py-3 border-l-2 border-gray-200 ml-5"
                      >
                        <CategoryThumb name={child.name} />
                        <div className="flex-1 min-w-0">
                          {editingId === child.id ? (
                            <input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && saveEdit(child.id)}
                              autoFocus
                              className="px-2 py-1 rounded-lg bg-white outline-none text-sm font-semibold text-black"
                            />
                          ) : (
                            <p className="font-semibold text-black text-sm">{child.name}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">{child.directCount} product{child.directCount === 1 ? '' : 's'}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {editingId === child.id ? (
                            <>
                              <button onClick={() => saveEdit(child.id)} className="text-green-600 hover:text-green-700 p-1.5"><Check size={14} /></button>
                              <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-black p-1.5"><X size={14} /></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEdit(child)} className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-black hover:bg-white">
                                <Pencil size={12} />
                              </button>
                              <button onClick={() => handleDelete(child)} className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-red-500 hover:bg-red-50">
                                <Trash2 size={12} />
                              </button>
                              <span className="p-1.5 text-gray-300 cursor-grab active:cursor-grabbing">
                                <GripVertical size={14} />
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}

                    {addingSubFor === node.id && (
                      <div className="flex items-center gap-2 pl-11 pr-4 py-3">
                        <input
                          value={newSubName}
                          onChange={(e) => setNewSubName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddSub(node.id)}
                          placeholder="Subcategory name..."
                          autoFocus
                          className="flex-1 px-3 py-2 rounded-lg bg-white border border-gray-200 outline-none text-sm text-black"
                        />
                        <button onClick={() => handleAddSub(node.id)} disabled={!newSubName.trim()} className="px-3 py-2 rounded-lg bg-black text-white text-xs font-semibold disabled:opacity-50">
                          Add
                        </button>
                        <button onClick={() => { setAddingSubFor(null); setNewSubName('') }} className="text-gray-400 hover:text-black p-2">
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="hidden lg:block sticky top-6">
        <div className="relative rounded-3xl bg-gradient-to-br from-green-50 to-blue-50 p-10 min-h-[420px] flex items-center justify-center overflow-hidden">
          <div className="absolute w-64 h-64 rounded-full bg-white/40 blur-2xl" />

          <div className="relative w-40 rounded-2xl overflow-hidden shadow-2xl -rotate-6 ring-1 ring-black/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/step-1-card.jpg" alt="" className="w-full h-full object-cover" />
          </div>

          <div className="absolute top-14 right-10 w-16 h-16 rounded-full bg-blue-600 shadow-xl flex items-center justify-center rotate-6">
            <Watch size={24} className="text-white" />
          </div>

          <div className="absolute bottom-16 left-10 w-14 h-14 rounded-full bg-white shadow-xl flex items-center justify-center -rotate-6">
            <KeyRound size={20} className="text-gray-700" />
          </div>

          <div className="absolute top-8 left-8 grid grid-cols-3 gap-1.5">
            {Array.from({ length: 9 }).map((_, i) => (
              <span key={i} className="w-1 h-1 rounded-full bg-blue-300" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
