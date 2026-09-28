'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'

type Message = {
  id: string
  sender: string
  body: string
  createdAt: string
}

export function SupportChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const openRef = useRef(open)
  useEffect(() => { openRef.current = open }, [open])

  const load = useCallback(async () => {
    const res = await fetch('/api/support/messages')
    if (!res.ok) return
    const data = await res.json()
    setMessages(data.messages || [])
    setUnreadCount(openRef.current ? 0 : (data.unreadCount || 0))
    setLoaded(true)
    if (openRef.current && data.unreadCount > 0) {
      fetch('/api/support/messages/read', { method: 'POST' })
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [load])

  useEffect(() => {
    if (open) {
      fetch('/api/support/messages/read', { method: 'POST' })
      setUnreadCount(0)
    }
  }, [open])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages, open])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = input.trim()
    if (!body || sending) return
    setSending(true)
    setInput('')
    const res = await fetch('/api/support/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    })
    if (res.ok) {
      const data = await res.json()
      setMessages((prev) => [...prev, data.message])
    } else {
      setInput(body)
    }
    setSending(false)
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-[calc(100vw-2.5rem)] sm:w-80 h-[28rem] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="bg-black text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div>
              <p className="font-semibold text-sm">TapConnect Support</p>
              <p className="text-xs text-white/50">We usually reply within a few hours</p>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 text-white/60 hover:text-white" aria-label="Close support chat">
              <X size={18} />
            </button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {loaded && messages.length === 0 && (
              <p className="text-xs text-gray-400 text-center pt-8">Send us a message and our team will get back to you here.</p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${m.sender === 'user' ? 'bg-black text-white' : 'bg-white border border-gray-200 text-black'}`}>
                  {m.body}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-2 p-3 border-t border-gray-100 shrink-0">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-3.5 py-2.5 rounded-full bg-gray-100 outline-none text-sm text-black"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Send"
              className="w-10 h-10 shrink-0 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close support chat' : 'Open support chat'}
        className="relative w-14 h-14 rounded-full bg-black text-white shadow-xl flex items-center justify-center hover:bg-gray-800 transition-colors"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {!open && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  )
}
