// =============================================================================
// ONYX — admin-members (shared staff roster)
// =============================================================================
// Shared roster for admin / manager / trainer dashboards.
// Returns auth email + profile fields + latest membership + app_data so the
// frontend can keep one consistent cross-device member view.
// =============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const reply = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

const isStaff = (role: string | null | undefined) => ['admin', 'manager', 'trainer', 'coach'].includes(String(role || '').toLowerCase());

type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string | null;
  created_at: string | null;
  active_plan: string | null;
  membership_expires_at: string | null;
  last_payment_ref: string | null;
  last_payment_id: string | null;
  assigned_coach_email: string | null;
  suspended: boolean | null;
  app_data: Record<string, unknown> | null;
};

type MembershipRow = {
  member_id: string;
  plan: string | null;
  status: string | null;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string | null;
  payment_reference: string | null;
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'GET') return reply({ error: 'GET only' }, 405);

  try {
    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) return reply({ error: 'missing bearer token' }, 401);

    const url = Deno.env.get('SUPABASE_URL') || '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!url || !anonKey || !serviceKey) return reply({ error: 'supabase env missing' }, 500);

    const authed = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const service = createClient(url, serviceKey);

    const { data: authData, error: authError } = await authed.auth.getUser();
    if (authError || !authData.user) return reply({ error: 'invalid session' }, 401);

    const { data: me, error: meError } = await service
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .maybeSingle<{ role: string | null }>();
    if (meError) return reply({ error: 'could not verify role' }, 500);
    if (!isStaff(me?.role)) return reply({ error: 'staff only' }, 403);

    const allUsers: Array<{ id: string; email?: string | null; created_at?: string | null; user_metadata?: Record<string, unknown> | null }> = [];
    for (let page = 1; page <= 20; page += 1) {
      const { data, error } = await service.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) return reply({ error: 'could not list auth users' }, 500);
      const users = data?.users || [];
      allUsers.push(...users.map(user => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        user_metadata: user.user_metadata,
      })));
      if (users.length < 1000) break;
    }

    const { data: profiles, error: profilesError } = await service
      .from('profiles')
      .select('id, full_name, phone, role, created_at, active_plan, membership_expires_at, last_payment_ref, last_payment_id, assigned_coach_email, suspended, app_data')
      .order('created_at', { ascending: false });
    if (profilesError) return reply({ error: 'could not load profiles' }, 500);

    const { data: memberships, error: membershipsError } = await service
      .from('memberships')
      .select('member_id, plan, status, starts_at, ends_at, created_at, payment_reference')
      .order('created_at', { ascending: false });
    if (membershipsError) return reply({ error: 'could not load memberships' }, 500);

    const profileById = new Map<string, ProfileRow>();
    (profiles as ProfileRow[] || []).forEach(profile => profileById.set(profile.id, profile));

    const latestMembershipByMember = new Map<string, MembershipRow>();
    (memberships as MembershipRow[] || []).forEach(membership => {
      if (!latestMembershipByMember.has(membership.member_id)) latestMembershipByMember.set(membership.member_id, membership);
    });

    const members = allUsers.map(user => {
      const profile = profileById.get(user.id);
      const membership = latestMembershipByMember.get(user.id);
      return {
        id: user.id,
        email: user.email || '',
        fullName: profile?.full_name || String(user.user_metadata?.full_name || user.email || 'Member'),
        phone: profile?.phone || null,
        role: profile?.role || 'member',
        createdAt: user.created_at || profile?.created_at || null,
        plan: membership?.plan || profile?.active_plan || null,
        membershipStatus: membership?.status || null,
        membershipStartsAt: membership?.starts_at || null,
        membershipEndsAt: membership?.ends_at || profile?.membership_expires_at || null,
        paymentReference: membership?.payment_reference || profile?.last_payment_ref || null,
        assignedCoachEmail: profile?.assigned_coach_email || null,
        suspended: !!profile?.suspended,
        appData: profile?.app_data || {},
      };
    }).sort((a, b) => {
      const ad = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bd = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (bd !== ad) return bd - ad;
      return String(a.fullName || a.email).localeCompare(String(b.fullName || b.email));
    });

    return reply({ members, generatedAt: new Date().toISOString() });
  } catch (error) {
    return reply({ error: error instanceof Error ? error.message : 'unexpected error' }, 500);
  }
});
