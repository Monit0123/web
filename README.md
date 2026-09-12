# ONYX Athletic Club — website

Static marketing site for ONYX Athletic Club (Kharar, Punjab). No build step, no
dependencies: HTML, one stylesheet, one script. Open `index.html` or serve the
folder and it runs.

```bash
python3 -m http.server 3000    # then visit http://localhost:3000
```

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Home — hero, pillars, coaches, timetable, memory wall, FAQ, plans, visit |
| `about.html` | Philosophy, values, coaches, milestones |
| `privacy.html` | Privacy policy, membership terms, refund policy |
| `weight-loss.html` … `membership.html` | 5 SEO landing pages — unique titles/descs, Service + FAQPage schema, lead-capture dialog, in sitemap |
| `admin.html` | Admin control center — gated by `ADMIN_EMAILS`; revenue/members overview, member management (add/renew/plan/trainer/suspend/delete), lead CRM with pipeline + conversion, reminder queues with WhatsApp actions, inventory, staff + roles, reports, mini-CMS (same-browser demo) |
| `trainers.html` | Trainer dashboard — gated by `COACH_EMAILS`; client files, program assign/modify/build, diet plans + client intake review, sessions + availability, goals, measurements, PRs, notes, messages, attendance + photo review (same-browser demo) |
| `profile.html` | Member dashboard — membership, today overview, training, diet plans + calorie tracker + food database, programs, progress photos, attendance, coach corner, AI assistant, personal goals, challenges & leaderboards, notification center, PT booking |
| `404.html` | Not-found page |

Supporting files: `robots.txt`, `sitemap.xml`, `site.webmanifest`, `favicon.ico`,
`.nojekyll` (stops GitHub Pages running the folder through Jekyll).

## Previewing the gated dashboards

`admin.html`, `trainers.html` and the manager views are roster-gated. All three
rosters currently contain one demo address so a single account unlocks
everything:

1. Serve the folder (`python3 -m http.server 3000`) and open any page.
2. Choose **Log in → Sign up** and register `demo@onyxathletic.club` with any
   name and a password of 6+ characters. Accounts are browser-local
   (`localStorage`) until `AUTH_ENDPOINT` is set.
3. Click **Skip for now** on the assessment dialog.
4. Open `admin.html` (owner control center) or `trainers.html` (coach studio).
   The reception desk on `profile.html` uses the PIN `2468`.

To use real staff instead, replace the addresses in `ADMIN_EMAILS`,
`MANAGER_EMAILS` and `COACH_EMAILS` at the top of `script.js`, then bump `?v=`.

## Before going live — do these three things

### 1. Set the real domain

The site currently uses the placeholder `https://onyxathletic.club` in canonical
tags, Open Graph URLs, `robots.txt` and `sitemap.xml`. Replace it everywhere:

```bash
grep -rl 'onyxathletic.club' . | xargs sed -i 's|https://onyxathletic.club|https://YOUR-DOMAIN|g'
```

### 2. Wire up the backend

Every integration lives in the `ONYX` config object at the top of `script.js`.
All of them degrade safely when left blank, so the site works today — but leads
and memberships need a server to be handled properly.

| Key | What it does when set | Behaviour when blank |
| --- | --- | --- |
| `CONTACT_ENDPOINT` | `POST {name, phone, source, at}` for every call-back request | Opens a pre-filled WhatsApp message and shows call/email links, plus a `localStorage` copy |
| `AUTH_ENDPOINT` | Real signup/login | Browser-local demo accounts (PBKDF2-SHA256, 210k iterations, per-user salt) |
| `MEMBERSHIP_VERIFY_ENDPOINT` | `POST {email, ref, plan, paymentId}` → `{active: true, plan}` unlocks the member's training and diet plans | Membership stays **pending** and staff activate manually |

### 3. Understand how payments are gated

> **A membership is only ever activated by a successful response from
> `MEMBERSHIP_VERIFY_ENDPOINT`.**

Clicking *Continue* on a plan opens the Razorpay Payment Link and records a
**pending** request with a reference like `ONYX-M8F2K1-A9C3`. It does not grant
access. This is deliberate: a browser cannot prove a payment succeeded — only
the Razorpay Payments API can, and that requires a key secret which must never
be shipped to the client. Without this endpoint it is impossible to unlock paid
content by opening the payment tab and closing it.

Your verification route should:

1. Take the posted `ref` / `paymentId` and the logged-in user's email.
2. Call the Razorpay API server-side (or read your payment webhook records) to
   confirm the payment is **captured** and the amount matches the plan.
3. Return `{ "active": true, "plan": "3 months membership" }` only then.

Also configure the Razorpay Payment Links to redirect back to the site so the
`razorpay_payment_link_status` parameters are picked up automatically — the
script already reads them on load and re-checks with your endpoint.

The live payment links (4 membership + 3 PT packs) are in `PAYMENT_LINKS` in `script.js`.

## Notes

- **Images.** Photography ships as WebP with JPEG fallbacks (`<picture>` in
  markup, `image-set()` in CSS). If you replace a photo, generate both:
  `convert photo.jpg -strip -resize 'x1200>' -quality 78 photo.webp`
- **Demo config.** `COACH_EMAILS`, `ADMIN_EMAILS`, `MANAGER_EMAILS` and `RECEPTION_PIN` live in `script.js` — confirm the PIN before launch. `GYM_LOCATION` is set to the owner-supplied coordinates 30.754742, 76.622115 (used by the map embed, the directions link and the member check-in geofence).
- **Cache busting.** Stylesheet and script are linked as `?v=50`. Bump that
  number whenever you edit `styles.css` or `script.js`.
