'use client'

import { useState, useEffect } from 'react'
import { Truck, Plus, Trash2 } from 'lucide-react'

type Zone = { id: string; name: string; fee: number }

export default function AdminDeliveryZonesPage() {
  const [zones, setZones] = useState<Zone[]>([])
  const [newZone, setNewZone] = useState({ name: '', fee: '' })
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const res = await fetch('/api/admin/delivery-zones')
    const data = await res.json()
    if (data.zones) setZones(data.zones)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const addZone = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newZone.name || !newZone.fee) return
    const res = await fetch('/api/admin/delivery-zones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newZone.name, fee: parseFloat(newZone.fee) }),
    })
    const data = await res.json()
    if (data.zone) {
      setZones([...zones, data.zone])
      setNewZone({ name: '', fee: '' })
    }
  }

  const updateFee = async (id: string, fee: number) => {
    setZones(zones.map(z => z.id === id ? { ...z, fee } : z))
    await fetch(`/api/admin/delivery-zones/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fee }),
    })
  }

  const deleteZone = async (id: string) => {
    setZones(zones.filter(z => z.id !== id))
    await fetch(`/api/admin/delivery-zones/${id}`, { method: 'DELETE' })
  }

  if (loading) return <div className="text-center py-20 text-black">Loading...</div>

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Truck size={24} /> Delivery Zones</h1>

      <form onSubmit={addZone} className="bg-white rounded-2xl p-5 shadow-sm flex gap-3">
        <input value={newZone.name} onChange={(e) => setNewZone({ ...newZone, name: e.target.value })} placeholder="City / Location" className="flex-1 px-3 py-2 rounded-lg bg-gray-50 outline-none text-sm" />
        <input type="number" value={newZone.fee} onChange={(e) => setNewZone({ ...newZone, fee: e.target.value })} placeholder="Fee" className="w-28 px-3 py-2 rounded-lg bg-gray-50 outline-none text-sm" />
        <button type="submit" className="bg-black text-white px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-gray-800">
          <Plus size={16} /> Add
        </button>
      </form>

      <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-50">
        {zones.map((z) => (
          <div key={z.id} className="flex items-center justify-between p-4">
            <span className="font-medium">{z.name}</span>
            <div className="flex items-center gap-3">
              <span className="text-gray-400">&#8358;</span>
              <input
                type="number"
                defaultValue={z.fee}
                onBlur={(e) => updateFee(z.id, parseFloat(e.target.value) || 0)}
                className="w-24 px-2 py-1.5 rounded-lg bg-gray-50 outline-none text-sm"
              />
              <button onClick={() => deleteZone(z.id)} className="text-gray-400 hover:text-red-500">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {zones.length === 0 && <p className="text-black text-center py-10">No delivery zones yet.</p>}
      </div>
    </div>
  )
}
