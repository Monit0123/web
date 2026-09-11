// ONYX Athletic Club — payments worker.
//
// Automates membership activation for the static site: it creates Razorpay
// orders, verifies checkout payments against the Razorpay API, and tells the
// browser when a membership is live. Deploy instructions live in the repo
// README ("Deploy the payments worker").
//
// Routes:
//   POST /order   {plan, ref, email}        -> {key_id, order_id, amount, ...}
//   POST /verify  {email, ref, paymentId,   -> {active: true, plan, expiresAt}
//                 orderId, signature}          only when Razorpay confirms
//   GET  /status?ref=&email=                -> {active, plan, expiresAt}
//   GET  /health                            -> {ok: true}
//
// Secrets (wrangler secret put …): RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET.
// KV binding: PAYMENTS. Env var: ALLOWED_ORIGINS (comma-separated site
// origins allowed to call the API).

// Plan catalogue. Amounts are in paise and MUST match the prices shown in
// index.html — if you change a price on the site, change it here too and
// redeploy (`wrangler deploy`).
const PLANS = {
  'Monthly':  { amount: 199900,  months: 1  },
  '3 months': { amount: 549900,  months: 3  },
  '6 months': { amount: 999900,  months: 6  },
  '12 months': { amount: 1799900, months: 12 }
};

const REF_RE   = /^ONYX-[A-Z0-9]+(-[A-Z0-9]+)*$/;   // e.g. ONYX-M8F2K1-A9C3
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const planLabel = plan => `${plan} membership`;

const json = (data, status = 200, origin) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    ...(origin ? { 'Access-Control-Allow-Origin': origin } : {})
  }
});

const originAllowed = (request, env) => {
  const origin = request.headers.get('Origin');
  if (!origin) return { ok: true, origin: null };          // non-browser client
  const list = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  return { ok: list.includes(origin), origin };
};