- **"Train your way" hub.** Each of the five rows promises one thing and its
  click delivers exactly that: *Strength training* and *Mobility & recovery*
  open the same program dialogs as the pillar tiles (`data-program`, with the
  row's `href="#train"` as the no-JS fallback), while *Group classes*,
  *Personal training* and *Community* scroll to the timetable, the PT pricing
  and the memory wall. The small line under each label is quoted from that
  destination's own copy — if you change the 14-person cap, the ₹799 rate or
  the wall's cards, update the subline with it.
- **Film player.** The *Watch the room* reel is deliberately chrome-free: one
  play disc on the poster, then **click or Space** toggles play/pause — no
  control bar, no seek bar, no shortcut legend. A buffering spinner and a
  failure card are the only other states. It lives in the `FILM PLAYER` block
  at the end of `script.js` with styles under the matching banner in
  `styles.css`. Progressive enhancement: the `<video>` keeps its native
  `controls` attribute and the script removes it only after the custom UI
  initialises, so a failed script load still leaves a working browser player.
- **The reel itself.** `assets/onyx-tour.mp4` (18s, 1080p25, voiced, ~4.3 MB,
  `+faststart`) is an AI-generated brand film: six photoreal stills of one
  synthetic guide in one coherent interior, animated with camera pushes and
  pans, 0.5s dissolves, a contrast/saturation grade and fine grain, cut on the
  narration's real sentence boundaries (solved from `silencedetect`), ending on
  a drawn brand card. Source stills live in `assets/gen/`; the poster is
  `assets/onyx-tour-poster.jpg`. **The presenter is synthetic** — she is not a
  member or a coach. Organic use is your call, but paid placements on Meta /
  Google may require an AI-content disclosure. The previous
  `onyx-overview.mp4` was generic stock-style footage of a different gym and
  has been deleted (recoverable from git history).
- **Site photography is synthetic.** The three pillar tiles, the About-page
  band and the memory wall are AI-generated placeholders shot to match the
  reel's invented interior (one coherent room, dark charcoal + deep green,
  warm practicals). The wall ships two moments open — *01 / FIRST 5K CLUB*
  and *02 / POST CLASS* — plus six more (03–08) inside a smoothly expanding
  panel behind **More moments from the wall** — a full-width list row under the
  grid; the six cards rise in staggered as it eases open. With JS disabled the
  panel stays open so nothing is hidden. Every person in these images is
  synthetic: swap in real member and coach photos before launch.
- **Placeholder photography.** Several `assets/*.jpg` "facility" shots are
  stock-style renders, not the Kharar room — `facility-strength.jpg` even
  carries a third-party "ELITE STRENGTH" sign, and `gym-hero.jpg` is a frame
  from the old stock clip. Replace them before launch; the coherent AI stills
  in `assets/gen/` are a ready drop-in set.
- **Mobile.** The `MOBILE POLISH` layer at the end of `styles.css` handles touch
  feel: no tap highlight, `touch-action: manipulation` (no double-tap zoom
  delay), contained overscroll on the coach rail / timetable / dialogs,
  safe-area insets under the FAB and menu, 16 px input text so iOS never
  zooms on focus, edge shadows that reveal the timetable scrolls, plus
  extra passes for phones under 400 px and landscape phones. The `MOBILE FIT`
  layer after it keeps touch clean: taps trigger no hover wipe (pointer-type
  guarded in `script.js`), stuck `:hover` states are reset under
  `(hover: none)`, the floating contact pill becomes a 56 px disc with an
  `aria-label`, page-level CTAs size to their label instead of full-width
  slabs, and the burger / story dots / footer links get real tap targets. The existing
  breakpoints (720 / 900 / 680 / 860 / 1100 / 1250) and the full-screen
  mobile menu were already sound and are untouched.
- **Accessibility.** Skip links, focus-visible states, labelled dialogs and a
  `prefers-reduced-motion` block are in place — keep them if you refactor.
- `profile.html` is `noindex` and disallowed in `robots.txt`; it is a private
  member area.

## Security (#19)

In place on the frontend:

- **Passwords.** PBKDF2-SHA256, 210k iterations, unique 16-byte salt per
  user; legacy SHA-256 hashes upgrade silently on next login. Minimum 6
  characters, enforced on signup and admin-created accounts.
- **Rate limiting.** Login: 5 wrong attempts → 60s lockout (per browser).
  Reception PIN: 5 wrong attempts → 60s lockout (per tab session).
- **Sessions.** Member session is an email pointer in `sessionStorage`
  (tab-scoped); staff unlock is a separate tab-scoped flag. No tokens or
  secrets are stored anywhere or committed to the repo.
- **XSS hygiene.** All user/member/lead content is rendered through `esc()`;
  photo uploads are resized client-side and capped at ~30 per member.
- **Transport.** Every `target="_blank"` link ships `rel="noopener"`.
- **Gating.** `admin.html` requires an `ADMIN_EMAILS` (or limited
  `MANAGER_EMAILS`) login and is `noindex` + disallowed in `robots.txt`,
  alongside `profile.html` and `trainers.html`.
  ⚠️ The three rosters currently hold the demo address
  `demo@onyxathletic.club` (see below) — **clear or replace them before
  launch**, or anyone who signs up with that address gets owner access.
- **Terms.** Membership terms, refunds, health and conduct live in
  `privacy.html`, linked from every footer as “Privacy & Terms”.

Honest backend-must list (client-side measures above are not enough alone):

- Real auth (server sessions/JWT, httpOnly cookies), server-side rate
  limits, hashed PIN + member-code verification, payment capture via the
  gateway, and server-pushed reminders/OTP before production launch.
