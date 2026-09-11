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
| `trainers.html` | Trainer dashboard — gated by `COACH_EMAILS`; client files, program assign/modify/build, diet plans + client intake review, sessions, goals, measurements, PRs, notes, messages, attendance + photo review (same-browser demo) |
| `profile.html` | Member dashboard — membership, today overview, training, diet plans + calorie tracker + food database, programs, progress photos, attendance, coach corner |
| `404.html` | Not-found page |

Supporting files: `robots.txt`, `sitemap.xml`, `site.webmanifest`, `favicon.ico`,
`.nojekyll` (stops GitHub Pages running the folder through Jekyll).

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
- **Demo config.** `COACH_EMAILS`, `RECEPTION_PIN` and `GYM_LOCATION` live in `script.js` next to their features — confirm the PIN and coordinates before launch.
- **Cache busting.** Stylesheet and script are linked as `?v=29`. Bump that
  number whenever you edit `styles.css` or `script.js`.
- **Accessibility.** Skip links, focus-visible states, labelled dialogs and a
  `prefers-reduced-motion` block are in place — keep them if you refactor.
- `profile.html` is `noindex` and disallowed in `robots.txt`; it is a private
  member area.
