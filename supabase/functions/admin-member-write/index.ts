// =============================================================================
// ONYX — admin-member-write (shared admin mutations)
// =============================================================================
// Cross-device admin actions for Supabase-backed users:
// - create member
// - set role
// - set plan
// - renew membership
// - confirm pending payment
// - delete member
//
// This deliberately avoids the browser using service-role credentials. The
// frontend sends the logged-in admin's JWT; this function verifies that the
// caller is admin/manager via `profiles.role`, then performs the mutation with
// the service role.
// =============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

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

const PLAN_DAYS: Record<string, number> = {
  Monthly: 30,
  '3 months': 90,
  '6 months': 180,
  '12 months': 365,
};

const isManagerRole = (role: string | null | undefined) => ['admin', 'manager'].includes(String(role || '').toLowerCase());
const isAdminRole = (role: string | null | undefined) => String(role || '').toLowerCase() === 'admin';
const validRole = (role: string | null | undefined) => ['member', 'trainer', 'manager', 'admin'].includes(String(role || '').toLowerCase());

const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const addDays = (from: Date, days: number) => {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
};

type AdminUser = {
  id: string;
  email?: string | null;
  created_at?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

type MembershipRow = {
  id: string;
  member_id: string;
  plan: string;
  status: string | null;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string | null;
  payment_reference: string | null;
};

async function listAllAuthUsers(service: ReturnType<typeof createClient>) {
  const out: AdminUser[] = [];
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error('could not list auth users');
    const users = (data?.users || []) as AdminUser[];
    out.push(...users);
    if (users.length < 1000) break;
  }
  return out;
}

async function findAuthUserByEmail(service: ReturnType<typeof createClient>, email: string) {
  const needle = String(email || '').trim().toLowerCase();
  if (!needle) return null;
  const users = await listAllAuthUsers(service);
  return users.find(user => String(user.email || '').toLowerCase() === needle) || null;
}

async function latestMembership(service: ReturnType<typeof createClient>, memberId: string) {
  const { data, error } = await service
    .from('memberships')
    .select('id, member_id, plan, status, starts_at, ends_at, created_at, payment_reference')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<MembershipRow>();
  if (error) throw new Error('could not load membership');
  return data || null;
}

