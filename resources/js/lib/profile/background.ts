import type { CSSProperties } from 'react';

function shade(hex: string, percent: number): string {
    const h = hex.replace('#', '');
    const num = parseInt(h.length === 3 ? h.replace(/(.)/g, '$1$1') : h, 16);
    const clamp = (v: number) => Math.max(0, Math.min(255, v));
    const r = clamp(((num >> 16) & 0xff) + Math.round(255 * (percent / 100)));
    const g = clamp(((num >> 8) & 0xff) + Math.round(255 * (percent / 100)));
    const b = clamp((num & 0xff) + Math.round(255 * (percent / 100)));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Gradient options derived from the user's chosen solid color, so switching
 * to "Gradient" mode continues the color they already picked instead of
 * jumping to an unrelated fixed black/gray preset list.
 */
export function gradientsFromColor(bgColor: string): string[] {
    const lighter = shade(bgColor, 35);
    const darker = shade(bgColor, -35);

    return [
        `linear-gradient(135deg, ${bgColor}, ${darker})`,
        `linear-gradient(135deg, ${lighter}, ${bgColor})`,
        `linear-gradient(135deg, ${bgColor}, ${lighter})`,
        `linear-gradient(135deg, ${darker}, ${bgColor})`,
        `linear-gradient(135deg, ${lighter}, ${darker})`,
        `linear-gradient(135deg, ${darker}, #000000)`,
    ];
}

export function backgroundStyle(profile: { bgType: string; bgColor: string; bgGradient?: string | null; bgImage?: string | null }): CSSProperties {
    if (profile.bgType === 'gradient' && profile.bgGradient) {
        return { background: profile.bgGradient };
    }
    if (profile.bgType === 'image' && profile.bgImage) {
        return {
            backgroundImage: `url(${profile.bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        };
    }
    return { backgroundColor: profile.bgColor };
}
