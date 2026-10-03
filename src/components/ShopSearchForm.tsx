'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

export function ShopSearchForm() {
  const router = useRouter()
  const [value, setValue] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim()) {
      router.push(`/marketplace?q=${encodeURIComponent(value.trim())}#catalog`)
    } else {
      router.push('/marketplace#catalog')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 max-w-2xl mx-auto">
      <div className="flex w-full items-center rounded-full bg-white shadow-xs ring-1 ring-inset ring-black/5 focus-within:ring-2 focus-within:ring-white/40 transition-all">
        <div className="pl-4 pr-2 flex items-center justify-center text-[#66635F]">
          <Search size={16} />
        </div>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search smart cards, rings, stands and accessories..."
          className="flex-1 min-w-0 py-2.5 text-xs sm:text-sm text-[#181818] outline-none bg-transparent placeholder-[#8A8782]"
        />
        <button
          type="submit"
          aria-label="Search"
          className="m-1 bg-[#181818] hover:bg-[#2a2a2a] text-white w-9 h-9 sm:w-auto sm:px-5 rounded-full font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors shrink-0 active:scale-[0.97]"
        >
          <Search size={15} className="sm:hidden" />
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>
    </form>
  )
}
