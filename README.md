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
| `profile.html` | Member area — assessment results, training week, diet plan |
| `404.html` | Not-found page |

Supporting files: `robots.txt`, `sitemap.xml`, `site.webmanifest`, `favicon.ico`,
`.nojekyll` (stops GitHub Pages running the folder through Jekyll), and
`server/` — the payments worker that automates membership activation.

## Before going live — do these three things

### 1. Set the real domain

The site is live at `https://trainwithonyx.fwh.is/` (with a mirror at
`https://monit0123.github.io/web/`). Every canonical tag, Open Graph URL,
`robots.txt` and `sitemap.xml` entry points at the live domain. When you buy
the real domain and point it at hosting, replace it everywhere:

```bash
grep -rl --exclude=README.md 'https://trainwithonyx.fwh.is' . \
  | xargs sed -i 's|https://trainwithonyx.fwh.is|https://YOUR-DOMAIN|g'
```

### 2. Deploy the payments worker (automated checkout)

By default the site uses the manual flow: Razorpay Payment Links + a reference
ID + staff confirming each payment. The worker in `server/` replaces that with
fully automatic activation — the member pays in the Razorpay Checkout modal and
their membership unlocks the moment the payment clears. No human involvement.

It is a Cloudflare Worker: free tier, no credit card, ~3 minutes to deploy.

1. Create a free account at <https://dash.cloudflare.com> (no card needed).
2. Install the CLI and log in:
   ```bash
   npm install -g wrangler
   wrangler login
   ```
3. Create the storage, then paste the printed `id` into `server/wrangler.toml`
   (replacing `YOUR_KV_ID`):
   ```bash
   cd server
   wrangler kv namespace create PAYMENTS
   ```
4. Add your Razorpay API keys as secrets (Dashboard → Account & Settings → API
   Keys → Generate Test/Live key). Start with **test** keys:
   ```bash
   wrangler secret put RAZORPAY_KEY_ID
   wrangler secret put RAZORPAY_KEY_SECRET
   ```
5. Deploy and note the URL it prints (e.g.
   `https://onyx-payments.your-subdomain.workers.dev`):
   ```bash
   wrangler deploy
   ```
6. Point the site at it: set `PAYMENTS_API` at the top of `script.js` to the
   worker URL, then bump the `?v=` on the `<script>` tag and push.
7. Test with Razorpay's test mode (card `4111 1111 1111 1111`, any future
   expiry/CVV, or the UPI success flow). When it works, re-run step 4 with
   **live** keys and `wrangler deploy` again — payments then activate for real.

Notes:

- **Prices live in two places.** `PLANS` at the top of `server/worker.js`
  (in paise) must match the four plan cards in `index.html`. Change both.
- The worker answers only to the origins listed in `ALLOWED_ORIGINS` in
  `server/wrangler.toml`. When you move to a custom domain, add it there and
  redeploy.
- Offline tests for the verification logic: `cd server && node test.mjs`.
- If the worker is ever down, the site automatically falls back to the manual
  payment-link flow, so payments never stop.

The other two integrations (`CONTACT_ENDPOINT`, `AUTH_ENDPOINT` in `script.js`)
are still open — leads currently hand off to WhatsApp, and accounts are
browser-local. The worker can be extended to host both later.

### 3. Understand how payments stay gated

> **A membership is only ever activated by a successful response from the
> payments worker** (`PAYMENTS_API`), or the legacy
> `MEMBERSHIP_VERIFY_ENDPOINT`. Both check the payment against the Razorpay
> API server-side.

Clicking *Continue* records a **pending** request with a reference like
`ONYX-M8F2K1-A9C3` — it never grants access by itself. This is deliberate: a
browser cannot prove a payment succeeded, because anything client-side can be
forged with devtools. Only the Razorpay API can confirm a payment, and that
needs the key secret, which must never ship to the client.

The worker activates a membership only when all of these hold:

1. The reference was created for **that member's email** (order record in KV).
2. The Razorpay Checkout **signature** over `orderId|paymentId` matches.
3. Razorpay's Payments API says the payment is **captured** (not just
   authorized) — checked server-side.
4. The captured **amount** equals the plan price.

If the member closes the tab mid-checkout, the site polls the worker on their
next visit, and the worker asks Razorpay about the order directly — so a
completed payment activates even if the browser never saw the success screen.

## Notes

- **Images.** Photography ships as WebP with JPEG fallbacks (`<picture>` in
  markup, `image-set()` in CSS). If you replace a photo, generate both:
  `convert photo.jpg -strip -resize 'x1200>' -quality 78 photo.webp`
- **Cache busting.** Stylesheet and script are linked as `?v=24`. Bump that
  number whenever you edit `styles.css` or `script.js`.
- **Accessibility.** Skip links, focus-visible states, labelled dialogs and a
  `prefers-reduced-motion` block are in place — keep them if you refactor.
- `profile.html` is `noindex` and disallowed in `robots.txt`; it is a private
  member area.
