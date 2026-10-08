import { useState, type ImgHTMLAttributes, type ReactNode } from 'react';

/**
 * Plain <img> tags show the browser's broken-image icon when a src 404s —
 * production had a batch of /uploads/* files go missing, and several pages
 * render user-controlled image URLs (avatars, link thumbnails, product
 * photos) with no fallback. This swaps to `fallback` on load failure instead.
 */
export function ImageWithFallback({
    src,
    fallback,
    ...imgProps
}: { src: string | null | undefined; fallback: ReactNode } & Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'>) {
    const [broken, setBroken] = useState(false);

    if (!src || broken) {
        return <>{fallback}</>;
    }

    return <img src={src} onError={() => setBroken(true)} {...imgProps} />;
}
