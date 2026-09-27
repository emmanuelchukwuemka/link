import Image from 'next/image'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { Nfc, type LucideIcon } from 'lucide-react'

export function AuthHero({
  heading,
  subtext,
  checklist,
}: {
  heading: React.ReactNode
  subtext: string
  checklist: { icon: LucideIcon; label: string }[]
}) {
  return (
    <div className="relative hidden lg:flex flex-col justify-between bg-[#0A0A0A] text-white p-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_60%)]" />

      <div className="relative">
        <Link href="/" className="inline-flex items-center mb-10">
          <Logo className="h-8 w-auto" />
        </Link>

        <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-white/50 border border-white/15 rounded-full px-3 py-1 w-fit">
          NFC Powered &middot; Smarter Connections
        </span>
        <h1 className="text-4xl font-bold leading-[1.1] tracking-tight mt-5 mb-4 max-w-sm">
          {heading}
        </h1>
        <p className="text-white/60 leading-relaxed max-w-sm mb-8">{subtext}</p>

        <ul className="space-y-3">
          {checklist.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3 text-sm text-white/80">
              <span className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center shrink-0">
                <Icon size={15} />
              </span>
              {label}
            </li>
          ))}
        </ul>
      </div>

      {/* Hero graphic */}
      <div className="relative h-56 mt-10">
        <div className="absolute left-0 bottom-4 w-28 h-40 bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-2xl -rotate-6 flex flex-col justify-between p-3">
          <Nfc size={16} className="text-white/60" />
          <p className="font-bold tracking-tight text-xs">TapConnect</p>
        </div>
        <div className="absolute left-16 bottom-8 w-28 h-40 bg-white rounded-2xl shadow-2xl rotate-6 flex flex-col justify-between p-3">
          <Nfc size={16} className="text-black/50" />
          <p className="font-bold tracking-tight text-xs text-black">TapConnect</p>
        </div>
        <div className="absolute right-24 bottom-0 w-20 h-8 rounded-full bg-black border border-white/10 flex items-center justify-center gap-1">
          <Nfc size={12} className="text-white/70" />
          <span className="text-[9px] font-bold">TapConnect</span>
        </div>
        <div className="absolute right-0 bottom-0 w-40">
          <Image src="/phone-mock.png" alt="TapConnect profile shown on a phone" width={1020} height={1541} className="w-full h-auto drop-shadow-2xl" />
        </div>
      </div>
    </div>
  )
}
