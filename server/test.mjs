// Offline test harness for worker.js — no network, no Cloudflare, no Razorpay
// account needed. Razorpay's REST API and the KV binding are mocked; the
// worker's actual routing, HMAC and verification logic run for real.
//
//   node test.mjs

import { handleRequest } from './worker.js';

const ORIGIN = 'https://monit0123.github.io';
const KEY_ID = 'rzp_test_ONYX';
const SECRET = 'test-secret';

// ---- mocks -----------------------------------------------------------------
const kv = new Map();
const env = {
  PAYMENTS: { get: async k => kv.get(k) ?? null, put: async (k, v) => { kv.set(k, v); } },
  RAZORPAY_KEY_ID: KEY_ID,
  RAZORPAY_KEY_SECRET: SECRET,
  ALLOWED_ORIGINS: ORIGIN
};

const orders = new Map();    // orderId -> Razorpay order object
const payments = new Map();  // paymentId -> Razorpay payment object
let orderSeq = 0;

globalThis.fetch = async (url, init = {}) => {
  const u = new URL(url);
  if (u.hostname !== 'api.razorpay.com') throw new Error('unexpected external fetch: ' + url);
  if ((init.headers?.Authorization || '') !== 'Basic ' + btoa(`${KEY_ID}:${SECRET}`)) {
    return new Response('bad auth', { status: 401 });
  }
  if (u.pathname === '/v1/orders' && init.method === 'POST') {
    const body = JSON.parse(init.body);
    const order = { id: `order_${++orderSeq}`, amount: body.amount, currency: 'INR',
                    receipt: body.receipt, notes: body.notes, status: 'created', payment_id: null };
    orders.set(order.id, order);
    return new Response(JSON.stringify(order), { status: 200 });
  }
  const orderMatch = u.pathname.match(/^\/v1\/orders\/(.+)$/);
  if (orderMatch && orders.has(orderMatch[1])) {
    return new Response(JSON.stringify(orders.get(orderMatch[1])), { status: 200 });
  }
  const payMatch = u.pathname.match(/^\/v1\/payments\/(.+)$/);
  if (payMatch && payments.has(payMatch[1])) {
    return new Response(JSON.stringify(payments.get(payMatch[1])), { status: 200 });
  }
  return new Response('not found', { status: 404 });
};

const sign = async (orderId, paymentId, secret = SECRET) => {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${orderId}|${paymentId}`));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
};

const post = (path, body, origin = ORIGIN) => handleRequest(
  new Request(`https://worker.test${path}`, { method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(origin ? { Origin: origin } : {}) },
    body: JSON.stringify(body) }), env);
const get = (path, origin = ORIGIN) => handleRequest(
  new Request(`https://worker.test${path}`, { headers: origin ? { Origin: origin } : {} }), env);

// ---- tests -----------------------------------------------------------------
let passed = 0, failed = 0;
const check = (name, cond, extra = '') => {
  if (cond) { passed++; console.log(`  ok   ${name}`); }
  else { failed++; console.log(`  FAIL ${name} ${extra}`); }
};

console.log('health + CORS');
{
  const r = await get('/health');
  check('health returns ok', r.status === 200 && (await r.json()).ok === true);
  const pre = await handleRequest(new Request('https://worker.test/order', {
    method: 'OPTIONS', headers: { Origin: ORIGIN, 'Access-Control-Request-Method': 'POST' } }), env);
  check('preflight allows the site origin',
    pre.status === 204 && pre.headers.get('Access-Control-Allow-Origin') === ORIGIN);
  const bad = await post('/order', { plan: 'Monthly', ref: 'ONYX-X-1', email: 'a@b.co' }, 'https://evil.example');
  check('foreign origin is rejected', bad.status === 403);
}

console.log('POST /order');
let order3;
{
  const r = await post('/order', { plan: '3 months', ref: 'ONYX-TEST-REF1', email: 'member@onyx.test' });
  const body = await r.json();
  order3 = body;
  check('creates an order for a valid plan', r.status === 200 && body.order_id === 'order_1');
  check('amount is 549900 paise for the 3-month plan', body.amount === 549900);
  check('returns the public key id, never the secret', body.key_id === KEY_ID);
  check('order record stored in KV', kv.has('order:ONYX-TEST-REF1'));
  const bad = await post('/order', { plan: 'Lifetime', ref: 'ONYX-TEST-REF9', email: 'x@y.zz' });
  check('unknown plan rejected', bad.status === 400);
  const badRef = await post('/order', { plan: 'Monthly', ref: 'DROP TABLE', email: 'x@y.zz' });
  check('malformed reference rejected', badRef.status === 400);
}

