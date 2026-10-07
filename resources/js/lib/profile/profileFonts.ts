// Maps the plain font-name strings stored in User.font_family to the actual
// CSS value to use. Self-hosted via @fontsource, wired as CSS variables in
// resources/css/app.css — a bare fontFamily: "Poppins" has no matching
// @font-face and just silently falls back to the browser default otherwise.
const PROFILE_FONT_CSS: Record<string, string> = {
    Inter: 'var(--font-profile-inter), sans-serif',
    Georgia: 'Georgia, serif', // Web-safe system font — no loading needed.
    Poppins: 'var(--font-profile-poppins), sans-serif',
    'Playfair Display': 'var(--font-profile-playfair), serif',
    'Roboto Mono': 'var(--font-profile-roboto-mono), monospace',
};

export function profileFontFamily(fontName: string | null | undefined): string {
    return PROFILE_FONT_CSS[fontName || 'Inter'] || PROFILE_FONT_CSS.Inter;
}
