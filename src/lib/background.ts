import type { CSSProperties } from 'react'

export function backgroundStyle(profile: {
  bgType: string
  bgColor: string
  bgGradient?: string | null
  bgImage?: string | null
}): CSSProperties {
  if (profile.bgType === 'gradient' && profile.bgGradient) {
    return { background: profile.bgGradient }
  }
  if (profile.bgType === 'image' && profile.bgImage) {
    return {
      backgroundImage: `url(${profile.bgImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  }
  return { backgroundColor: profile.bgColor }
}
