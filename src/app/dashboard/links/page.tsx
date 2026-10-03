'use client'

import { useState, useEffect } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import NextLink from 'next/link'
import { Plus, Trash2, GripVertical, Link as LinkIcon, Share2, Crown, ChevronDown, Copy, Check, ExternalLink } from 'lucide-react'
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

function ProfileHeader({ username, displayName, bio, avatarUrl }: {
  username: string
  displayName: string | null
  bio: string | null
  avatarUrl: string | null
}) {
  const [copied, setCopied] = useState(false)
  const url = `tapconnect.ng/${username}`

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://${url}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm flex items-center gap-4">
      <div className="w-14 h-14 rounded-full bg-black overflow-hidden flex items-center justify-center text-xl font-bold text-white shrink-0">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          (displayName || username).charAt(0).toUpperCase()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-lg truncate">{displayName || `@${username}`}</p>
        {bio && <p className="text-sm text-gray-500 truncate">{bio}</p>}
        <div className="flex items-center gap-1.5 mt-1">
          <a href={`/${username}`} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-black truncate flex items-center gap-1">
            {url} <ExternalLink size={12} />
          </a>
        </div>
      </div>
      <button
        onClick={handleCopy}
        className="shrink-0 flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-black text-sm font-semibold px-4 py-2 rounded-full transition-colors"
      >
        {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy link</>}
      </button>
    </div>
  )
}

