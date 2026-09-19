# Supabase setup for the ONYX demo

1. Open the Supabase project dashboard.
2. Open **SQL Editor**.
3. Create a new query.
4. Paste all of `supabase-schema.sql`.
5. Click **Run**.
6. Go to **Authentication → Providers → Email** and enable Email provider.
7. For a demo, you may disable email confirmation. For real use, keep confirmation enabled and configure SMTP.
8. Create one account through the ONYX sign-up screen.
9. In SQL Editor, replace `owner@example.com` in the commented admin query, uncomment it, and run it. This makes that account the demo admin.
10. Reply with “schema complete” so the frontend can be connected to the tables.

## Optional storage bucket

For the member progress-photo demo:

- Storage → New bucket
- Name: `progress-photos`
- Keep it **private**
- Do not make it public

The storage policies and signed-upload flow should be added only after the account flow is connected, so private photos are never exposed by a public URL.

## What the current schema supports

- Public lead capture
- Public free-trial booking requests
- Member profiles
- Member memberships
- Admin/manager/coach roles
- Staff-only lead access
- Member-only booking access
- Audit events

The publishable Supabase key belongs in browser code. Never put the Supabase service-role key in this repository or frontend.

## Shared admin member list across devices (admin-members edge function)

The admin login already comes from Supabase, but the old demo member list only
lived in each browser's localStorage. To make **phone and laptop show the same
users**, deploy the shared roster function once:

1. **Edge Functions** → **New function**
2. Name: `admin-members`
3. Body: paste `supabase/functions/admin-members/index.ts`
4. **Deploy** with **Verify JWT ON**

No extra secrets are needed. The frontend calls it automatically when a
staff user is signed in with a real Supabase session.

Before deploying the new shared edit flow, **re-run `supabase-schema.sql`** in
SQL Editor once so the added `profiles` columns and shared tables exist
(`app_data`, `assigned_coach_email`, `suspended`, payment/meta fields,
`inventory_items`, `staff_directory`, `site_content`, lead extensions). The
file is idempotent.

To make admin edits shared too, deploy one more function:

1. **Edge Functions** → **New function**
2. Name: `admin-member-write`
3. Body: paste `supabase/functions/admin-member-write/index.ts`
4. **Deploy** with **Verify JWT ON**

That enables shared create member, set role, set plan, renew, confirm payment,
and delete actions. If it is not deployed, those actions still work only on the
old browser-local demo data.

If the function is not deployed yet, the admin dashboard falls back to the old
browser-local demo list and different devices may still show different users.

## Payment auto-confirmation (verify-payment edge function)

The site no longer activates memberships from the browser. The moment Razorpay
redirects back with `status=paid`, the page calls the `verify-payment` function,
which checks the payment **against Razorpay's own API** and activates only on a
real, captured, correctly-priced payment. One payment can activate one
membership, ever (replay ledger below).

Deploy once (~3 min, all in the Supabase dashboard — no terminal):

1. **SQL Editor** → new query → run just the `payment_verifications` block at
   the bottom of `supabase-schema.sql` (or re-run the whole file; it's
   idempotent).

   If it errors with `syntax error at or near "security"`: clear the query
   box completely (select all → delete) and re-run — a hidden character from
   copy-paste is almost always the cause. Worst case: type the
   `alter table ... enable row security;` line by hand.
2. **Edge Functions** → **New function**:
   - Name: `verify-payment`
   - Body: paste the contents of `supabase/functions/verify-payment/index.ts`
3. **Secrets** for `verify-payment` (Razorpay dashboard → Settings → API Keys):
   - `RAZORPAY_KEY_ID` → your key ID (`rzp_live_…` or `rzp_test_…`)
   - `RAZORPAY_KEY_SECRET` → your **secret** key (never goes into this repo)
4. **Deploy.** Leave **Verify JWT** ON (the site already sends the anon key).

That's it — the site is already pointed at
`https://xetcagevubbvxjxinvcf.supabase.co/functions/v1/verify-payment`.

### How it behaves after deploy

- Customer pays → Razorpay returns → page calls the function →
  membership activates automatically, success screen shows. **No fuss.**
- Returned `status=abandoned` or a failed verification → the payment stays
  **pending** with a clear "front desk will confirm" screen + WhatsApp nudge.
  Nothing self-activates.
- Until the function is deployed, behaviour is the safe pending state described
  above (verification endpoint 404s → stays pending). No data can be
  corrupted; it just waits for the one-time deploy.

### If you change plan prices

Update BOTH the Razorpay payment links **and** the `PRICES_PAISE` map at the
top of `supabase/functions/verify-payment/index.ts`, then redeploy the
function. A payment that doesn't match the map's price is rejected.