console.log('POST /verify — attack cases');
{
  await payments.set('pay_1', { id: 'pay_1', status: 'captured', order_id: order3.order_id, amount: 549900 });
  const forged = await post('/verify', { email: 'member@onyx.test', ref: 'ONYX-TEST-REF1',
    paymentId: 'pay_1', orderId: order3.order_id, signature: 'a'.repeat(64) });
  check('forged signature does not activate', (await forged.json()).active !== true);
  const stranger = await post('/verify', { email: 'attacker@evil.test', ref: 'ONYX-TEST-REF1',
    paymentId: 'pay_1', orderId: order3.order_id, signature: await sign(order3.order_id, 'pay_1') });
  check("someone else's account cannot activate another member's ref", (await stranger.json()).active !== true);
  const wrongOrder = await post('/verify', { email: 'member@onyx.test', ref: 'ONYX-TEST-REF1',
    paymentId: 'pay_1', orderId: 'order_999', signature: await sign('order_999', 'pay_1') });
  check('mismatched order id does not activate', (await wrongOrder.json()).active !== true);
}
{
  // Right signature, but the payment never captured the full amount.
  const r = await post('/order', { plan: 'Monthly', ref: 'ONYX-TEST-REF2', email: 'short@onyx.test' });
  const order = await r.json();
  await payments.set('pay_2', { id: 'pay_2', status: 'captured', order_id: order.order_id, amount: 100 });
  const partial = await post('/verify', { email: 'short@onyx.test', ref: 'ONYX-TEST-REF2',
    paymentId: 'pay_2', orderId: order.order_id, signature: await sign(order.order_id, 'pay_2') });
  check('captured-but-wrong amount does not activate', (await partial.json()).active !== true);
  await payments.set('pay_3', { id: 'pay_3', status: 'authorized', order_id: order.order_id, amount: 199900 });
  const authed = await post('/verify', { email: 'short@onyx.test', ref: 'ONYX-TEST-REF2',
    paymentId: 'pay_3', orderId: order.order_id, signature: await sign(order.order_id, 'pay_3') });
  check('non-captured (authorized) payment does not activate', (await authed.json()).active !== true);
}

console.log('POST /verify — happy path');
{
  const sig = await sign(order3.order_id, 'pay_1');
  const r = await post('/verify', { email: 'member@onyx.test', ref: 'ONYX-TEST-REF1',
    paymentId: 'pay_1', orderId: order3.order_id, signature: sig });
  const body = await r.json();
  check('valid captured payment activates', body.active === true);
  check('plan label matches site format', body.plan === '3 months membership');
  check('expiry is ~3 months out',
    new Date(body.expiresAt) > new Date(Date.now() + 89 * 864e5) &&
    new Date(body.expiresAt) < new Date(Date.now() + 93 * 864e5));
  check('receipt stored in KV', kv.has('paid:ONYX-TEST-REF1'));
  const replay = await post('/verify', { email: 'member@onyx.test', ref: 'ONYX-TEST-REF1',
    paymentId: 'pay_1', orderId: order3.order_id, signature: sig });
  check('re-verify (idempotent) still returns active', (await replay.json()).active === true);
}

console.log('GET /status — closed-tab recovery');
{
  const r = await post('/order', { plan: '12 months', ref: 'ONYX-TEST-REF3', email: 'closer@onyx.test' });
  const order = await r.json();
  const unpaid = await get(`/status?ref=ONYX-TEST-REF3&email=closer@onyx.test`);
  check('unpaid order reports inactive', (await unpaid.json()).active === false);
  // User paid but closed the tab: Razorpay knows, KV does not yet.
  orders.get(order.order_id).status = 'paid';
  orders.get(order.order_id).payment_id = 'pay_9';
  await payments.set('pay_9', { id: 'pay_9', status: 'captured', order_id: order.order_id, amount: 1799900 });
  const paid = await get(`/status?ref=ONYX-TEST-REF3&email=closer@onyx.test`);
  const body = await paid.json();
  check('order marked paid activates via status poll', body.active === true && body.plan === '12 months membership');
  const wrongEmail = await get(`/status?ref=ONYX-TEST-REF3&email=other@onyx.test`);
  check('status poll leaks nothing to a different account', (await wrongEmail.json()).active === false);
  const nosy = await get(`/status?ref=ONYX-TEST-REF1&email=attacker@evil.test`);
  check('cannot probe a paid ref from a foreign account', (await nosy.json()).active !== true);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
