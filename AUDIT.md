# ONYX Athletic Club — pre-launch audit

Date: 18 September 2026

The site is running in the sandbox at the live preview labelled **ONYX website**. It is a static, no-build HTML/CSS/JavaScript site with 12 pages and about 291 KB of JavaScript / 141 KB of CSS. I inspected the public pages, member dashboard, coach dashboard, admin dashboard, payment flow, SEO files, and storage/auth code.

## Executive summary

The visual direction is strong: distinctive dark/lime identity, good photography, clear information architecture, responsive CSS, semantic landmarks, skip links, dialog labels, lazy-loaded secondary images, WebP assets, metadata, a manifest, and reduced-motion support.

It is **not production-ready as a real client/member product** while auth, leads, payments, admin, coach records, messages, photos, and site content remain browser-local. Any visitor can use DevTools or edit localStorage/sessionStorage to impersonate or alter data. Multiple devices do not share data. A private/incognito browser can lose data. A browser cannot safely verify a payment.

For tomorrow morning, launch the public marketing site only after the content/legal/payment checks below. Keep member/admin/coach features visibly labelled as demo or hide them until a backend is connected.

## P0 — must fix before accepting real members or payments

1. **Replace browser-local auth.** `localStorage` stores the account database, session pointer, leads, members, programs, notes, messages, attendance, inventory, staff, and CMS overrides. PBKDF2 is better than plain text, but it is still entirely client-controlled. Add real auth with server-side password hashing, httpOnly secure cookies, CSRF protection, session expiry/revocation, server-side validation, and rate limiting.
2. **Remove the client-side staff PIN.** `RECEPTION_PIN` currently defaults to `2468` in `script.js`. A PIN inside a public JavaScript file is not a secret. Reception/admin/coach permissions must be checked on the server per request.
3. **Connect payment verification before selling access.** Razorpay links are present, but the verification endpoint is blank. Keep access pending until a server verifies a captured payment, amount, plan, reference, and webhook signature. Never put a Razorpay secret in this repository or browser code. Test successful, failed, abandoned, duplicate, refunded, and delayed payments.
4. **Connect lead delivery.** `CONTACT_ENDPOINT` is blank, so requests fall back to WhatsApp/email plus localStorage. A lead can be lost or exposed on a shared device. Use a server endpoint or CRM integration with spam protection, consent timestamp, source/UTM capture, owner notification, and a delivery retry/error state.
5. **Confirm the public claims.** The homepage says 12K+ members, 40+ coaches, 8 years, 150+ weekly sessions, and a 4.9/12,000 aggregate rating. Replace with verified numbers or remove them. The results section has a TODO to replace photos and obtain written member consent. Do that before publishing real people/results.
6. **Confirm business/legal details.** Verify the address, pincode, phone, email, Sunday hours, pricing, refund/freeze policy, GST/invoice requirements, health disclaimer, emergency process, privacy/data retention policy, and who is legally responsible for the gym. Do not collect health, body measurements, progress photos, or messages without explicit consent and retention/deletion rules.
7. **Protect private routes.** `noindex` is not access control. `profile.html`, `admin.html`, and `trainers.html` need server-side authorization and ideally should be served behind authenticated routes. Remove the admin link from public footers unless intentional.

## P1 — fix before or immediately after launch

### Conversion and UX

- The homepage is highly editorial and attractive, but the first screen should answer in under five seconds: where ONYX is, who it is for, price/starting price, what the first step is, and when someone will hear back. Add a compact trust/location/CTA strip near the hero.
- Make “Book free trial” the primary conversion and “See membership plans” the secondary one. Repeat one clear CTA after the method, results, FAQ, and visit sections.
- Add a real booking flow: preferred date/time, goal, experience level, consent, confirmation, reschedule/cancel, and staff calendar availability. The current callback form only asks name and phone.
- Show WhatsApp, call, directions, and hours as first-class mobile actions. Add `aria-label`s with the action and number where useful.
- Pricing should show per-month equivalent, taxes/fees if applicable, plan terms, pause/refund rules, and what happens after payment. Add a comparison table or a concise “all plans include…” block.
- Replace generic/possibly fictional coach names, member stories, and stats with real staff bios, qualifications, photos, and consented testimonials.
- Add visible states for loading, offline, failure, duplicate submit, pending payment, payment success, and payment support. Never imply a lead was received unless the server acknowledged it.
- Add a sticky mobile bottom action bar for the public site (`Call`, `WhatsApp`, `Book trial`) and a separate member app bottom nav (`Today`, `Plan`, `Progress`, `Coach`, `More`). Keep it above the safe-area inset.
- Use one icon system instead of text arrows/emoji in critical actions; keep a text label for accessibility.

### Mobile/app experience

