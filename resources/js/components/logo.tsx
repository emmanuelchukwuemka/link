// The source lockup (logo.png) is a tall, stacked splash graphic — icon mark,
// wordmark and tagline stacked vertically — which reads as cropped/illegible
// when squeezed into a short horizontal navbar slot. For header use we pair
// the extracted icon mark (logo-icon.png) with real, crisp HTML text instead,
// so it stays legible at any size rather than shrinking a raster of text.
export function Logo({
    className = 'h-10',
    invert = false,
}: {
    className?: string;
    invert?: boolean;
}) {
    return (
        <span className={`inline-flex items-center gap-2 ${className}`}>
            <img src="/logo-icon.png" alt="" className={`h-full w-auto object-contain ${invert ? 'invert' : ''}`} />
            <span className={`font-bold tracking-tight text-xl leading-none whitespace-nowrap ${invert ? 'text-black' : 'text-white'}`}>
                TapConnect
            </span>
        </span>
    );
}