async function setMembership(service: ReturnType<typeof createClient>, memberId: string, plan: string | null, status = 'active', paymentReference: string | null = null, preserveFutureEnd = false) {
  if (!plan) {
    const { error } = await service.from('memberships').delete().eq('member_id', memberId);
    if (error) throw new Error('could not clear membership');
    return null;
  }
  const days = PLAN_DAYS[plan];
  if (!days) throw new Error('unknown plan');
  const existing = await latestMembership(service, memberId);
  const now = new Date();
  const base = preserveFutureEnd && existing?.ends_at && new Date(existing.ends_at) > now ? new Date(existing.ends_at) : now;
  const startsAt = preserveFutureEnd && existing?.starts_at ? existing.starts_at : isoDate(now);
  const endsAt = isoDate(addDays(base, days));
  if (existing) {
    const { error } = await service
      .from('memberships')
      .update({ plan, status, starts_at: startsAt, ends_at: endsAt, payment_reference: paymentReference || existing.payment_reference || null })
      .eq('id', existing.id);
    if (error) throw new Error('could not update membership');
  } else {
    const { error } = await service
      .from('memberships')
      .insert({ member_id: memberId, plan, status, starts_at: startsAt, ends_at: endsAt, payment_reference: paymentReference || null });
    if (error) throw new Error('could not create membership');
  }
  return { plan, status, startsAt, endsAt, paymentReference: paymentReference || existing?.payment_reference || null };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return reply({ ok: false, error: 'POST only' }, 405);

  try {
    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) return reply({ ok: false, error: 'missing bearer token' }, 401);

    const url = Deno.env.get('SUPABASE_URL') || '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!url || !anonKey || !serviceKey) return reply({ ok: false, error: 'supabase env missing' }, 500);

    const authed = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const service = createClient(url, serviceKey);

    const { data: authData, error: authError } = await authed.auth.getUser();
    if (authError || !authData.user) return reply({ ok: false, error: 'invalid session' }, 401);

    const { data: me, error: meError } = await service
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .maybeSingle<{ role: string | null }>();
    if (meError) return reply({ ok: false, error: 'could not verify role' }, 500);
    if (!isManagerRole(me?.role)) return reply({ ok: false, error: 'admin or manager only' }, 403);

    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const action = String(body.action || '').trim();
    const email = String(body.email || '').trim().toLowerCase();

    if (action === 'create_member') {
      const name = String(body.name || '').trim();
      const phoneRaw = String(body.phone || '').replace(/\D/g, '').slice(-10);
      const password = String(body.password || '');
      const plan = body.plan ? String(body.plan) : null;
      if (name.length < 2) return reply({ ok: false, error: 'name too short' }, 400);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply({ ok: false, error: 'invalid email' }, 400);
      if (password.length < 6) return reply({ ok: false, error: 'password must be at least 6 characters' }, 400);
      if (await findAuthUserByEmail(service, email)) return reply({ ok: false, error: 'member already exists' }, 409);
      const { data, error } = await service.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name, phone: phoneRaw || null },
      });
      if (error || !data.user) return reply({ ok: false, error: error?.message || 'could not create auth user' }, 500);
      const { error: profileError } = await service.from('profiles').upsert({
        id: data.user.id,
        full_name: name,
        phone: phoneRaw || null,
        role: 'member',
      });
      if (profileError) return reply({ ok: false, error: 'auth created but profile setup failed' }, 500);
      if (plan) await setMembership(service, data.user.id, plan, 'active');
      return reply({ ok: true, email, created: true });
    }

    if (!email) return reply({ ok: false, error: 'email required' }, 400);
    const target = await findAuthUserByEmail(service, email);
    if (!target) return reply({ ok: false, error: 'member not found' }, 404);

    if (action === 'set_role') {
      const role = String(body.role || '').trim().toLowerCase();
      if (!validRole(role)) return reply({ ok: false, error: 'invalid role' }, 400);
      if (role === 'admin' && !isAdminRole(me?.role)) return reply({ ok: false, error: 'only admin can assign admin role' }, 403);
      const { error } = await service.from('profiles').update({ role }).eq('id', target.id);
      if (error) return reply({ ok: false, error: 'could not update role' }, 500);
      return reply({ ok: true, email, role });
    }

    if (action === 'set_plan') {
      const plan = body.plan ? String(body.plan) : null;
      if (!plan) {
        await setMembership(service, target.id, null, 'active');
        return reply({ ok: true, email, membership: null });
      }
      if (!PLAN_DAYS[plan]) return reply({ ok: false, error: 'unknown plan' }, 400);
      const existing = await latestMembership(service, target.id);
      if (existing) {
        const { error } = await service
          .from('memberships')
          .update({ plan, status: 'active' })
          .eq('id', existing.id);
        if (error) return reply({ ok: false, error: 'could not update membership plan' }, 500);
        return reply({ ok: true, email, membership: {
          plan,
          status: 'active',
          startsAt: existing.starts_at,
          endsAt: existing.ends_at,
          paymentReference: existing.payment_reference,
        } });
      }
      const result = await setMembership(service, target.id, plan, 'active');
      return reply({ ok: true, email, membership: result });
    }

    if (action === 'renew') {
      const months = Math.max(1, parseInt(String(body.months || '1'), 10) || 1);
      const existing = await latestMembership(service, target.id);
      const plan = existing?.plan || null;
      if (!plan || !PLAN_DAYS[plan]) return reply({ ok: false, error: 'member has no renewable plan yet' }, 400);
      const days = months * 30;
      const now = new Date();
      const base = existing?.ends_at && new Date(existing.ends_at) > now ? new Date(existing.ends_at) : now;
      const endsAt = isoDate(addDays(base, days));
      const startsAt = existing?.starts_at || isoDate(now);
      const { error } = await service.from('memberships').update({ status: 'active', starts_at: startsAt, ends_at: endsAt }).eq('id', existing.id);
      if (error) return reply({ ok: false, error: 'could not renew membership' }, 500);
      return reply({ ok: true, email, membership: { plan, startsAt, endsAt, status: 'active' } });
    }

    if (action === 'confirm_payment') {
      const plan = String(body.plan || '').trim();
      const ref = String(body.ref || '').trim() || null;
      const finalPlan = plan || (await latestMembership(service, target.id))?.plan || null;
      if (!finalPlan) return reply({ ok: false, error: 'no plan to activate' }, 400);
      const result = await setMembership(service, target.id, finalPlan, 'active', ref);
      return reply({ ok: true, email, membership: result });
    }

    if (action === 'delete_member') {
      if (target.id === authData.user.id) return reply({ ok: false, error: 'you cannot delete your own account here' }, 400);
      const { data: targetProfile } = await service.from('profiles').select('role').eq('id', target.id).maybeSingle<{ role: string | null }>();
      if (isAdminRole(targetProfile?.role) && !isAdminRole(me?.role)) return reply({ ok: false, error: 'only admin can delete admin accounts' }, 403);
      const { error } = await service.auth.admin.deleteUser(target.id);
      if (error) return reply({ ok: false, error: error.message || 'could not delete member' }, 500);
      return reply({ ok: true, email, deleted: true });
    }

    return reply({ ok: false, error: 'unknown action' }, 400);
  } catch (error) {
    return reply({ ok: false, error: error instanceof Error ? error.message : 'unexpected error' }, 500);
  }
});