// Signed call into the Razorpay REST API. The key secret never leaves the
// worker — this is the whole reason activation cannot be forged client-side.
const rzp = (env, path, init = {}) => fetch(`https://api.razorpay.com/v1${path}`, {
  ...init,
  headers: {
    Authorization: 'Basic ' + btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`),
    'Content-Type': 'application/json',
    ...(init.headers || {})
  }
});

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}

const addMonths = (months) => {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
};

const kvGet = async (env, key) => JSON.parse((await env.PAYMENTS.get(key)) || 'null');

async function markPaid(env, record, paymentId) {
  const receipt = {
    ref: record.ref, plan: record.plan, email: record.email,
    paymentId, amount: record.amount,
    paidAt: new Date().toISOString(),
    expiresAt: addMonths(record.months)
  };
  await env.PAYMENTS.put(`paid:${record.ref}`, JSON.stringify(receipt));
  return receipt;
}

export async function handleRequest(request, env) {
  const url = new URL(request.url);
  const { ok: corsOk, origin } = originAllowed(request, env);

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400'
      }
    });
  }
  if (!corsOk) return json({ error: 'origin not allowed' }, 403);

  if (url.pathname === '/health') return json({ ok: true }, 200, origin);

  // ---- create an order ----------------------------------------------------
  if (url.pathname === '/order' && request.method === 'POST') {
    const body = await request.json().catch(() => null);
    if (!body || !PLANS[body.plan] || !REF_RE.test(body.ref || '') || !EMAIL_RE.test(body.email || '')) {
      return json({ error: 'invalid order request' }, 400, origin);
    }
    const plan = PLANS[body.plan];
    const response = await rzp(env, '/orders', {
      method: 'POST',
      body: JSON.stringify({
        amount: plan.amount, currency: 'INR', receipt: body.ref,
        notes: { email: body.email, plan: body.plan, ref: body.ref }
      })
    });
    if (!response.ok) return json({ error: 'could not create order' }, 502, origin);
    const order = await response.json();
    await env.PAYMENTS.put(`order:${body.ref}`, JSON.stringify({
      ref: body.ref, orderId: order.id, plan: body.plan, email: body.email,
      amount: plan.amount, months: plan.months, createdAt: new Date().toISOString()
    }));
    return json({
      key_id: env.RAZORPAY_KEY_ID, order_id: order.id,
      amount: plan.amount, currency: 'INR', plan: body.plan, ref: body.ref
    }, 200, origin);
  }

  // ---- verify a checkout payment ------------------------------------------
  // Activates only when ALL of these hold:
  //   1. the ref was created for this account's email (order record in KV),
  //   2. the Razorpay signature over `orderId|paymentId` matches (Checkout HMAC),
  //   3. Razorpay's Payments API says the payment is captured,
  //   4. the captured amount equals the plan price.
  if (url.pathname === '/verify' && request.method === 'POST') {
    const body = await request.json().catch(() => null);
    if (!body || !REF_RE.test(body.ref || '') || !EMAIL_RE.test(body.email || '')) {
      return json({ error: 'invalid verify request' }, 400, origin);
    }
    const alreadyPaid = await kvGet(env, `paid:${body.ref}`);
    if (alreadyPaid && alreadyPaid.email === body.email) {
      return json({ active: true, plan: planLabel(alreadyPaid.plan), expiresAt: alreadyPaid.expiresAt }, 200, origin);
    }
    const record = await kvGet(env, `order:${body.ref}`);
    if (!record || record.email !== body.email) return json({ active: false }, 200, origin);
    if (!body.paymentId || !body.orderId || !body.signature) return json({ active: false }, 200, origin);
    if (body.orderId !== record.orderId) return json({ active: false }, 200, origin);

    const expected = await hmacHex(env.RAZORPAY_KEY_SECRET, `${body.orderId}|${body.paymentId}`);
    if (expected !== body.signature) return json({ active: false }, 200, origin);

    const response = await rzp(env, `/payments/${encodeURIComponent(body.paymentId)}`);
    if (!response.ok) return json({ active: false }, 200, origin);
    const payment = await response.json();
    if (payment.status !== 'captured' || payment.order_id !== record.orderId || payment.amount !== record.amount) {
      return json({ active: false }, 200, origin);
    }
    const receipt = await markPaid(env, record, body.paymentId);
    return json({ active: true, plan: planLabel(record.plan), expiresAt: receipt.expiresAt }, 200, origin);
  }

  // ---- poll status (recovers payments whose tab closed mid-checkout) ------
  if (url.pathname === '/status' && request.method === 'GET') {
    const ref = url.searchParams.get('ref') || '';
    const email = url.searchParams.get('email') || '';
    if (!REF_RE.test(ref) || !EMAIL_RE.test(email)) return json({ active: false }, 400, origin);

    const paid = await kvGet(env, `paid:${ref}`);
    if (paid && paid.email === email) {
      return json({ active: true, plan: planLabel(paid.plan), expiresAt: paid.expiresAt }, 200, origin);
    }
    const record = await kvGet(env, `order:${ref}`);
    if (!record || record.email !== email) return json({ active: false }, 200, origin);

    // Nothing verified yet — ask Razorpay about the order itself. This is what
    // makes the flow automatic even when the browser never called /verify
    // (user closed the tab right after paying).
    const response = await rzp(env, `/orders/${encodeURIComponent(record.orderId)}`);
    if (!response.ok) return json({ active: false }, 200, origin);
    const order = await response.json();
    if (order.status !== 'paid' || !order.payment_id) return json({ active: false }, 200, origin);

    const paymentResponse = await rzp(env, `/payments/${encodeURIComponent(order.payment_id)}`);
    if (!paymentResponse.ok) return json({ active: false }, 200, origin);
    const payment = await paymentResponse.json();
    if (payment.status !== 'captured' || payment.order_id !== record.orderId || payment.amount !== record.amount) {
      return json({ active: false }, 200, origin);
    }
    const receipt = await markPaid(env, record, payment.id);
    return json({ active: true, plan: planLabel(record.plan), expiresAt: receipt.expiresAt }, 200, origin);
  }

  return json({ error: 'not found' }, 404, origin);
}

export default {
  fetch: (request, env) => handleRequest(request, env)
};
