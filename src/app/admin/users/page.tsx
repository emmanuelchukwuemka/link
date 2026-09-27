'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Users, Ban, CheckCircle2 } from 'lucide-react'

type UserRow = {
  id: string
  username: string
  email: string
  displayName: string | null
  accountType: string
  plan: string
  planExpiresAt: string | null
  isActive: boolean
  business: { name: string } | null
  ownedBusiness: { name: string } | null
  createdAt: string
}

const TYPE_LABELS: Record<string, string> = {
  individual: 'Individuals',
  business_admin: 'Businesses',
  employee: 'Employees',
}

function AdminUsersContent() {
  const searchParams = useSearchParams()
  const type = searchParams.get('type')
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    const qs = type ? `?type=${type}` : ''
    fetch(`/api/admin/users${qs}`).then(res => res.json()).then(data => {
      if (data.users) setUsers(data.users)
      setLoading(false)
    })
  }, [type])

  const toggleActive = async (u: UserRow) => {
    setBusyId(u.id)
    try {
      await fetch(`/api/admin/users/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !u.isActive }),
      })
      setUsers(users.map(x => x.id === u.id ? { ...x, isActive: !x.isActive } : x))
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <div className="text-center py-20 text-black">Loading...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Users size={24} /> {type ? TYPE_LABELS[type] || 'Users' : 'All Users'} ({users.length})
      </h1>

      <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-black border-b border-gray-100">
              <th className="p-4 font-semibold">User</th>
              <th className="p-4 font-semibold">Type</th>
              <th className="p-4 font-semibold">Business</th>
              <th className="p-4 font-semibold">Plan</th>
              <th className="p-4 font-semibold">Joined</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-50 last:border-0">
                <td className="p-4">
                  <p className="font-medium">{u.displayName || u.username}</p>
                  <p className="text-xs text-black">@{u.username} &middot; {u.email}</p>
                </td>
                <td className="p-4 capitalize">{u.accountType.replace('_', ' ')}</td>
                <td className="p-4 text-black">{u.business?.name || u.ownedBusiness?.name || '—'}</td>
                <td className="p-4 capitalize">{u.plan}</td>
                <td className="p-4 text-black">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="p-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {u.isActive ? 'Active' : 'Suspended'}
                  </span>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => toggleActive(u)}
                    disabled={busyId === u.id}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap disabled:opacity-50 ${
                      u.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {u.isActive ? <><Ban size={13} /> Suspend</> : <><CheckCircle2 size={13} /> Reactivate</>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="text-black text-center py-10">No users found.</p>}
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-black">Loading...</div>}>
      <AdminUsersContent />
    </Suspense>
  )
}
