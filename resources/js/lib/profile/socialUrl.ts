// Lets the social-link dashboard form accept either a pasted profile URL or
// a bare username ("@handle" or "handle") and resolve it to a full URL —
// matches how Linktree's add-social flow behaves. Website has no fixed
// profile-URL shape, so it's intentionally excluded (raw URL only).
export const SOCIAL_URL_TEMPLATES: Record<string, (username: string) => string> = {
    Instagram: (u) => `https://instagram.com/${u}`,
    TikTok: (u) => `https://tiktok.com/@${u}`,
    Facebook: (u) => `https://facebook.com/${u}`,
    LinkedIn: (u) => `https://linkedin.com/in/${u}`,
    X: (u) => `https://x.com/${u}`,
    YouTube: (u) => `https://youtube.com/@${u}`,
    Snapchat: (u) => `https://snapchat.com/add/${u}`,
    Threads: (u) => `https://threads.net/@${u}`,
};

export function buildSocialUrl(platform: string, input: string): string {
    const trimmed = input.trim().replace(/^@/, '');
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (trimmed.includes('.') && trimmed.includes('/')) return `https://${trimmed}`;

    const template = SOCIAL_URL_TEMPLATES[platform];
    return template ? template(trimmed) : `https://${trimmed}`;
}
