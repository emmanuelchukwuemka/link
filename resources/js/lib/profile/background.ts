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

function rosette(cx: number, cy: number, scale: number, rotate: number): string {
    return `<g transform="translate(${cx},${cy}) rotate(${rotate}) scale(${scale})">
        <ellipse cx="0" cy="-10" rx="7" ry="5" fill="#3b2414"/>
        <ellipse cx="9" cy="-3" rx="6" ry="5" fill="#3b2414"/>
        <ellipse cx="6" cy="8" rx="7" ry="5" fill="#3b2414"/>
        <ellipse cx="-6" cy="7" rx="6" ry="5" fill="#3b2414"/>
        <ellipse cx="-9" cy="-4" rx="6" ry="5" fill="#3b2414"/>
    </g>`;
}

const LEOPARD_PRINT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220">${[
    rosette(30, 30, 1, 10),
    rosette(110, 20, 1.3, -15),
    rosette(190, 60, 0.9, 25),
    rosette(60, 100, 1.1, -5),
    rosette(150, 120, 1.4, 40),
    rosette(20, 180, 1, -20),
    rosette(100, 190, 1.2, 15),
    rosette(195, 195, 0.8, -30),
].join('')}</svg>`;

export function leopardPrintStyle(): CSSProperties {
    return {
        backgroundColor: '#D9B382',
        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(LEOPARD_PRINT_SVG)}")`,
        backgroundSize: '220px 220px',
        backgroundRepeat: 'repeat',
    };
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
    if (profile.bgType === 'pattern') {
        return leopardPrintStyle();
    }
    return { backgroundColor: profile.bgColor };
}