function IconPicker({ value, onChange }: { value: string | null | undefined; onChange: (name: string) => void }) {
  const [open, setOpen] = useState(false)
  const Icon = getLinkIcon(value)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs text-black bg-gray-50 hover:bg-gray-100 rounded-lg px-2 py-1.5 transition-colors"
      >
        <Icon size={14} className="text-gray-500" />
        <span className="capitalize">{value || 'link'}</span>
        <ChevronDown size={12} className="text-gray-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-2 z-20 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 grid grid-cols-4 gap-2 w-56">
            {LINK_ICON_NAMES.map((name) => {
              const OptionIcon = getLinkIcon(name)
              const selected = (value || 'link') === name
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => { onChange(name); setOpen(false) }}
                  title={name}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${selected ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                  <OptionIcon size={18} />
                  <span className="text-[10px] capitalize truncate w-full text-center">{name}</span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function LinkRow({ link, onUpdateLocal, onUpdate, onDelete, onToggleActive }: {
  link: LinkType
  onUpdateLocal: (id: string, updates: Partial<LinkType>) => void
  onUpdate: (id: string, updates: Partial<LinkType>) => void
  onDelete: (id: string) => void
  onToggleActive: (id: string, currentStatus: boolean) => void
}) {
  const dragControls = useDragControls()

  return (
    <Reorder.Item
      value={link}
      dragListener={false}
      dragControls={dragControls}
      className="bg-white rounded-3xl p-4 shadow-sm flex items-start gap-4"
    >
      <div
        onPointerDown={(e) => dragControls.start(e)}
        className="mt-2 text-gray-400 cursor-grab active:cursor-grabbing hover:text-gray-600 touch-none"
      >
        <GripVertical />
      </div>

      <div className="flex-1 space-y-2">
        <input
          type="text"
          value={link.title}
          onChange={(e) => onUpdateLocal(link.id, { title: e.target.value })}
          onBlur={(e) => onUpdate(link.id, { title: e.target.value, url: link.url })}
          placeholder="Title"
          className="w-full font-semibold text-gray-900 outline-none placeholder:text-gray-400 bg-transparent"
        />
        <input
          type="url"
          value={link.url}
          onChange={(e) => onUpdateLocal(link.id, { url: e.target.value })}
          onBlur={(e) => onUpdate(link.id, { title: link.title, url: e.target.value })}
          placeholder="URL"
          className="w-full text-black outline-none placeholder:text-gray-400 bg-transparent text-sm"
        />
        <input
          type="text"
          value={link.description || ''}
          onChange={(e) => onUpdateLocal(link.id, { description: e.target.value })}
          onBlur={(e) => onUpdate(link.id, { description: e.target.value })}
          placeholder="Optional description"
          className="w-full text-black outline-none placeholder:text-gray-400 bg-transparent text-xs"
        />
        <div className="flex items-center gap-3 pt-2">
          <IconPicker value={link.iconName} onChange={(name) => onUpdate(link.id, { iconName: name })} />
          <button
            onClick={() => onDelete(link.id)}
            className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <button
          onClick={() => onToggleActive(link.id, link.isActive)}
          className={`w-12 h-6 rounded-full relative transition-colors ${link.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
        >
          <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${link.isActive ? 'left-[26px]' : 'left-0.5'}`} />
        </button>
      </div>
    </Reorder.Item>
  )
}

export default function DashboardLinksPage() {
  const [links, setLinks] = useState<LinkType[]>([])
  const [socialLinks, setSocialLinks] = useState<SocialLinkType[]>([])
  const [newSocial, setNewSocial] = useState({ platform: 'Instagram', url: '' })
  const [loading, setLoading] = useState(true)
  const [isPro, setIsPro] = useState(false)
  const [linkError, setLinkError] = useState('')
  const [profile, setProfile] = useState<{ username: string; displayName: string | null; bio: string | null; avatarUrl: string | null } | null>(null)

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
        setProfile({
          username: data.user.username,
          displayName: data.user.displayName,
          bio: data.user.bio,
          avatarUrl: data.user.avatarUrl,
        })
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

  const handleUpdateLocal = (id: string, updates: Partial<LinkType>) => {
    setLinks((prev) => prev.map(l => l.id === id ? { ...l, ...updates } : l))
  }

  const handleUpdate = async (id: string, updates: Partial<LinkType>) => {
    handleUpdateLocal(id, updates)
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

  const handleReorder = (newOrder: LinkType[]) => {
    setLinks(newOrder)
    fetch('/api/links/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: newOrder.map((l) => l.id) }),
    }).catch((err) => console.error(err))
  }

  if (loading) return <div className="text-center py-20">Loading...</div>

  return (
    <div className="grid md:grid-cols-[1fr_400px] gap-8 items-start">
      <div className="space-y-6 min-w-0">
        {profile && (
          <ProfileHeader username={profile.username} displayName={profile.displayName} bio={profile.bio} avatarUrl={profile.avatarUrl} />
        )}
        {!isPro && (
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm bg-white rounded-2xl px-4 py-3 shadow-sm">
            <span className="text-black flex items-center gap-1.5"><Crown size={14} className="text-amber-500 shrink-0" /> {links.length} / {FREE_LINK_LIMIT} links used on the Free plan</span>
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

        {links.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center text-black shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LinkIcon size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Show the world who you are</h3>
            <p>Add a link to get started.</p>
          </div>
        ) : (
          <Reorder.Group axis="y" values={links} onReorder={handleReorder} className="space-y-4">
            {links.map((link) => (
              <LinkRow
                key={link.id}
                link={link}
                onUpdateLocal={handleUpdateLocal}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
              />
            ))}
          </Reorder.Group>
        )}

        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Share2 size={18} /> Social Icons</h2>
          <form onSubmit={handleAddSocial} className="flex flex-wrap gap-2 mb-4">
            <select
              value={newSocial.platform}
              onChange={(e) => setNewSocial({ ...newSocial, platform: e.target.value })}
              className="shrink-0 px-3 py-2 rounded-lg bg-gray-100 border-transparent outline-none text-sm"
            >
              {SOCIAL_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <input
              type="url"
              value={newSocial.url}
              onChange={(e) => setNewSocial({ ...newSocial, url: e.target.value })}
              placeholder="Profile URL"
              className="flex-1 min-w-[140px] px-3 py-2 rounded-lg bg-gray-100 border-transparent outline-none text-sm"
            />
            <button type="submit" className="shrink-0 bg-black text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-800">
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

           {links.filter(l => l.isActive).map(link => {
             const PreviewIcon = getLinkIcon(link.iconName)
             return (
               <a
                 key={link.id}
                 href={link.url}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="w-full bg-white text-black font-semibold p-4 text-center rounded-full shadow-sm hover:scale-[1.02] transition-transform relative flex items-center justify-center gap-2"
               >
                 <PreviewIcon size={16} className="text-gray-500" />
                 {link.title || 'Untitled'}
               </a>
             )
           })}
        </div>
      </div>
    </div>
  )
}
