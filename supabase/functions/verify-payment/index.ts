// =============================================================================
// ONYX — verify-payment (Supabase Edge Function)
// =============================================================================
// The browser is never trusted with payments. This function is the single
// gate between Razorpay and membership activation:
//
//   1. Browser POSTs { paymentId, ref, plan, email } after Razorpay redirects
//      back (or when the user taps "Verify payment").
//   2. We ask RAZORPAY for the real payment record (secret key, server-side).
//   3. The payment must be `captured` AND match the plan's exact price.
//   4. If Razorpay collected a payer email, it must match the member.
//   5. Replay guard: one payment_id can activate ONE membership, ever
//      (ledger table `payment_verifications`).
//   6. Only then does the browser activate the plan.
//
// Deploy (Supabase dashboard, ~3 min):
//   Edge Functions → New function → name: verify-payment → paste this file
//   → add secrets RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET (Razorpay dashboard
//     → Settings → API Keys) → Deploy. JWT verification stays ON (default).
//   Then run the `payment_verifications` table SQL (see SUPABASE_SETUP.md).
// =============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

// Canonical plan prices in INR paise. If you change prices, update BOTH the
// Razorpay payment links and this map.
const PRICES_PAISE: Record<string, number> = {
  'Monthly membership': 199900,
  '3 months membership': 549900,
  '6 months membership': 999900,
  '12 months membership': 1799900,
  'Single PT session': 79900,
  '8-session PT pack': 499900,
  '12-session PT pack': 699900,
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const reply = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return reply({ active: false, error: 'POST only' }, 405);

  try {
    const body = (await req.json()) as Record<string, string>;
    const paymentId = String(body.paymentId || '').trim();
    const plan = String(body.plan || '').trim();
    const ref = String(body.ref || '').trim();
    const email = String(body.email || '').trim();
    if (!paymentId || !plan) return reply({ active: false, error: 'missing paymentId or plan' });

    const expectedAmount = PRICES_PAISE[plan];
    if (!expectedAmount) return reply({ active: false, error: 'unknown plan' });

    const keyId = Deno.env.get('RAZORPAY_KEY_ID') || '';
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET') || '';
    if (!keyId || !keySecret) {
      return reply({ active: false, error: 'payment verification not configured yet' }, 503);
    }

    // 1) The real payment record, straight from Razorpay.
    const rzpRes = await fetch(
      `https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`,
      { headers: { Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}` } },
    );
    if (!rzpRes.ok) {
      return reply({ active: false, error: `razorpay lookup failed (${rzpRes.status})` }, 402);
    }
    const payment = (await rzpRes.json()) as {
      status?: string; amount?: number; currency?: string; email?: string;
    };

    // 2) Captured, INR, exact plan price.
    if (payment.status !== 'captured') return reply({ active: false, error: 'payment not captured' });
    if (payment.currency && payment.currency !== 'INR') return reply({ active: false, error: 'unexpected currency' });
    if (payment.amount !== expectedAmount) return reply({ active: false, error: 'amount does not match plan' });

    // 3) Payer email must match the member when Razorpay collected one.
    if (payment.email && email && payment.email.toLowerCase() !== email.toLowerCase()) {
      return reply({ active: false, error: 'payer email does not match member' });
    }

    // 4) Replay guard: a payment can mint exactly one membership.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { error } = await supabase
      .from('payment_verifications')
      .insert({ payment_id: paymentId, email: email || null, ref: ref || null, plan, amount: expectedAmount });
    if (error) {
      // PK violation = already redeemed; anything else = storage problem.
      // Neither may activate a membership.
      return reply({ active: false, error: 'payment already used or ledger unavailable' });
    }

    return reply({ active: true, plan });
  } catch {
    return reply({ active: false, error: 'verification failed' }, 502);
  }
});
