'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Crown, Wallet, Check, Loader2, AlertCircle } from 'lucide-react'
import { ImageUploader } from '@/components/ImageUploader'
import { backgroundStyle } from '@/lib/background'
import { buttonSizePadding, buttonSizeFontClass } from '@/lib/buttonSize'
import { SaveContactButton } from '@/app/[username]/ProfileInteractive'

const CARD_COLOR_PRESETS = [
  '#181818', '#FFFFFF', '#1D4ED8', '#F97316', '#16A34A',
  '#0F172A', '#DC2626', '#991B1B', '#0891B2', '#9333EA',
]

function readableTextColor(hex: string): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#181818' : '#FFFFFF'
}

const TEMPLATES = ['minimal', 'executive', 'business', 'creator', 'luxury', 'professional']
const FONTS = ['Inter', 'Georgia', 'Poppins', 'Playfair Display', 'Roboto Mono']
const GRADIENT_PRESETS = [
  'linear-gradient(135deg, #000000, #434343)',
  'linear-gradient(135deg, #F7F7F5, #B8B8B8)',
  'linear-gradient(135deg, #ffffff, #e5e5e5)',
  'linear-gradient(135deg, #1a1a1a, #4a4a4a)',
  'linear-gradient(135deg, #000000, #B8B8B8)',
  'linear-gradient(135deg, #6B6B6B, #111111)',
]

