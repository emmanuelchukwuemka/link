# TapConnect Progress

Full V1 built per the TapConnect product blueprint, on top of the original Next.js 16 + Tailwind v4 + Prisma/SQLite scaffold.

## Architecture
- `/dashboard/*` — individual/employee personal dashboard (links, appearance, services, portfolio, store, cards, leads, analytics, subscription, settings)
- `/dashboard/business` — business admin console (company profile, team, card assignment, team analytics) — shown only to `business_admin` accounts
- `/admin/*` — platform (TapConnect operator) console: products, orders, cards, delivery zones, users, leads — requires `accountType: "admin"`, promoted via `node prisma/promote-admin.js <email>`
- `/[username]` — public profile (mini website + mini store + lead capture)
- `/c/[code]` — NFC tap redirect, logs `NFC_TAP`
- `/q/[username]` — QR scan redirect, logs `QR_SCAN`
- `/marketplace`, `/cart`, `/checkout`, `/orders/[orderNumber]` — physical card commerce + order tracking + mandatory post-payment profile setup

## Done
- [x] Data model: users (account types), businesses, employees, cards, products (physical + store), orders/payments, delivery zones, leads, analytics events, services/portfolio/testimonials/social links
- [x] Auth: individual + business registration, JWT/bcrypt, `proxy.ts` route protection (Next 16 renamed `middleware` → `proxy`)
- [x] Profile builder: links, social icons, services, portfolio, testimonials, business hours, lead form toggle, templates, fonts
- [x] Public profile: mini-website sections, real analytics event tracking (no mock data), lead capture, vCard save contact
- [x] Mini-store: per-user product CRUD + WhatsApp ordering on the public profile
- [x] Marketplace: seeded catalogue (Mini/Standard/Wristband), product pages, cart, checkout, admin-editable delivery zones
- [x] Payments: Paystack integration (init + server-side verify) with a dev-mode simulate fallback while `PAYSTACK_SECRET_KEY` is unset
- [x] Order pipeline: full status timeline, non-skippable profile-setup gate before production, admin shipping fields
- [x] Subscriptions: Free/Pro (₦10,000/yr), lead capture + branding removal gated to active Pro, auto-locks on expiry (profile never deleted)
- [x] Business: employees, card pool assignment, team engagement analytics
- [x] Platform admin: products, orders (status/courier/tracking), cards (generate/assign/deactivate), delivery zones, users, leads overview
- [x] Brand palette applied (black/white/soft-white/silver) across marketing, auth, dashboard, admin, and commerce UI

## Known gaps / intentionally deferred (see AGENTS.md V1 scope notes)
- Paystack needs real keys in `.env` (`PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`) — dev mode simulates payment success in the meantime
- No email/WhatsApp/SMS notification delivery (order/subscription events aren't sent anywhere yet)
- No CSV bulk employee onboarding (single-employee add form only)
- No campaign tracking, courier API integration, or native apps (explicitly V2/V3 per spec)
- Pro-plan gating is enforced only for lead capture + branding removal, not every listed Pro perk
