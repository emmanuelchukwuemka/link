'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MessageCircle } from 'lucide-react'

type Conversation = {
  user: { id: string; username: string; displayName: string | null; avatarUrl: string | null; accountType: string }
  lastMessage: string
  lastSender: string
  updatedAt: string
  unreadCount: number
}

export default function AdminSupportPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/support').then((res) => res.json()).then((data) => {
      if (data.conversations) setConversations(data.conversations)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="text-center py-20 text-black">Loading...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-black">Support</h1>
        <p className="text-gray-600 text-sm mt-1">Conversations from users reaching out for help.</p>
      </div>

      {conversations.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center text-black shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle size={32} className="text-gray-400" />
          </div>
          No support messages yet.
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm divide-y divide-gray-100">
          {conversations.map((c) => (
            <Link key={c.user.id} href={`/admin/support/${c.user.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
              <div className="w-11 h-11 rounded-full bg-black overflow-hidden flex items-center justify-center text-sm font-bold text-white shrink-0">
                {c.user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  (c.user.displayName || c.user.username).charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-black truncate">{c.user.displayName || c.user.username}</p>
                  {c.unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full shrink-0">{c.unreadCount}</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate">{c.lastSender === 'admin' ? 'You: ' : ''}{c.lastMessage}</p>
              </div>
              <p className="text-xs text-gray-400 shrink-0 whitespace-nowrap">{new Date(c.updatedAt).toLocaleDateString()}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