export default function AppearancePage() {
  const [profile, setProfile] = useState({
    displayName: '',
    bio: '',
    aboutText: '',
    avatarUrl: '',
    bgType: 'solid',
    bgColor: '#f3f3f1',
    bgGradient: GRADIENT_PRESETS[0],
    bgImage: '',
    buttonColor: '#ffffff',
    buttonTextColor: '#000000',
    buttonStyle: 'rounded',
    buttonSize: 'medium',
    textColor: '#000000',
    username: '',
    template: 'minimal',
    fontFamily: 'Inter',
    email: '',
    phone: '',
    website: '',
    jobTitle: '',
    leadFormEnabled: false,
  })
  const [loading, setLoading] = useState(true)
  const [isPro, setIsPro] = useState(false)
  const [upgradeNotice, setUpgradeNotice] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setIsPro(data.user.plan === 'pro' && (!data.user.planExpiresAt || new Date(data.user.planExpiresAt) > new Date()))
          setProfile({
            displayName: data.user.displayName || '',
            bio: data.user.bio || '',
            aboutText: data.user.aboutText || '',
            avatarUrl: data.user.avatarUrl || '',
            bgType: data.user.bgType || 'solid',
            bgColor: data.user.bgColor || '#f3f3f1',
            bgGradient: data.user.bgGradient || GRADIENT_PRESETS[0],
            bgImage: data.user.bgImage || '',
            buttonColor: data.user.buttonColor || '#ffffff',
            buttonTextColor: data.user.buttonTextColor || '#000000',
            buttonStyle: data.user.buttonStyle || 'rounded',
            buttonSize: data.user.buttonSize || 'medium',
            textColor: data.user.textColor || '#000000',
            username: data.user.username || '',
            template: data.user.template || 'minimal',
            fontFamily: data.user.fontFamily || 'Inter',
            email: data.user.email || '',
            phone: data.user.phone || '',
            website: data.user.website || '',
            jobTitle: data.user.jobTitle || '',
            leadFormEnabled: !!data.user.leadFormEnabled,
          })
        }
        setLoading(false)
      })
  }, [])

  const handleProUpdate = (updates: Partial<typeof profile>, lockedMessage: string) => {
    if (!isPro) {
      setUpgradeNotice(lockedMessage)
      return
    }
    setUpgradeNotice('')
    handleUpdate(updates)
  }

  const handleUpdate = async (updates: Partial<typeof profile>) => {
    const newProfile = { ...profile, ...updates }
    setProfile(newProfile)
    setSaveStatus('saving')

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      if (!res.ok) throw new Error('Save failed')
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus((s) => (s === 'saved' ? 'idle' : s)), 2000)
    } catch (err) {
      console.error(err)
      setSaveStatus('error')
    }
  }

  if (loading) return <div className="py-20 text-center text-black">Loading...</div>

  return (
    <div className="grid md:grid-cols-[1fr_400px] gap-8 items-start">
      <div className="space-y-8 min-w-0">

        {/* Save status indicator — everything on this page saves automatically as you edit */}
        <div className="sticky top-0 z-20 -mt-2 -mx-2 px-2 pt-2 pb-1">
          <div className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full w-fit shadow-sm transition-colors ${
            saveStatus === 'error' ? 'bg-red-50 text-red-600' : saveStatus === 'saving' ? 'bg-gray-100 text-gray-600' : saveStatus === 'saved' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {saveStatus === 'saving' && <><Loader2 size={13} className="animate-spin" /> Saving...</>}
            {saveStatus === 'saved' && <><Check size={13} /> Saved</>}
            {saveStatus === 'error' && <><AlertCircle size={13} /> Couldn&apos;t save &mdash; check your connection and try again</>}
            {saveStatus === 'idle' && <>Changes save automatically</>}
          </div>
        </div>

        {/* Profile Section */}
        <section className="bg-white rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-6">Profile</h2>
          <div className="flex gap-6 mb-6 items-center">
             <div className="w-24 h-24 bg-black rounded-full overflow-hidden flex items-center justify-center text-3xl text-white">
               {profile.avatarUrl ? (
                 // eslint-disable-next-line @next/next/no-img-element
                 <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
               ) : (
                 profile.displayName?.charAt(0) || profile.username?.charAt(0) || 'U'
               )}
             </div>
             <div className="flex flex-col gap-2 items-start">
               <ImageUploader
                 label="Pick an image"
                 onUploaded={(url) => handleUpdate({ avatarUrl: url })}
                 className="bg-[#000000] text-white px-6 py-2 rounded-full font-semibold hover:bg-[#000000]/90 flex items-center gap-2 text-sm"
               />
               {profile.avatarUrl && (
                 <button onClick={() => handleUpdate({ avatarUrl: '' })} className="text-black bg-gray-100 px-6 py-2 rounded-full font-semibold hover:bg-gray-200 text-sm">
                   Remove
                 </button>
               )}
             </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Profile Title</label>
              <input
                type="text"
                value={profile.displayName}
                onChange={(e) => handleUpdate({ displayName: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent focus:bg-white focus:border-[#000000] focus:ring-2 focus:ring-[#000000]/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Bio</label>
              <textarea
                value={profile.bio}
                onChange={(e) => handleUpdate({ bio: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent focus:bg-white focus:border-[#000000] focus:ring-2 focus:ring-[#000000]/20 outline-none transition-all min-h-[100px]"
                maxLength={80}
              />
              <div className="text-right text-xs text-black mt-1">{profile.bio.length} / 80</div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">About</label>
              <p className="text-xs text-black mb-2">A longer description shown in its own section further down your profile &mdash; think of Bio as your headline and this as the full story.</p>
              <textarea
                value={profile.aboutText}
                onChange={(e) => handleUpdate({ aboutText: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent focus:bg-white focus:border-[#000000] focus:ring-2 focus:ring-[#000000]/20 outline-none transition-all min-h-[140px]"
                maxLength={1000}
              />
              <div className="text-right text-xs text-black mt-1">{profile.aboutText.length} / 1000</div>
            </div>
          </div>
        </section>

        {/* Upgrade notice */}
        {upgradeNotice && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
            <p className="text-sm text-amber-800 flex items-center gap-2"><Crown size={16} /> {upgradeNotice}</p>
            <Link href="/dashboard/subscription" className="text-sm font-semibold bg-amber-600 text-white px-4 py-2 rounded-full whitespace-nowrap hover:bg-amber-700">
              Upgrade
            </Link>
          </div>
        )}

        {/* Digital Business Card */}
        <section className="bg-white rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-1">Digital Business Card</h2>
          <p className="text-gray-500 text-sm mb-6">A shareable card with your QR code &mdash; scan to open your profile instantly, or save your contact straight to a phone.</p>

          <div className="grid sm:grid-cols-[200px_1fr] gap-6 items-start">
            <div
              className="rounded-2xl p-5 aspect-[3/4] flex flex-col justify-between shadow-md shrink-0"
              style={{ backgroundColor: profile.bgColor, color: readableTextColor(profile.bgColor) }}
            >
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Name</p>
                <p className="font-bold text-lg leading-tight break-words">{profile.displayName || `@${profile.username}` || 'Your Name'}</p>
                <p className="text-xs opacity-70 mt-1">@{profile.username}</p>
              </div>
              {profile.username && (
                <div className="bg-white rounded-xl p-2 w-full aspect-square flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/q/${profile.username}`)}`}
                    alt="Your QR code"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>

            <div className="space-y-5 min-w-0">
              <div>
                <h3 className="font-semibold text-sm mb-2">Card color</h3>
                <div className="flex flex-wrap gap-2 items-center">
                  {CARD_COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      onClick={() => handleUpdate({ bgColor: c })}
                      style={{ backgroundColor: c }}
                      className={`w-8 h-8 rounded-full border transition-all ${profile.bgColor.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-black ring-offset-2' : 'border-gray-200 hover:scale-110'}`}
                    />
                  ))}
                  <input
                    type="color"
                    value={profile.bgColor}
                    onChange={(e) => handleUpdate({ bgColor: e.target.value })}
                    className="w-8 h-8 rounded-full cursor-pointer border-0 p-0"
                    title="Custom color"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">This is also your profile&apos;s background color (when set to a solid background below).</p>
              </div>

              <div className="flex items-center justify-between gap-4 bg-gray-50 rounded-xl p-4">
                <div className="min-w-0">
                  <p className="font-semibold text-sm">Let visitors share their details back</p>
                  <p className="text-xs text-gray-500">Collect a name, phone and message from people you meet.</p>
                </div>
                <button
                  onClick={() => handleUpdate({ leadFormEnabled: !profile.leadFormEnabled })}
                  className={`w-12 h-6 rounded-full relative shrink-0 transition-colors ${profile.leadFormEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${profile.leadFormEnabled ? 'left-[26px]' : 'left-0.5'}`} />
                </button>
              </div>

              {profile.username && (
                <SaveContactButton
                  username={profile.username}
                  displayName={profile.displayName || profile.username}
                  phone={profile.phone}
                  email={profile.email}
                  website={profile.website}
                  jobTitle={profile.jobTitle}
                  className="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-gray-800 transition-colors"
                />
              )}

              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <Wallet size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-amber-800">Apple Wallet / Google Wallet</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Not available yet &mdash; adding your card to Apple Wallet or Google Wallet needs a real Apple Developer certificate and a Google Wallet API account, which I can&apos;t generate on your behalf. The QR code and contact download above work today without either.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Template */}
        <section className="bg-white rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-6">Template</h2>
          <div className="grid grid-cols-3 gap-3">
            {TEMPLATES.map((t) => (
              <button
                key={t}
                onClick={() => handleProUpdate({ template: t }, 'Templates other than Minimal are a Pro feature.')}
                className={`relative py-3 rounded-xl border-2 capitalize text-sm font-semibold transition-colors ${profile.template === t ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'}`}
              >
                {!isPro && t !== 'minimal' && <Crown size={12} className="absolute top-1.5 right-1.5 text-amber-500" />}
                {t}
              </button>
            ))}
          </div>
        </section>

        {/* Custom Appearance */}
        <section className="bg-white rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-6">Custom Appearance</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Font</h3>
              <select
                value={profile.fontFamily}
                onChange={(e) => handleProUpdate({ fontFamily: e.target.value }, 'Custom fonts are a Pro feature.')}
                className="w-full px-4 py-3 rounded-lg bg-gray-100 border-transparent outline-none"
              >
                {FONTS.map((f) => <option key={f} value={f}>{f}{!isPro && f !== 'Inter' ? ' (Pro)' : ''}</option>)}
              </select>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Background</h3>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {(['solid', 'gradient', 'image'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => handleProUpdate({ bgType: t }, 'Gradient and image backgrounds are a Pro feature.')}
                    className={`relative py-2 rounded-lg border-2 capitalize text-sm font-medium ${profile.bgType === t ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'}`}
                  >
                    {!isPro && t !== 'solid' && <Crown size={11} className="absolute top-1 right-1 text-amber-500" />}
                    {t}
                  </button>
                ))}
              </div>

              {profile.bgType === 'solid' && (
                <div className="flex gap-4 items-center">
                  <input
                    type="color"
                    value={profile.bgColor}
                    onChange={(e) => handleUpdate({ bgColor: e.target.value })}
                    className="w-12 h-12 rounded cursor-pointer border-0 p-0"
                  />
                  <span className="text-sm text-black uppercase">{profile.bgColor}</span>
                </div>
              )}

              {profile.bgType === 'gradient' && (
                <div className="grid grid-cols-3 gap-3">
                  {GRADIENT_PRESETS.map((g) => (
                    <button
                      key={g}
                      onClick={() => handleUpdate({ bgGradient: g })}
                      style={{ background: g }}
                      className={`h-14 rounded-lg border-2 ${profile.bgGradient === g ? 'border-black' : 'border-transparent'}`}
                    />
                  ))}
                </div>
              )}

              {profile.bgType === 'image' && (
                <div className="space-y-3">
                  {profile.bgImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.bgImage} alt="Background preview" className="w-full h-32 rounded-lg object-cover" />
                  )}
                  <ImageUploader
                    label="Upload background image"
                    onUploaded={(url) => handleUpdate({ bgImage: url })}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full font-semibold text-sm hover:bg-gray-200 flex items-center gap-2"
                  />
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-3">Buttons</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <button
                  onClick={() => handleUpdate({ buttonStyle: 'rounded' })}
                  className={`py-4 rounded-full border-2 ${profile.buttonStyle === 'rounded' ? 'border-black' : 'border-gray-200'} hover:border-gray-400`}
                >
                  <div className="w-1/2 h-2 bg-gray-300 mx-auto rounded-full"></div>
                </button>
                <button
                  onClick={() => handleUpdate({ buttonStyle: 'square' })}
                  className={`py-4 rounded-lg border-2 ${profile.buttonStyle === 'square' ? 'border-black' : 'border-gray-200'} hover:border-gray-400`}
                >
                  <div className="w-1/2 h-2 bg-gray-300 mx-auto rounded-full"></div>
                </button>
                <button
                  onClick={() => handleUpdate({ buttonStyle: 'sharp' })}
                  className={`py-4 border-2 ${profile.buttonStyle === 'sharp' ? 'border-black' : 'border-gray-200'} hover:border-gray-400`}
                >
                  <div className="w-1/2 h-2 bg-gray-300 mx-auto rounded-full"></div>
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-2">Button Size</label>
                <div className="grid grid-cols-3 gap-4">
                  {(['small', 'medium', 'large'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => handleUpdate({ buttonSize: size })}
                      className={`py-2 rounded-lg border-2 capitalize text-sm font-medium ${profile.buttonSize === size ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm text-gray-600 mb-2">Button Color</label>
                   <div className="flex gap-4 items-center">
                     <input
                       type="color"
                       value={profile.buttonColor}
                       onChange={(e) => handleUpdate({ buttonColor: e.target.value })}
                       className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                     />
                   </div>
                </div>
                <div>
                   <label className="block text-sm text-gray-600 mb-2">Button Text Color</label>
                   <div className="flex gap-4 items-center">
                     <input
                       type="color"
                       value={profile.buttonTextColor}
                       onChange={(e) => handleUpdate({ buttonTextColor: e.target.value })}
                       className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                     />
                   </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Profile Text Color</h3>
              <div className="flex gap-4 items-center">
                <input
                  type="color"
                  value={profile.textColor}
                  onChange={(e) => handleUpdate({ textColor: e.target.value })}
                  className="w-12 h-12 rounded cursor-pointer border-0 p-0"
                />
                <span className="text-sm text-black uppercase">{profile.textColor}</span>
              </div>
            </div>

          </div>
        </section>

      </div>

      {/* Preview Section */}
      <div className="hidden md:flex justify-center sticky top-24 border-[12px] border-black rounded-[3rem] h-[700px] w-[340px] overflow-hidden shadow-2xl relative">
        <div className="w-32 h-6 bg-black absolute top-0 rounded-b-xl z-10 left-1/2 -translate-x-1/2"></div>
        <div
          className="w-full py-12 px-4 flex flex-col items-center gap-4 min-h-full"
          style={{ ...backgroundStyle(profile), color: profile.textColor }}
        >
           <div className="w-24 h-24 bg-gray-300 rounded-full mb-2 flex items-center justify-center text-3xl font-bold text-black overflow-hidden">
             {profile.displayName?.charAt(0) || profile.username?.charAt(0) || 'U'}
           </div>
           <h2 className="font-bold text-xl">{profile.displayName || `@${profile.username}`}</h2>
           {profile.bio && <p className="text-center text-sm opacity-90">{profile.bio}</p>}

           <div className="w-full mt-4 space-y-4">
             <div
               className={`w-full text-center font-semibold transition-transform ${buttonSizeFontClass(profile.buttonSize)}`}
               style={{
                 backgroundColor: profile.buttonColor,
                 color: profile.buttonTextColor,
                 borderRadius: profile.buttonStyle === 'rounded' ? '9999px' : profile.buttonStyle === 'square' ? '0.5rem' : '0',
                 padding: buttonSizePadding(profile.buttonSize),
               }}
             >
               Sample Link 1
             </div>
             <div
               className={`w-full text-center font-semibold transition-transform ${buttonSizeFontClass(profile.buttonSize)}`}
               style={{
                 backgroundColor: profile.buttonColor,
                 color: profile.buttonTextColor,
                 borderRadius: profile.buttonStyle === 'rounded' ? '9999px' : profile.buttonStyle === 'square' ? '0.5rem' : '0',
                 padding: buttonSizePadding(profile.buttonSize),
               }}
             >
               Sample Link 2
             </div>
           </div>
        </div>
      </div>
    </div>
  )
}
