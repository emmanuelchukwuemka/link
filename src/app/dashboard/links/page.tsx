'use client'

import { useState, useEffect } from 'react'
import NextLink from 'next/link'
import { Plus, Trash2, GripVertical, Link as LinkIcon, Share2, Crown } from 'lucide-react'
import { LINK_ICON_NAMES, getLinkIcon } from '@/lib/linkIcons'

const FREE_LINK_LIMIT = 5

type LinkType = {
  id: string
  title: string
  url: string
  isActive: boolean
  iconName?: string | null
  description?: string | null
}

type SocialLinkType = {
  id: string
  platform: string
  url: string
}

const SOCIAL_PLATFORMS = ['Instagram', 'TikTok', 'Facebook', 'LinkedIn', 'X', 'YouTube', 'Snapchat', 'Threads', 'Website']

export default function DashboardLinksPage() {
  const [links, setLinks] = useState<LinkType[]>([])
  const [socialLinks, setSocialLinks] = useState<SocialLinkType[]>([])
  const [newSocial, setNewSocial] = useState({ platform: 'Instagram', url: '' })
  const [loading, setLoading] = useState(true)
  const [isPro, setIsPro] = useState(false)
  const [linkError, setLinkError] = useState('')

  const fetchLinks = async () => {
    try {
      const res = await fetch('/api/links')
      const data = await res.json()
      if (data.links) setLinks(data.links)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchSocialLinks = async () => {
    try {
      const res = await fetch('/api/social-links')
      const data = await res.json()
      if (data.socialLinks) setSocialLinks(data.socialLinks)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchLinks()
    fetchSocialLinks()
    fetch('/api/auth/me').then(res => res.json()).then(data => {
      if (data.user) {
        setIsPro(data.user.plan === 'pro' && (!data.user.planExpiresAt || new Date(data.user.planExpiresAt) > new Date()))
      }
    })
  }, [])

  const handleAddSocial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSocial.url) return
    try {
      const res = await fetch('/api/social-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSocial)
      })
      const data = await res.json()
      if (data.socialLink) {
        setSocialLinks([...socialLinks, data.socialLink])
        setNewSocial({ platform: 'Instagram', url: '' })
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteSocial = async (id: string) => {
    setSocialLinks(socialLinks.filter(s => s.id !== id))
    try {
      await fetch(`/api/social-links/${id}`, { method: 'DELETE' })
    } catch (err) {
      console.error(err)
      fetchSocialLinks()
    }
  }

  const handleAddLink = async () => {
    setLinkError('')
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '', url: '' })
      })
      const data = await res.json()
      if (!res.ok) {
        setLinkError(data.error || 'Could not add link')
        return
      }
      if (data.link) {
        setLinks([data.link, ...links])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: string) => {
    setLinks(links.filter(l => l.id !== id))
    try {
      await fetch(`/api/links/${id}`, { method: 'DELETE' })
    } catch (err) {
      console.error(err)
      fetchLinks()
    }
  }

  const handleUpdate = async (id: string, updates: Partial<LinkType>) => {
    setLinks(links.map(l => l.id === id ? { ...l, ...updates } : l))
    try {
      await fetch(`/api/links/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
    } catch (err) {
      console.error(err)
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setLinks(links.map(l => l.id === id ? { ...l, isActive: !currentStatus } : l))
    try {
      await fetch(`/api/links/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      })
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div className="text-center py-20">Loading...</div>

  return (
    <div className="grid md:grid-cols-[1fr_400px] gap-8 items-start">
      <div className="space-y-6">
        {!isPro && (
          <div className="flex items-center justify-between text-sm bg-white rounded-2xl px-4 py-3 shadow-sm">
            <span className="text-black flex items-center gap-1.5"><Crown size={14} className="text-amber-500" /> {links.length} / {FREE_LINK_LIMIT} links used on the Free plan</span>
            <NextLink href="/dashboard/subscription" className="font-semibold text-black hover:underline">Upgrade for unlimited</NextLink>
          </div>
        )}
        {linkError && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">{linkError}</div>}
        <button
          onClick={handleAddLink}
          className="w-full bg-[#000000] text-white py-4 rounded-full font-semibold text-lg hover:bg-[#000000]/90 transition-colors flex items-center justify-center gap-2"
        >
          <Plus /> Add link
        </button>

        <div className="space-y-4">
          {links.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center text-black shadow-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LinkIcon size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Show the world who you are</h3>
              <p>Add a link to get started.</p>
            </div>
          ) : (
            links.map((link) => {
              const Icon = getLinkIcon(link.iconName)
              return (
              <div key={link.id} className="bg-white rounded-3xl p-4 shadow-sm flex items-start gap-4">
                <div className="mt-2 text-gray-400 cursor-grab active:cursor-grabbing hover:text-gray-600">
                  <GripVertical />
                </div>

                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={link.title}
                    onChange={(e) => setLinks(links.map(l => l.id === link.id ? { ...l, title: e.target.value } : l))}
                    onBlur={(e) => handleUpdate(link.id, { title: e.target.value, url: link.url })}
                    placeholder="Title"
                    className="w-full font-semibold text-gray-900 outline-none placeholder:text-gray-400 bg-transparent"
                  />
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => setLinks(links.map(l => l.id === link.id ? { ...l, url: e.target.value } : l))}
                    onBlur={(e) => handleUpdate(link.id, { title: link.title, url: e.target.value })}
                    placeholder="URL"
                    className="w-full text-black outline-none placeholder:text-gray-400 bg-transparent text-sm"
                  />
                  <input
                    type="text"
                    value={link.description || ''}
                    onChange={(e) => setLinks(links.map(l => l.id === link.id ? { ...l, description: e.target.value } : l))}
                    onBlur={(e) => handleUpdate(link.id, { description: e.target.value })}
                    placeholder="Optional description"
                    className="w-full text-black outline-none placeholder:text-gray-400 bg-transparent text-xs"
                  />
                  <div className="flex items-center gap-3 pt-2">
                    <div className="flex items-center gap-1">
                      <Icon size={14} className="text-gray-400" />
                      <select
                        value={link.iconName || 'link'}
                        onChange={(e) => handleUpdate(link.id, { iconName: e.target.value })}
                        className="text-xs text-black bg-gray-50 rounded-lg px-2 py-1 outline-none capitalize"
                      >
                        {LINK_ICON_NAMES.map((name) => <option key={name} value={name}>{name}</option>)}
                      </select>
                    </div>
                    <button
                      onClick={() => handleDelete(link.id)}
                      className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => handleToggleActive(link.id, link.isActive)}
                    className={`w-12 h-6 rounded-full relative transition-colors ${link.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${link.isActive ? 'left-[26px]' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>
              )
            })
          )}
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Share2 size={18} /> Social Icons</h2>
          <form onSubmit={handleAddSocial} className="flex gap-2 mb-4">
            <select
              value={newSocial.platform}
              onChange={(e) => setNewSocial({ ...newSocial, platform: e.target.value })}
              className="px-3 py-2 rounded-lg bg-gray-100 border-transparent outline-none text-sm"
            >
              {SOCIAL_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <input
              type="url"
              value={newSocial.url}
              onChange={(e) => setNewSocial({ ...newSocial, url: e.target.value })}
              placeholder="Profile URL"
              className="flex-1 px-3 py-2 rounded-lg bg-gray-100 border-transparent outline-none text-sm"
            />
            <button type="submit" className="bg-black text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-800">
              Add
            </button>
          </form>
          <div className="space-y-2">
            {socialLinks.map((s) => (
              <div key={s.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
                <div className="text-sm">
                  <span className="font-semibold">{s.platform}</span>
                  <span className="text-black ml-2 truncate">{s.url}</span>
                </div>
                <button onClick={() => handleDeleteSocial(s.id)} className="text-gray-400 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {socialLinks.length === 0 && <p className="text-sm text-black">No social icons added yet.</p>}
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className="hidden md:flex justify-center sticky top-24 border-[12px] border-black rounded-[3rem] h-[700px] w-[340px] bg-white overflow-y-auto overflow-x-hidden shadow-2xl relative">
        <div className="w-32 h-6 bg-black absolute top-0 rounded-b-xl z-10 left-1/2 -translate-x-1/2"></div>
        <div className="w-full py-12 px-4 flex flex-col items-center gap-4 bg-[#F3F3F1] min-h-full">
           <div className="w-24 h-24 bg-gray-300 rounded-full mb-2"></div>
           <h2 className="font-bold text-xl mb-4">@username</h2>

           {links.filter(l => l.isActive).map(link => (
             <a
               key={link.id}
               href={link.url}
               target="_blank"
               rel="noopener noreferrer"
               className="w-full bg-white text-black font-semibold p-4 text-center rounded-full shadow-sm hover:scale-[1.02] transition-transform"
             >
               {link.title || 'Untitled'}
             </a>
           ))}
        </div>
      </div>
    </div>
  )
}
