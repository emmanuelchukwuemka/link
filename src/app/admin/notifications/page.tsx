'use client'

import { useState } from 'react'
import { Send, Megaphone } from 'lucide-react'

export default function AdminNotificationsPage() {
  const [mode, setMode] = useState<'user' | 'broadcast'>('user')
  const [username, setUsername] = useState('')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [link, setLink] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError('')
    setResult('')
    try {
      const res = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          broadcast: mode === 'broadcast',
          username: mode === 'user' ? username : undefined,
          title, message, link: link || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not send')
      setResult(`Sent to ${data.sent} user(s).`)
      setTitle('')
      setMessage('')
      setLink('')
      setUsername('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Megaphone size={24} /> Send Notification</h1>

      <div className="grid grid-cols-2 gap-2 bg-gray-100 rounded-full p-1 w-fit">
        <button
          onClick={() => setMode('user')}
          className={`px-4 py-2 rounded-full font-semibold text-sm ${mode === 'user' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}
        >
          Specific user
        </button>
        <button
          onClick={() => setMode('broadcast')}
          className={`px-4 py-2 rounded-full font-semibold text-sm ${mode === 'broadcast' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}
        >
          Broadcast (all users)
        </button>
      </div>

      <form onSubmit={handleSend} className="bg-white rounded-3xl p-6 shadow-sm space-y-4">
        {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">{error}</div>}
        {result && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">{result}</div>}

        {mode === 'user' && (
          <input
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username (without @)"
            className="w-full px-4 py-3 rounded-lg bg-gray-100 outline-none"
          />
        )}
        {mode === 'broadcast' && (
          <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">This sends an in-app notification to every registered user. Use sparingly.</p>
        )}

        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full px-4 py-3 rounded-lg bg-gray-100 outline-none"
        />
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Message"
          className="w-full px-4 py-3 rounded-lg bg-gray-100 outline-none min-h-[100px]"
        />
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Link (optional, e.g. /dashboard/subscription)"
          className="w-full px-4 py-3 rounded-lg bg-gray-100 outline-none"
        />

        <button
          type="submit"
          disabled={sending}
          className="bg-black text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 hover:bg-gray-800 disabled:opacity-60"
        >
          <Send size={16} /> {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  )
}
