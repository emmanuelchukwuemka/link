export type TemplateName = 'minimal' | 'executive' | 'business' | 'creator' | 'luxury' | 'professional';

type TemplateConfig = {
    avatarShape: string;
    avatarRing: string;
    card: string;
    heading: string;
};

const TEMPLATES: Record<TemplateName, TemplateConfig> = {
    minimal: {
        avatarShape: 'rounded-full',
        avatarRing: 'border-2 border-white/20',
        card: 'bg-black/5 rounded-2xl',
        heading: 'font-bold text-lg',
    },
    executive: {
        avatarShape: 'rounded-lg',
        avatarRing: 'border border-current/20',
        card: 'border border-current/15 rounded-lg',
        heading: 'font-bold text-base uppercase tracking-wide',
    },
    business: {
        avatarShape: 'rounded-xl',
        avatarRing: 'border border-current/20',
        card: 'border border-current/15 rounded-xl',
        heading: 'font-bold text-lg',
    },
    creator: {
        avatarShape: 'rounded-full',
        avatarRing: 'border-4 border-white/40 shadow-lg',
        card: 'bg-black/5 rounded-3xl shadow-md',
        heading: 'font-extrabold text-xl',
    },
    luxury: {
        avatarShape: 'rounded-full',
        avatarRing: 'border border-current/30',
        card: 'border border-current/10 rounded-none',
        heading: 'font-semibold text-base uppercase tracking-[0.2em]',
    },
    professional: {
        avatarShape: 'rounded-full',
        avatarRing: 'border-2 border-current/10',
        card: 'bg-black/5 rounded-xl',
        heading: 'font-bold text-sm uppercase tracking-wider',
    },
};

export function getTemplate(name: string | null | undefined): TemplateConfig {
    return TEMPLATES[name as TemplateName] || TEMPLATES.minimal;
}