- The public mobile menu exists and is responsive. Test it at 320, 360, 390, 414, and 768 CSS px, landscape, browser zoom 200%, and iOS Safari.
- Add `padding-bottom: env(safe-area-inset-bottom)` to fixed mobile controls and avoid the floating CTA covering form buttons or chat inputs.
- Member dashboard needs a true daily home: next session, today’s workout, check-in, streak, calories/steps, one-tap coach message, and upcoming booking. Secondary analytics should be behind tabs.
- Add install guidance only after testing the manifest. There is no service worker, so this is installable-looking but not genuinely offline. If offline support is required, add a service worker with a deliberate cache/update strategy; otherwise explain that internet is required.
- Avoid putting sensitive progress photos and health data in local IndexedDB on shared/public devices. Add device logout, delete-all-data, export-data, and “this is a shared device” guidance.

### Accessibility

- Run axe/Lighthouse and manual keyboard testing on every dialog, menu, form, carousel, timetable, and dashboard tab.
  - **Done (axe-core 4.13, all 13 pages, run twice — as-loaded and with every dialog/`[hidden]` panel forced open): 0 violations.** Fixed on the way: `nested-interactive` + `aria-allowed-role` (the `.memory-card` articles and `.film-video-wrap` each had `role="button"`/`tabindex` *and* a real button inside doing the identical action — the wrappers are now plain containers, and the memory zoom button is already revealed on keyboard focus by `.memory-card:focus-within`); `region` (`diagnostics.html` content is now inside `<main>`); `heading-order` (the two `privacy.html` legal kickers are now `<h2>`, so the outline runs h1 → h2 → h3, with a `letter-spacing:.14em!important` opt-out so they don't inherit the `h2{-0.07em!important}` optical tightening). All 118 icon glyph exposures are now `aria-hidden`; the 62 icon-only buttons already had `aria-label`s, so this was about the 54 icon+text controls, 27 of which were being announced. Also fixed WCAG 2.5.3 Label-in-Name on the "Book trial" action and the "Call now" tile, where the `aria-label` did not contain the visible text. **Lighthouse itself was not run** — no Chrome binary is available in this environment; colour-contrast also reports `incomplete` under jsdom (no layout) rather than pass/fail, so both still need a real browser pass.
- Ensure every interactive element has a visible focus state and at least a 44 x 44 px touch target. Check colour contrast for muted text, lime on light backgrounds, placeholders, and small mono labels.
- Add focus trapping and focus restoration to dialogs; test Escape and screen readers.
- The horizontal coach rail needs keyboard controls and an accessible position/status. Do not rely on “drag or scroll” alone.
- Respect reduced motion everywhere, not just some CSS transitions and scrolling.
- Add clear inline errors associated with inputs using `aria-describedby`, and announce async status with a live region.

### Speed and stability

- Self-host only the exact font weights actually used, or use a system stack for the first paint. Google Fonts adds DNS/TLS/request latency and can be blocked.
- Keep the hero WebP preload, but verify the `imagesrcset` and `sizes` behaviour on real devices. Serve AVIF where supported and keep JPEG fallback.
- The video is ~526 KB, which is reasonable, but add a poster, `preload="metadata"`, and verify autoplay/muted/playsinline behaviour on iOS. Do not make the video critical to understanding the page.
- Compress/strip every image and serve responsive widths rather than always downloading large portrait JPEG fallbacks. Add long-lived immutable cache headers for hashed assets.
- Avoid shipping the 291 KB monolithic script to every public page. Split marketing, member, coach, and admin code, or at minimum lazy-load dashboard modules only on their pages.
- Add a Content Security Policy, Referrer-Policy, Permissions-Policy, HSTS (at the host), `X-Content-Type-Options`, and frame protection as HTTP headers. Headers cannot be fully enforced by static HTML alone.
- Add error monitoring and uptime monitoring before paid traffic: Sentry/ similar for JS errors, and a simple health check for the backend/payment webhook.

### SEO and trust

- Replace `trainwithonyx.fwh.is` everywhere once the real domain is confirmed, including canonical tags, Open Graph URLs, `robots.txt`, `sitemap.xml`, JSON-LD, and payment redirects.
- Generate a real OG image and social previews. Validate all JSON-LD; remove the aggregate rating unless it is a genuine, review-platform-supported rating.
- Verify the `ExerciseGym`, `LocalBusiness`, Offer, FAQPage, and opening-hours data against reality. Sunday closed hours should be represented in a way search engines accept.
- Add Organization/LocalBusiness details such as logo, service area, sameAs, and precise map coordinates after confirmation.
- Add a Google Business Profile and ask for reviews only from real members. Add a consented analytics/ads plan if marketing needs attribution; update the privacy policy before enabling tracking.

## Storage/localStorage findings

Current browser-local storage is useful for a prototype and same-browser demo, but not a live business system:

- Different phones, browsers, private windows, and staff devices do not share state.
- Clearing site data loses accounts, leads, memberships, photos, plans, and CMS edits.
- Users can read and edit all local data and call JavaScript functions from DevTools.
- A localStorage quota can be reached, especially with base64 photos and growing dashboard history.
- There is no reliable backup, audit trail, concurrency handling, webhook source of truth, or staff notification.
- IndexedDB is used for transformation photos, but it remains device-local and vulnerable to loss/clearing.
- Sensitive health/progress data should not be treated as secure because it is stored in the browser.

Recommended minimum backend: managed Postgres database, server auth/session layer, object storage for photos, Razorpay webhook/verification route, lead notification/CRM route, role-based access control, audit logs, daily backups, and a small admin API. Supabase/Firebase can reduce tomorrow’s setup time; a custom API is appropriate later if workflows grow.

Suggested core tables: `users`, `roles`, `memberships`, `plans`, `payments`, `payment_events`, `leads`, `appointments`, `attendance`, `programs`, `program_assignments`, `measurements`, `progress_photos`, `messages`, `staff`, `inventory`, `consents`, `audit_events`.

## What you need to provide in plain terms

### Must provide today

1. **Final business identity:** legal/business name, logo files, brand colours if different, correct domain, and the exact public contact person.
2. **Verified gym details:** exact address and map pin, pincode, phone, WhatsApp number, email, hours, holiday hours, parking details, and whether Sunday is closed.
3. **Final offers:** plan names, prices, taxes, duration, start date, included benefits, freeze/cancel/refund rules, PT prices, free-trial rules, and whether memberships auto-renew.
4. **Payment account:** Razorpay account owner access, live payment links or permission to create them, redirect URL, and webhook URL setup. Never send a secret in chat; add it as a hosting/provider secret.
5. **Lead destination:** CRM, email inbox, WhatsApp number, or a form service. Tell us who receives leads and the promised response time.
6. **Real proof:** approved coach names/photos/bios, real member testimonials/photos, written consent, and verified business metrics. Send only material you have permission to publish.
7. **Legal copy:** privacy policy, terms, refund/cancellation/freeze policy, health/safety waiver, photo consent wording, and business/GST invoice details.
8. **Launch destination:** hosting provider, domain registrar/DNS access or the person who will make DNS changes, and the preferred deployment target (Cloudflare Pages, Netlify, Vercel, GitHub Pages for marketing-only, etc.).

### Useful but can follow after the public launch

- Real timetable and class capacity rules.
- Trainer availability and appointment calendar.
- Member onboarding questions and health-intake consent.
- Brand/social links and approved social handles.
- Analytics/CRM choice and events to measure.
- Support escalation contact and refund/payment-failure process.

## How to obtain and share each item safely

- **Domain/DNS:** log in to the registrar, copy the DNS records or invite the deployment email as a restricted collaborator. Do not send the registrar password.
- **Razorpay:** Dashboard → Payment Links for links; Dashboard → Webhooks for webhook setup. Give a developer role or create restricted keys. Put secrets in the hosting dashboard’s Environment Variables, never in HTML/JS or chat.
- **Google Maps:** search the verified business listing, copy the “Share” link and exact map pin; do not guess coordinates.
- **Business documents:** export PDF or paste the approved text. Remove unnecessary personal IDs and bank details.
- **Photos/logo:** upload original files to the project/shared drive with each person’s written permission and the preferred filename/caption. Avoid sending private member health data.
- **Hosting:** invite a restricted project collaborator or provide the deployment project name. Never share passwords or one-time codes.
- **Email/WhatsApp/CRM:** create a dedicated business account and a provider API key with the smallest required permissions; store it as a secret in the provider dashboard.

## Recommended launch sequence for tomorrow

1. Freeze public copy, price, contact, legal, and payment decisions.
2. Deploy the marketing pages only; disable or clearly label dashboards as demo until server auth exists.
3. Test every CTA on desktop and mobile, including phone, WhatsApp, map, forms, and payment redirects.
4. Test a real low-value payment in test mode, then production only after webhook verification and refund testing.
5. Run Lighthouse/axe, check 404/robots/sitemap/canonical/domain, and test on a real Android and iPhone over 4G.
6. Add monitoring, backups, and a human support fallback.
7. After launch, build the backend in order: leads → auth → payments → bookings → member dashboard → coach/admin workflows.

## Bottom line

The public-facing foundation is good enough to polish and deploy quickly. The localStorage dashboards are a convincing prototype, not a secure multi-user product. The safest tomorrow-morning scope is: launch a fast public site with real contact/booking capture, real payment verification, verified claims, complete legal copy, and no claim that the member/admin/coach areas are live until the backend is connected.
