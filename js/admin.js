/* ONYX — js/admin.js
   Admin dashboard modules (CRM leads, members roster UI, reminders,
   inventory, staff/RBAC, reports, site editor).
   Loaded ONLY on admin.html, after script.js (and needs nothing from
   js/dashboard.js). */

const PLAN_DAYS = { 'Monthly': 30, '3 months': 90, '6 months': 180, '12 months': 365 };
/* Plan names exist in two shapes: the admin selectors write the short key
   ('3 months') while the payment flow stores the full Razorpay plan name
   ('3 months membership' — see beginPaymentFlow / verify-payment). Every price
   and duration lookup goes through these helpers so both shapes resolve; a
   raw PLAN_PRICES[m.plan] lookup silently returned 0 / 30 days for members who
   paid online. */
const planKey = plan => String(plan || '').trim().replace(/\s*membership$/i, '').trim();
const planPrice = plan => PLAN_PRICES[planKey(plan)] || 0;
const planDays = plan => PLAN_DAYS[planKey(plan)] || 30;
const LEADS_KEY = 'onyx-leads';
let adminLeadsState = { loading: false, loaded: false, error: '', leads: [] };
const normLead = l => ({
  id: l.id || ('l' + Math.random().toString(36).slice(2, 9)),
  name: l.name || 'Unknown', phone: l.phone || '',
  source: /^\//.test(l.source || '') ? 'Website' : (l.source || 'Website'),
  plan: l.plan || 'General',
  status: ['lead', 'contacted', 'trial', 'joined', 'new'].includes(l.status) ? (l.status === 'new' ? 'lead' : l.status) : 'lead',
  followUp: l.followUp || l.follow_up || '', notes: l.notes || '', at: l.at || l.created_at || new Date().toISOString(),
  _remote: !!l._remote
});
const readLeads = () => {
  try { return (JSON.parse(localStorage.getItem(LEADS_KEY) || '[]') || []).map(normLead); }
  catch (err) { return []; }
};
const writeLeads = l => localStorage.setItem(LEADS_KEY, JSON.stringify(l));
const remoteLead = row => normLead({
  id: row.id,
  name: row.name,
  phone: row.phone,
  source: row.source,
  plan: row.plan,
  status: row.status,
  follow_up: row.follow_up,
  notes: row.notes,
  created_at: row.created_at,
  _remote: true
});
const adminLeadsNotice = () => {
  if (adminLeadsState.loading) return '<p class="coach-demo-note">Syncing shared leads from Supabase…</p>';
  if (adminLeadsState.error) return `<p class="coach-demo-note">Shared lead sync unavailable (${esc(adminLeadsState.error)}). Falling back to this browser's local leads. <button type="button" class="auth-text-btn" id="adm-retry-leads">Retry sync</button></p>`;
  if (adminLeadsState.loaded) return '<p class="coach-demo-note">Showing shared Supabase leads across devices.</p>';
  return '';
};
const adminLeadRoster = () => adminLeadsState.loaded && !adminLeadsState.error ? adminLeadsState.leads : readLeads();
const loadAdminLeads = async (force = false) => {
  const user = currentUser();
  if (!(ONYX.SUPABASE_URL && ONYX.SUPABASE_KEY && user && user.supabaseToken && canAccessAdmin(user))) return adminLeadRoster();
  if (!force && adminLeadsState.loading) return adminLeadsState.leads;
  if (!force && adminLeadsState.loaded) return adminLeadsState.leads;
  adminLeadsState = { ...adminLeadsState, loading: true, error: '' };
  try {
    const token = (await ensureSupabaseToken(user)) || user.supabaseToken;
    const response = await fetch(`${ONYX.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/leads?select=id,name,phone,source,plan,status,follow_up,notes,created_at&order=created_at.desc`, {
      headers: { ...supabaseHeaders(token), Accept: 'application/json' }
    });
    const payload = await response.json().catch(() => []);
    if (!response.ok) throw new Error(payload && payload.message ? payload.message : `HTTP ${response.status}`);
    adminLeadsState = { loading: false, loaded: true, error: '', leads: (payload || []).map(remoteLead) };
  } catch (error) {
    adminLeadsState = { ...adminLeadsState, loading: false, loaded: true, error: error && error.message ? error.message : 'sync failed' };
  }
  if (document.body.classList.contains('admin-page')) renderAdmin();
  return adminLeadsState.leads;
};
const writeLeadRemote = async (method, pathSuffix = '', body = null) => {
  const user = currentUser();
  if (!(ONYX.SUPABASE_URL && ONYX.SUPABASE_KEY && user && user.supabaseToken)) throw new Error('shared lead sync is not configured');
  const token = (await ensureSupabaseToken(user)) || user.supabaseToken;
  const response = await fetch(`${ONYX.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/leads${pathSuffix}`, {
    method,
    headers: {
      ...supabaseHeaders(token),
      Prefer: method === 'POST' ? 'return=representation' : 'return=minimal',
      Accept: 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const payload = await response.json().catch(() => ([]));
  if (!response.ok) throw new Error(payload && payload.message ? payload.message : `HTTP ${response.status}`);
  await loadAdminLeads(true);
  return payload;
};
const memberActive = m => !!m.plan && (!m.expiresAt || String(m.expiresAt).slice(0, 10) >= dayKey());
const daysLeft = m => {
  if (!m.plan || !m.expiresAt) return null;
  return Math.ceil((new Date(m.expiresAt) - Date.now()) / 86400000);
};
const waNum = phone => String(phone || '').replace(/\D/g, '').slice(-10);
const waLink = (phone, text) => {
  const n = waNum(phone);
  return n.length === 10 ? `https://wa.me/91${n}?text=${encodeURIComponent(text)}` : null;
};
const adminMemberWriteEndpoint = () => ONYX.SUPABASE_URL
  ? `${ONYX.SUPABASE_URL.replace(/\/$/, '')}/functions/v1/admin-member-write`
  : '';
let adminTab = 'members';
let adminMember = null;

const localAdminMember = raw => {
  if (!raw || !raw.email) return null;
  return {
    ...raw,
    id: raw.supabaseId || raw.email,
    name: raw.name || raw.email,
    phone: raw.phone || '',
    role: raw.supabaseRole || raw.role || roleOf(raw),
    supabaseRole: raw.supabaseRole || raw.role || roleOf(raw),
    createdAt: raw.createdAt || null,
    _adminSource: 'local'
  };
};

const adminSharedReady = () => adminSupabaseState.loaded && !adminSupabaseState.error;
const adminHasSharedMembers = () => adminSharedReady() && adminSupabaseState.members.length > 0;
const adminMembersNotice = () => {
  if (adminSupabaseState.loading) return '<p class="coach-demo-note">Syncing shared members from Supabase…</p>';
  if (adminSupabaseState.error) {
    const isNetwork = /failed to fetch|network|load failed/i.test(adminSupabaseState.error);
    const hint = isNetwork
      ? ' Check that the Supabase project is active (not paused) and the admin-members edge function is deployed — see SUPABASE_SETUP.md. Sessions now refresh automatically, so a stale login no longer breaks sync.'
      : '';
    return `<p class="coach-demo-note">Shared Supabase member sync is unavailable (${esc(adminSupabaseState.error)}). Falling back to this browser's demo data.${hint} <button type="button" class="auth-text-btn" id="adm-retry-sync">Retry sync</button></p>`;
  }
  if (adminHasSharedMembers()) return '<p class="coach-demo-note">Showing shared Supabase users across devices. Create member, role, plan, renew, confirm payment, and delete now sync through Supabase. Browser-only demo accounts created without shared sync still stay on that device.</p>';
  if (adminSupabaseState.loaded) return '<p class="coach-demo-note">Connected to Supabase. Your first member created from this screen will be shared across devices.</p>';
  return '';
};

const adminRoster = () => {
  const map = new Map();
  (adminSupabaseState.members || []).forEach(member => {
    if (member && member.email) map.set(member.email, { ...member });
  });
  Object.values(readUsers()).forEach(raw => {
    const local = localAdminMember(raw);
    if (!local) return;
    const existing = map.get(local.email);
    if (!existing) { map.set(local.email, local); return; }
    map.set(local.email, {
      ...local,
      ...existing,
      plan: existing.plan || local.plan || null,
      expiresAt: existing.expiresAt || local.expiresAt || null,
      activatedAt: existing.activatedAt || local.activatedAt || null,
      membershipStatus: existing.membershipStatus || (local.pendingPayment ? 'pending' : local.plan ? 'active' : 'none'),
      pendingPayment: existing.membershipStatus === 'pending'
        ? (existing.pendingPayment || local.pendingPayment || null)
        : null,
      assignedCoach: local.assignedCoach || null,
      visits: local.visits || [],
      checkins: local.checkins || [],
      goals: local.goals || [],
      sessions: local.sessions || [],
      _adminSource: 'hybrid'
    });
  });
  return [...map.values()].sort((a, b) => {
    const ad = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bd = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (bd !== ad) return bd - ad;
    return String(a.name || a.email).localeCompare(String(b.name || b.email));
  });
};

// Single lookup used by the member panel and the [data-act] handlers: finds the
// merged roster record (Supabase / hybrid / browser-only) for one email.
const adminMemberRecord = email => {
  if (!email) return null;
  const key = String(email).trim().toLowerCase();
  if (!key) return null;
  return adminRoster().find(member => String(member.email || '').trim().toLowerCase() === key) || null;
};


const updateLocalAdminShadow = (email, patcher) => {
  const users = readUsers();
  if (!users[email]) return;
  const next = patcher == null
    ? null
    : typeof patcher === 'function'
      ? patcher({ ...users[email] })
      : { ...users[email], ...patcher };
  if (!next) { delete users[email]; }
  else users[email] = next;
  writeUsers(users);
};

const remoteAdminMemberWrite = async (action, payload = {}) => {
  const user = currentUser();
  const endpoint = adminMemberWriteEndpoint();
  if (!user || !user.supabaseToken || !endpoint) throw new Error('shared admin write is not configured');
  let token = await ensureSupabaseToken(user);
  if (!token) token = user.supabaseToken;
  const send = async tok => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: ONYX.SUPABASE_KEY,
        Authorization: `Bearer ${tok}`
      },
      body: JSON.stringify({ action, ...payload })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
      const err = new Error(data.error || data.message || `HTTP ${response.status}`);
      err.status = response.status;
      throw err;
    }
    return data;
  };
  let data;
  try {
    data = await send(token);
  } catch (firstError) {
    const retriable = firstError.status === 401 || firstError.name === 'TypeError';
    const renewed = retriable && user.supabaseRefreshToken ? await refreshSupabaseSession(currentUser() || user) : null;
    if (!retriable || renewed === null) throw firstError;
    token = renewed;
    data = await send(token);
  }
  await loadAdminSupabaseMembers(true);
  return data;
};

const shouldUseRemoteAdminWrite = member => !!(member && (member._adminSource === 'supabase' || member._adminSource === 'hybrid') && adminSharedReady());

const renderAdmin = () => {
  if (!document.body.classList.contains('admin-page')) return;
  const gate = document.getElementById('admin-gate');
  const dash = document.getElementById('admin-dash');
  const main = document.getElementById('admin-main');
  const user = currentUser();
  if (!user || !canAccessAdmin(user)) {
    gate.hidden = false; dash.hidden = true; main.hidden = true;
    const box = document.getElementById('admin-gate-body');
    if (!user) {
      box.innerHTML = '<p class="about-hero-desc">Log in with your owner or manager account to open the control center.</p><button type="button" class="program-get-started" id="admin-login"><span>Log in</span></button>';
      document.getElementById('admin-login').addEventListener('click', () => openAuth('Log in with your admin account.'));
    } else {
      const r = roleOf(user);
      if (r === 'member') {
        box.innerHTML = `<p class="about-hero-desc">Signed in as ${esc(user.email)} — this is a member account, so the control center is not available. <a href="profile.html">Go to your member dashboard</a>.</p><button type="button" class="plan-ghost" id="admin-logout-gate">Log out</button>`;
      } else if (r === 'trainer') {
        box.innerHTML = `<p class="about-hero-desc">Signed in as ${esc(user.email)} — trainer account. Trainers use <a href="trainers.html">Coach Dashboard</a>. Admin access requires manager/admin role.</p><button type="button" class="plan-ghost" id="admin-logout-gate">Log out</button>`;
      } else {
        box.innerHTML = `<p class="about-hero-desc">Signed in as ${esc(user.email)} — role ${esc(r)}. The control center needs an owner or manager account.</p>`;
      }
      const logoutGate = document.getElementById('admin-logout-gate');
      if (logoutGate) logoutGate.addEventListener('click', () => {
        localStorage.removeItem(SESSION_KEY);
        adminSupabaseState = { token: '', loading: false, loaded: false, error: '', members: [] };
        updateAuthLinks();
        renderAdmin();
      });
    }
    return;
  }
  if (user.supabaseToken && adminMembersEndpoint() && (!adminSupabaseState.loaded || adminSupabaseState.token !== user.supabaseToken) && !adminSupabaseState.loading) {
    loadAdminSupabaseMembers();
  }
  if (user.supabaseToken && adminTab === 'leads' && !adminLeadsState.loading && !adminLeadsState.loaded) {
    loadAdminLeads();
  }
  if (user.supabaseToken && adminTab === 'inv' && !adminInvState.loading && !adminInvState.loaded) {
    loadAdminInventory();
  }
  if (user.supabaseToken && adminTab === 'staff' && !adminStaffState.loading && !adminStaffState.loaded) {
    loadAdminStaff();
  }
  if (adminTab === 'site' && !siteSharedState.loading && !siteSharedState.loaded) {
    loadRemoteSiteContent();
  }
  gate.hidden = true; dash.hidden = false; main.hidden = false;
  document.getElementById('admin-title').innerHTML = `Namaste,<br /><em>${esc(user.name.split(' ')[0])}.</em>`;
  const roleLabel = roleOf(user).toUpperCase();
  const syncLabel = adminSharedReady() ? ' · SUPABASE SYNCED' : adminSupabaseState.loading ? ' · SYNCING…' : adminSupabaseState.error ? ' · LOCAL FALLBACK' : '';
  document.getElementById('admin-sub').textContent = `${user.email} · ${roleLabel} · ${dayKey()}${syncLabel}`;
  const members = adminRoster().filter(member => roleOf(member) === 'member');
  const today = dayKey();
  const active = members.filter(memberActive);
  const revenue = active.reduce((a, m) => a + planPrice(m.plan), 0);
  const pending = members.filter(m => m.pendingPayment).reduce((a, m) => a + planPrice((m.pendingPayment || {}).plan), 0);
  const new30 = members.filter(m => m.createdAt && (Date.now() - new Date(m.createdAt)) / 86400000 <= 30).length;
  const expiring = members.filter(m => { const d = daysLeft(m); return d !== null && d >= 0 && d <= 7; }).length;
  const todayAtt = members.reduce((a, m) => a + ((m.visits || []).filter(v => String(v.at || '').slice(0, 10) === today).length), 0);
  document.getElementById('admin-stats').innerHTML = [
    [inr(revenue), 'REVENUE · ACTIVE PLANS'], [inr(pending), 'PENDING PAYMENTS'],
    [active.length, 'ACTIVE MEMBERS'], [new30, 'NEW · 30 DAYS'],
    [expiring, 'EXPIRING ≤ 7 DAYS'], [todayAtt, "TODAY'S CHECK-INS"]
  ].map(([v, l]) => `<div><strong>${v}</strong><span>${l}</span></div>`).join('');
  document.querySelectorAll('#adm-tabs button').forEach(b => b.classList.toggle('is-on', b.dataset.atab === adminTab));
  const mgr = !isAdminStrict(user); // manager sees limited tabs
  const leadsTab = document.querySelector('[data-atab="leads"]');
  const staffTab = document.querySelector('[data-atab="staff"]');
  const siteTab = document.querySelector('[data-atab="site"]');
  if (leadsTab) leadsTab.style.display = mgr ? 'none' : '';
  if (staffTab) staffTab.style.display = mgr ? 'none' : '';
  if (siteTab) siteTab.style.display = mgr ? 'none' : '';
  if (mgr && (adminTab === 'leads' || adminTab === 'staff' || adminTab === 'site')) adminTab = 'members';
  document.getElementById('adm-members').hidden = adminTab !== 'members';
  document.getElementById('adm-leads').hidden = adminTab !== 'leads';
  document.getElementById('adm-reminders').hidden = adminTab !== 'reminders';
  document.getElementById('adm-inv').hidden = adminTab !== 'inv';
  document.getElementById('adm-staff').hidden = adminTab !== 'staff';
  document.getElementById('adm-reports').hidden = adminTab !== 'reports';
  document.getElementById('adm-site').hidden = adminTab !== 'site';
  const addToggle = document.getElementById('mm-add-toggle');
  if (addToggle) addToggle.title = adminSharedReady()
    ? 'When Supabase sync is active this form creates shared members across devices.'
    : '';
  if (adminTab === 'members') renderAdminMembers();
  if (adminTab === 'leads') renderAdminLeads();
  if (adminTab === 'reminders') renderAdminReminders();
  if (adminTab === 'inv') renderAdminInv();
  if (adminTab === 'staff') renderAdminStaff();
  if (adminTab === 'reports') renderAdminReports();
  if (adminTab === 'site') renderAdminSite();
};
const refreshAdmin = () => renderAdmin();

const renderAdminMembers = () => {
  const q = (document.getElementById('mm-search').value || '').toLowerCase();
  const pf = document.getElementById('mm-plan').value;
  let members = adminRoster();
  if (q) members = members.filter(m => `${m.name} ${m.email} ${m.phone || ''}`.toLowerCase().includes(q));
  if (pf === 'none') members = members.filter(m => !m.plan);
  else if (pf === 'exp') members = members.filter(m => { const d = daysLeft(m); return d !== null && d >= 0 && d <= 7; });
  else if (pf) members = members.filter(m => m.plan === pf);
  const note = adminMembersNotice();
  document.getElementById('mm-list').innerHTML = note + (members.length ? members.map(m => {
    const d = daysLeft(m);
    const st = m.suspended ? '⛔ SUSPENDED' : memberActive(m) ? `ACTIVE${d !== null ? ` · ${d}D LEFT` : ''}` : m.plan ? (m.membershipStatus === 'pending' ? 'PENDING' : 'EXPIRED') : (m.pendingPayment ? 'PENDING PAYMENT' : 'NO PLAN');
    const r = roleOf(m);
    const source = m._adminSource === 'supabase' ? 'SUPABASE' : m._adminSource === 'hybrid' ? 'SUPABASE + LOCAL' : 'BROWSER ONLY';
    return `<button type="button" class="adm-row${adminMember === m.email ? ' is-on' : ''}" data-mm="${esc(m.email)}"><strong>${esc(m.name)}${m.suspended ? ' ⛔' : ''} · ${esc(r.toUpperCase())}</strong><span>${esc(m.phone || 'no phone')} · ${esc(m.plan || 'no plan')} · ${d !== null ? esc(fmtDate(m.expiresAt)) : '—'} · ${esc(st)} · ${esc(m.email)} · ${source}</span></button>`;
  }).join('') : '<p class="log-empty">No members match.</p>');
  const retrySync = document.getElementById('adm-retry-sync');
  if (retrySync) retrySync.addEventListener('click', () => loadAdminSupabaseMembers(true));
  renderMemberPanel();
};

const renderMemberPanel = () => {
  const box = document.getElementById('mm-panel');
  const m = adminMember ? adminMemberRecord(adminMember) : null;
  if (!m) { box.innerHTML = adminMember ? '' : '<p class="log-empty">Select a member to manage.</p>'; return; }
  const users = readUsers();
  const coachName = m.assignedCoach && users[m.assignedCoach] ? users[m.assignedCoach].name : '—';
  const visits = m.visits || [];
  const last = visits.length ? fmtDate(visits[visits.length - 1].at) : 'Never';
  const pend = m.pendingPayment;
  const currentRole = roleOf(m);
  const shared = m._adminSource === 'supabase' || m._adminSource === 'hybrid';
  if (shared) {
    const pendingShared = m.membershipStatus === 'pending' && m.plan;
    box.innerHTML = `<div class="adm-panel"><h3>${esc(m.name)} · ${esc(currentRole.toUpperCase())}</h3>` +
      `<p class="csub">${esc(m.email).toUpperCase()} · ${esc((m.phone || 'NO PHONE').toUpperCase())} · SOURCE: ${esc(m._adminSource === 'hybrid' ? 'SUPABASE + LOCAL CACHE' : 'SUPABASE SHARED')}</p>` +
      `<p class="csub">PLAN: ${esc((m.plan || '—').toUpperCase())} · STATUS: ${esc(String((m.membershipStatus || (memberActive(m) ? 'active' : 'none')).toUpperCase()))} · EXPIRES: ${m.expiresAt ? esc(fmtDate(m.expiresAt)) : '—'} · CREATED: ${m.createdAt ? esc(fmtDate(m.createdAt)) : '—'}</p>` +
      `<p class="coach-demo-note">This member is synced from Supabase and these edits now write back cross-device.</p>` +
      (pendingShared ? `<p class="csub">⏳ PENDING: ${esc(m.plan)}${m.paymentReference ? ` · REF ${esc(m.paymentReference)}` : ''} <button type="button" data-act="confirm-pay" data-email="${esc(m.email)}">Confirm payment</button></p>` : '') +
      `<div class="crow"><span class="csub">RENEW:</span>${[1, 3, 6, 12].map(mo => `<button type="button" data-act="renew" data-mo="${mo}" data-email="${esc(m.email)}">+${mo}mo</button>`).join('')}</div>` +
      `<div class="crow"><select id="mm-newplan" aria-label="Change plan"><option value="">No plan</option>${Object.keys(PLAN_PRICES).map(pn => `<option${planKey(m.plan) === pn ? ' selected' : ''}>${pn}</option>`).join('')}</select><button type="button" data-act="setplan" data-email="${esc(m.email)}">Set plan</button>` +
      `<select id="mm-newcoach" aria-label="Assign trainer"><option value="">No trainer</option>${coachList().map(c => `<option value="${esc(c.email)}"${m.assignedCoach === c.email ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select><button type="button" data-act="setcoach" data-email="${esc(m.email)}">Assign</button></div>` +
      `<div class="crow"><select id="mm-newrole" aria-label="Change role"><option value="member"${currentRole==='member'?' selected':''}>Member</option><option value="trainer"${currentRole==='trainer'?' selected':''}>Trainer</option><option value="manager"${currentRole==='manager'?' selected':''}>Manager</option><option value="admin"${currentRole==='admin'?' selected':''}>Admin</option></select><button type="button" data-act="setrole" data-email="${esc(m.email)}">Set role</button></div>` +
      `<div class="crow"><button type="button" data-act="suspend" data-email="${esc(m.email)}">${m.suspended ? 'Unsuspend' : 'Suspend'}</button><button type="button" data-act="delmember" data-email="${esc(m.email)}">Delete</button>` +
      (waLink(m.phone, `Hi ${m.name}! This is ONYX Athletic Club.`) ? `<a class="wa-link" target="_blank" rel="noopener" href="${waLink(m.phone, `Hi ${m.name}! This is ONYX Athletic Club.`)}">WhatsApp</a>` : '') + `</div>` +
      `</div>`;
    return;
  }
  box.innerHTML = `<div class="adm-panel"><h3>${esc(m.name)}${m.suspended ? ' ⛔ SUSPENDED' : ''} · ${esc(currentRole.toUpperCase())}</h3>` +
    `<p class="csub">${esc(m.email).toUpperCase()} · ${esc((m.phone || 'NO PHONE').toUpperCase())} · LV ${levelOf(pointsOf(m)).n} · ${visits.length} VISITS · STREAK ${calcStreak(m.checkins)} · LAST ${esc(String(last)).toUpperCase()}</p>` +
    `<p class="csub">PLAN: ${esc((m.plan || '—').toUpperCase())} · EXPIRES: ${m.expiresAt ? esc(fmtDate(m.expiresAt)) : '—'} · TRAINER: ${esc(coachName.toUpperCase())} · ROLE: ${esc(currentRole.toUpperCase())}</p>` +
    (pend ? `<p class="csub">⏳ PENDING: ${esc(pend.plan)} · REF ${esc(pend.ref)} · ${inr(planPrice(pend.plan))} <button type="button" data-act="confirm-pay" data-email="${esc(m.email)}">Confirm payment</button></p>` : '') +
    `<div class="crow"><span class="csub">RENEW:</span>${[1, 3, 6, 12].map(mo => `<button type="button" data-act="renew" data-mo="${mo}" data-email="${esc(m.email)}">+${mo}mo</button>`).join('')}</div>` +
    `<div class="crow"><select id="mm-newplan" aria-label="Change plan"><option value="">No plan</option>${Object.keys(PLAN_PRICES).map(pn => `<option${planKey(m.plan) === pn ? ' selected' : ''}>${pn}</option>`).join('')}</select><button type="button" data-act="setplan" data-email="${esc(m.email)}">Set plan</button>` +
    `<select id="mm-newcoach" aria-label="Assign trainer"><option value="">No trainer</option>${coachList().map(c => `<option value="${esc(c.email)}"${m.assignedCoach === c.email ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select><button type="button" data-act="setcoach" data-email="${esc(m.email)}">Assign</button></div>` +
    `<div class="crow"><select id="mm-newrole" aria-label="Change role"><option value="member"${currentRole==='member'?' selected':''}>Member</option><option value="trainer"${currentRole==='trainer'?' selected':''}>Trainer</option><option value="manager"${currentRole==='manager'?' selected':''}>Manager</option><option value="admin"${currentRole==='admin'?' selected':''}>Admin</option></select><button type="button" data-act="setrole" data-email="${esc(m.email)}">Set role</button><span class="csub">SUPABASE profiles.role SHOULD MATCH</span></div>` +
    `<div class="crow"><button type="button" data-act="suspend" data-email="${esc(m.email)}">${m.suspended ? 'Unsuspend' : 'Suspend'}</button><button type="button" data-act="delmember" data-email="${esc(m.email)}">Delete</button>` +
    (waLink(m.phone, `Hi ${m.name}! This is ONYX Athletic Club.`) ? `<a class="wa-link" target="_blank" rel="noopener" href="${waLink(m.phone, `Hi ${m.name}! This is ONYX Athletic Club.`)}">WhatsApp</a>` : '') + `</div></div>`;
};

const renderAdminLeads = () => {
  const leads = adminLeadRoster();
  const n = s => leads.filter(l => l.status === s).length;
  const conv = leads.length ? ((n('joined') / leads.length) * 100).toFixed(1) : '0.0';
  document.getElementById('ld-stats').innerHTML =
    [[leads.length, 'TOTAL'], [n('lead'), 'NEW'], [n('contacted'), 'CONTACTED'], [n('trial'), 'TRIAL'], [n('joined'), 'JOINED'], [`${conv}%`, 'CONVERSION']]
      .map(([v, l]) => `<div><strong>${v}</strong><span>${l}</span></div>`).join('');
  const note = adminLeadsNotice();
  document.getElementById('ld-list').innerHTML = note + (leads.length ? [...leads].reverse().map(l =>
    `<div class="adm-row"><strong>${esc(l.name)} · ${esc(l.phone || 'no phone')}</strong>` +
    `<span>${esc(l.source)} · wants ${esc(l.plan)} · ${esc(fmtDate(l.at))}${l._remote ? ' · SUPABASE' : ' · LOCAL'}</span>` +
    `<span class="adm-lead-ctl"><select data-lead-status="${l.id}" aria-label="Status">${['lead', 'contacted', 'trial', 'joined'].map(s => `<option value="${s}"${l.status === s ? ' selected' : ''}>${s.toUpperCase()}</option>`).join('')}</select>` +
    `<input type="date" data-lead-follow="${l.id}" value="${esc(l.followUp || '')}" aria-label="Follow-up date" />` +
    (waLink(l.phone, `Hi ${l.name}! Thanks for your interest in ONYX (${l.plan}). Want a free trial session?`) ? `<a class="wa-link" target="_blank" rel="noopener" href="${waLink(l.phone, `Hi ${l.name}! Thanks for your interest in ONYX (${l.plan}). Want a free trial session?`)}">WA</a>` : '') +
    `<button type="button" data-lead-del="${l.id}" aria-label="Delete lead">×</button></span></div>`
  ).join('') : '<p class="log-empty">No leads yet — contact-form enquiries land here automatically.</p>');
  const retryLeads = document.getElementById('adm-retry-leads');
  if (retryLeads) retryLeads.addEventListener('click', () => loadAdminLeads(true));
};

const renderAdminReminders = () => {
  const box = document.getElementById('rm-list');
  const today = dayKey();
  const members = Object.values(readUsers()).filter(u => u && isMember(u));
  const rows = [];
  const waBtn = (m, text) => {
    const link = waLink(m.phone, text);
    return link ? `<a class="wa-link" target="_blank" rel="noopener" href="${link}">Send WA</a>` : '<span class="csub">NO PHONE</span>';
  };
  members.forEach(m => {
    const d = daysLeft(m);
    if (m.plan && d !== null && d >= 0 && d <= 7) rows.push({ icon: '⚠️', text: `${m.name} — membership expires in ${d}d (${m.plan}).`, act: waBtn(m, `Hi ${m.name}! Your ONYX ${m.plan} plan expires in ${d} day(s). Renew at the front desk to keep your streak alive.`) });
    if (m.plan && d !== null && d < 0) rows.push({ icon: '⛔', text: `${m.name} — lapsed ${-d}d ago (${m.plan}).`, act: waBtn(m, `Hi ${m.name}! Your ONYX membership lapsed — come back this week and we'll waive the joining hassle.`) });
    if (m.pendingPayment) rows.push({ icon: '💳', text: `${m.name} — pending ${m.pendingPayment.plan} · ref ${m.pendingPayment.ref}.`, act: `<button type="button" data-act="confirm-pay" data-email="${esc(m.email)}">Confirm</button>` });
    const visits = m.visits || [];
    if (m.plan && visits.length) {
      const gap = Math.floor((Date.now() - new Date(visits[visits.length - 1].at)) / 86400000);
      if (gap >= 5) rows.push({ icon: '👋', text: `${m.name} — gone ${gap} days.`, act: waBtn(m, `Hi ${m.name}! We haven't seen you in ${gap} days — ready for your next workout? Your coach has a session waiting.`) });
    }
    if (m.dob) {
      const md = String(m.dob).slice(5);
      const thisYear = new Date(`${today.slice(0, 4)}-${md}T12:00:00`);
      const diff = Math.ceil((thisYear - new Date(`${today}T12:00:00`)) / 86400000);
      if (diff >= 0 && diff <= 7) rows.push({ icon: '🎂', text: `${m.name} — birthday ${diff === 0 ? 'TODAY' : 'in ' + diff + 'd'} (${m.dob}).`, act: waBtn(m, `Happy Birthday, ${m.name}! 🎂 Show this message for 15% off your next ONYX renewal.`) });
    }
  });
  const todaySess = [];
  members.forEach(m => (m.sessions || []).forEach(s => {
    if ((s.status === 'scheduled' || s.status === 'requested') && s.date === today) todaySess.push({ m, s });
  }));
  todaySess.sort((a, b) => String(a.s.time).localeCompare(String(b.s.time)));
  todaySess.forEach(({ m, s }) => rows.push({ icon: '📅', text: `TODAY ${s.time} — ${s.type} · ${m.name}${s.status === 'requested' ? ' (UNCONFIRMED)' : ''}.`, act: waBtn(m, `Hi ${m.name}! Reminder: your ${s.type} is today at ${s.time}. See you at ONYX!`) }));
  box.innerHTML = rows.length ? rows.map(r => `<div class="adm-row"><strong>${r.icon} ${esc(r.text)}</strong><span class="adm-lead-ctl">${r.act}</span></div>`).join('')
    : '<p class="log-empty">Nothing on the radar — quiet day. 🎉</p>';
};

/* ---------- admin events (bound once) ---------- */
(() => {
  const logout = document.getElementById('admin-logout');
  if (logout) logout.addEventListener('click', () => {
    localStorage.removeItem(SESSION_KEY);
    adminMember = null;
    adminSupabaseState = { token: '', loading: false, loaded: false, error: '', members: [] };
    updateAuthLinks();
    renderAdmin();
  });
  const tabs = document.getElementById('adm-tabs');
  if (!tabs) return;
  tabs.addEventListener('click', event => {
    const btn = event.target.closest('[data-atab]');
    if (!btn) return;
    adminTab = btn.dataset.atab;
    renderAdmin();
  });
  const reportPeriodSelect = document.getElementById('rp-period');
  if (reportPeriodSelect) reportPeriodSelect.addEventListener('change', () => renderAdminReports());
  const reportExport = document.getElementById('rp-export');
  // Deferred arrow, like every other admin listener: these consts are declared
  // further down the file, so passing the bare reference would hit the TDZ.
  if (reportExport) reportExport.addEventListener('click', () => exportReports());
  document.getElementById('mm-search').addEventListener('input', () => renderAdminMembers());
  document.getElementById('mm-plan').addEventListener('change', () => renderAdminMembers());
  document.getElementById('mm-add-toggle').addEventListener('click', () => {
    const f = document.getElementById('mm-add');
    f.hidden = !f.hidden;
  });
  document.getElementById('mm-add').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.target;
    const name = form.elements.name.value.trim().slice(0, 50);
    const email = form.elements.email.value.trim().toLowerCase().slice(0, 80);
    const phone = form.elements.phone.value.replace(/\D/g, '').slice(-10);
    const plan = form.elements.plan.value || null;
    const pw = form.elements.password.value;
    if (name.length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || pw.length < 6) return;
    try {
      if (adminSharedReady()) {
        await remoteAdminMemberWrite('create_member', { name, email, phone, password: pw, plan });
      } else {
        const users = readUsers();
        if (users[email]) return;
        const { algo, salt, hash } = await hashPassword(pw);
        users[email] = {
          name, email, algo, salt, pass: hash, phone: phone.length === 10 ? phone : '',
          createdAt: new Date().toISOString(), onboarded: false, profile: null,
          plan, expiresAt: plan ? new Date(Date.now() + planDays(plan) * 86400000).toISOString() : null,
          pendingPayment: null
        };
        writeUsers(users);
      }
      form.reset();
      form.hidden = true;
      adminMember = email;
      renderAdmin();
    } catch (error) {
      alert(error && error.message ? error.message : 'Could not create member');
    }
  });
  document.getElementById('mm-list').addEventListener('click', event => {
    const row = event.target.closest('[data-mm]');
    if (!row) return;
    adminMember = row.dataset.mm;
    renderAdminMembers();
  });
  document.getElementById('admin-main').addEventListener('click', async event => {
    const btn = event.target.closest('[data-act]');
    if (!btn) return;
    const m = adminMemberRecord(btn.dataset.email) || getMember(btn.dataset.email);
    if (!m) return;
    if (isAdminStrict(m) && roleOf(m) === 'admin' && btn.dataset.act === 'delmember') return;
    const me = currentUser();
    const remote = shouldUseRemoteAdminWrite(m);
    try {
      if (btn.dataset.act === 'delmember') {
        if (!isAdminStrict(currentUser())) return;
        if (me && me.email === m.email) return;
        if (!window.confirm(`Delete ${m.name} (${m.email}) permanently?`)) return;
        if (remote) {
          await remoteAdminMemberWrite('delete_member', { email: m.email });
          updateLocalAdminShadow(m.email, null);
        } else {
          const users = readUsers();
          delete users[m.email];
          writeUsers(users);
        }
        if (adminMember === m.email) adminMember = null;
        renderAdmin();
        return;
      }
      if (btn.dataset.act === 'suspend') {
        m.suspended = !m.suspended;
        saveMember(m);
        renderAdmin();
        return;
      }
      if (btn.dataset.act === 'renew') {
        const mo = parseInt(btn.dataset.mo, 10) || 1;
        if (remote) {
          await remoteAdminMemberWrite('renew', { email: m.email, months: mo });
        } else {
          const base = m.expiresAt && new Date(m.expiresAt) > new Date() ? new Date(m.expiresAt) : new Date();
          base.setDate(base.getDate() + mo * 30);
          m.expiresAt = base.toISOString();
          pushNotif(m, '✅', `Membership renewed — active till ${fmtDate(m.expiresAt)}.`);
          saveMember(m);
        }
        renderAdmin();
        return;
      }
      if (btn.dataset.act === 'setplan') {
        const sel = document.getElementById('mm-newplan');
        const plan = sel ? sel.value || null : m.plan;
        if (remote) {
          await remoteAdminMemberWrite('set_plan', { email: m.email, plan });
          updateLocalAdminShadow(m.email, rec => ({ ...rec, pendingPayment: null, plan, expiresAt: plan ? rec.expiresAt : null }));
        } else {
          m.plan = plan;
          if (m.plan && !m.expiresAt) m.expiresAt = new Date(Date.now() + planDays(m.plan) * 86400000).toISOString();
          saveMember(m);
        }
        renderAdmin();
        return;
      }
      if (btn.dataset.act === 'setcoach') {
        const sel = document.getElementById('mm-newcoach');
        m.assignedCoach = sel && sel.value ? sel.value : null;
        saveMember(m);
        renderAdmin();
        return;
      }
      if (btn.dataset.act === 'setrole') {
        const sel = document.getElementById('mm-newrole');
        const newRole = sel ? sel.value : 'member';
        if (!['member','trainer','manager','admin'].includes(newRole)) return;
        if (newRole === 'admin' && !isAdminStrict(currentUser())) {
          alert('Only admin can assign admin role');
          return;
        }
        if (remote) {
          await remoteAdminMemberWrite('set_role', { email: m.email, role: newRole });
          updateLocalAdminShadow(m.email, rec => ({ ...rec, role: newRole, supabaseRole: newRole }));
        } else {
          m.role = newRole;
          m.supabaseRole = newRole;
          saveMember(m);
        }
        renderAdmin();
        return;
      }
      if (btn.dataset.act === 'confirm-pay') {
        const pend = m.pendingPayment || (m.plan ? { plan: m.plan, ref: m.paymentReference || '' } : null);
        if (!pend) return;
        if (remote) {
          await remoteAdminMemberWrite('confirm_payment', { email: m.email, plan: pend.plan, ref: pend.ref || '' });
          updateLocalAdminShadow(m.email, rec => ({ ...rec, pendingPayment: null, plan: pend.plan }));
        } else {
          m.plan = pend.plan;
          m.expiresAt = new Date(Date.now() + planDays(pend.plan) * 86400000).toISOString();
          m.pendingPayment = null;
          pushNotif(m, '💳', `Payment of ${inr(planPrice(pend.plan))} confirmed — ${pend.plan} active till ${fmtDate(m.expiresAt)}.`);
          saveMember(m);
        }
        renderAdmin();
      }
    } catch (error) {
      alert(error && error.message ? error.message : 'Action failed');
    }
  });
  document.getElementById('ld-add').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.target;
    const name = form.elements.name.value.trim().slice(0, 50);
    const phone = form.elements.phone.value.trim().slice(0, 13);
    if (name.length < 2 || phone.length < 10) return;
    try {
      if (adminSharedReady()) {
        await writeLeadRemote('POST', '', {
          name,
          phone,
          source: String(form.elements.source.value || 'Website').toLowerCase(),
          plan: form.elements.plan.value || 'General',
          consent: true,
          status: 'lead'
        });
      } else {
        const leads = readLeads();
        leads.push(normLead({ name, phone, source: form.elements.source.value, plan: form.elements.plan.value }));
        writeLeads(leads);
      }
      form.reset();
      renderAdminLeads();
    } catch (error) {
      alert(error && error.message ? error.message : 'Could not add lead');
    }
  });
  document.getElementById('ld-list').addEventListener('change', async event => {
    const st = event.target.closest('[data-lead-status]');
    const fw = event.target.closest('[data-lead-follow]');
    if (!st && !fw) return;
    const id = (st || fw).dataset.leadStatus || (st || fw).dataset.leadFollow;
    const leads = adminLeadRoster();
    const lead = leads.find(l => l.id === id);
    if (!lead) return;
    try {
      if (lead._remote && adminSharedReady()) {
        const patch = {};
        if (st) patch.status = st.value;
        if (fw) patch.follow_up = fw.value || null;
        await writeLeadRemote('PATCH', `?id=eq.${encodeURIComponent(id)}`, patch);
      } else {
        const local = readLeads();
        const row = local.find(l => l.id === id);
        if (!row) return;
        if (st) row.status = st.value;
        if (fw) row.followUp = fw.value;
        writeLeads(local);
      }
      renderAdminLeads();
    } catch (error) {
      alert(error && error.message ? error.message : 'Could not update lead');
    }
  });
  document.getElementById('ld-list').addEventListener('click', async event => {
    const del = event.target.closest('[data-lead-del]');
    if (!del) return;
    const leads = adminLeadRoster();
    const lead = leads.find(l => l.id === del.dataset.leadDel);
    if (!lead) return;
    try {
      if (lead._remote && adminSharedReady()) {
        await writeLeadRemote('DELETE', `?id=eq.${encodeURIComponent(lead.id)}`);
      } else {
        writeLeads(readLeads().filter(l => l.id !== del.dataset.leadDel));
      }
      renderAdminLeads();
    } catch (error) {
      alert(error && error.message ? error.message : 'Could not delete lead');
    }
  });
})();

/* ===========================================================================
   ADMIN TABS 2 — INVENTORY (#14), STAFF + RBAC (#15), REPORTS (#16).
   New tabs plug into the existing admin shell + gate.
   =========================================================================== */

/* ---------- inventory ---------- */
const INV_KEY = 'onyx-inventory';
const INV_DEFAULT = [
  { id: 'p1', name: 'Whey Protein 1kg', price: 2499, stock: 17, sold: 83, threshold: 10 },
  { id: 'p2', name: 'Creatine 300g', price: 899, stock: 24, sold: 41, threshold: 8 },
  { id: 'p3', name: 'ONYX Shaker', price: 349, stock: 40, sold: 112, threshold: 15 },
  { id: 'p4', name: 'Training Gloves', price: 599, stock: 9, sold: 27, threshold: 10 },
  { id: 'p5', name: 'ONYX T-Shirt', price: 799, stock: 22, sold: 35, threshold: 10 }
];
const readInvLocal = () => {
  try { return JSON.parse(localStorage.getItem(INV_KEY) || '[]') || []; }
  catch (err) { return []; }
};
const writeInvLocal = v => localStorage.setItem(INV_KEY, JSON.stringify(v));
const seedInv = () => {
  if (localStorage.getItem(INV_KEY) !== null) return;
  writeInvLocal(INV_DEFAULT);
};
let adminInvState = { loading: false, loaded: false, error: '', items: [] };
const invRoster = () => (adminInvState.loaded && !adminInvState.error ? adminInvState.items : readInvLocal());
const adminInvNotice = () => {
  if (adminInvState.loading) return '<p class="coach-demo-note">Syncing shared inventory from Supabase…</p>';
  if (adminInvState.error) return `<p class="coach-demo-note">Shared inventory sync unavailable (${esc(adminInvState.error)}). Falling back to this browser's local inventory.</p>`;
  if (adminInvState.loaded) return '<p class="coach-demo-note">Inventory is shared through Supabase across devices.</p>';
  return '';
};
const loadAdminInventory = async (force = false) => {
  const user = currentUser();
  if (!(ONYX.SUPABASE_URL && ONYX.SUPABASE_KEY && user && user.supabaseToken && isManager(user))) return invRoster();
  if (!force && adminInvState.loading) return adminInvState.items;
  if (!force && adminInvState.loaded) return adminInvState.items;
  adminInvState = { ...adminInvState, loading: true, error: '' };
  try {
    const token = (await ensureSupabaseToken(user)) || user.supabaseToken;
    const response = await fetch(`${ONYX.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/inventory_items?select=id,name,price,stock,sold,threshold&order=created_at.asc`, {
      headers: { ...supabaseHeaders(token), Accept: 'application/json' }
    });
    const payload = await response.json().catch(() => []);
    if (!response.ok) throw new Error(payload && payload.message ? payload.message : `HTTP ${response.status}`);
    adminInvState = { loading: false, loaded: true, error: '', items: payload || [] };
    if ((payload || []).length) writeInvLocal(payload);
  } catch (error) {
    adminInvState = { ...adminInvState, loading: false, loaded: true, error: error && error.message ? error.message : 'sync failed' };
  }
  if (document.body.classList.contains('admin-page')) renderAdmin();
  return adminInvState.items;
};
const writeInventoryRemote = async (method, pathSuffix = '', body = null) => {
  const user = currentUser();
  if (!(ONYX.SUPABASE_URL && ONYX.SUPABASE_KEY && user && user.supabaseToken)) throw new Error('shared inventory sync is not configured');
  const token = (await ensureSupabaseToken(user)) || user.supabaseToken;
  const response = await fetch(`${ONYX.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/inventory_items${pathSuffix}`, {
    method,
    headers: {
      ...supabaseHeaders(token),
      Prefer: method === 'POST' ? 'return=representation' : 'return=minimal',
      Accept: 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const payload = await response.json().catch(() => ([]));
  if (!response.ok) throw new Error(payload && payload.message ? payload.message : `HTTP ${response.status}`);
  await loadAdminInventory(true);
  return payload;
};
const renderAdminInv = () => {
  seedInv();
  const items = invRoster();
  const units = items.reduce((a, p) => a + (+p.stock || 0), 0);
  const value = items.reduce((a, p) => a + (+p.stock || 0) * (+p.price || 0), 0);
  const low = items.filter(p => (+p.stock || 0) <= (+p.threshold || 0)).length;
  document.getElementById('iv-stats').innerHTML =
    [[items.length, 'SKUS'], [units, 'UNITS IN STOCK'], [inr(value), 'STOCK VALUE'], [low, 'LOW STOCK']]
      .map(([v, l]) => `<div><strong>${v}</strong><span>${l}</span></div>`).join('');
  const note = adminInvNotice();
  document.getElementById('iv-list').innerHTML = note + (items.length ? items.map(p => {
    const isLow = (+p.stock || 0) <= (+p.threshold || 0);
    return `<div class="adm-row${isLow ? ' is-low' : ''}"><strong>${isLow ? '⚠️ ' : ''}${esc(p.name)} · ${inr(p.price)}</strong>` +
      `<span>STOCK: ${+p.stock || 0} · SOLD: ${+p.sold || 0} · LOW AT: ${+p.threshold || 0}${adminInvState.loaded && !adminInvState.error ? ' · SUPABASE' : ' · LOCAL'}</span>` +
      `<span class="adm-lead-ctl"><button type="button" data-iv-sell="${p.id}">Sell 1</button><button type="button" data-iv-add="${p.id}">+10 stock</button><button type="button" data-iv-del="${p.id}" aria-label="Delete product">×</button></span></div>`;
  }).join('') : '<p class="log-empty">No products — add your first above.</p>');
};

/* ---------- staff + roles ---------- */
const STAFF_KEY = 'onyx-staff';
const readStaffLocal = () => {
  try { return JSON.parse(localStorage.getItem(STAFF_KEY) || '[]') || []; }
  catch (err) { return []; }
};
const writeStaffLocal = v => localStorage.setItem(STAFF_KEY, JSON.stringify(v));
let adminStaffState = { loading: false, loaded: false, error: '', staff: [] };
const staffRoster = () => (adminStaffState.loaded && !adminStaffState.error ? adminStaffState.staff : readStaffLocal());
const adminStaffNotice = () => {
  if (adminStaffState.loading) return '<p class="coach-demo-note">Syncing shared staff directory from Supabase…</p>';
  if (adminStaffState.error) return `<p class="coach-demo-note">Shared staff sync unavailable (${esc(adminStaffState.error)}). Falling back to this browser's local records.</p>`;
  if (adminStaffState.loaded) return '<p class="coach-demo-note">Staff records are shared through Supabase across devices.</p>';
  return '';
};
const loadAdminStaff = async (force = false) => {
  const user = currentUser();
  if (!(ONYX.SUPABASE_URL && ONYX.SUPABASE_KEY && user && user.supabaseToken && isAdminStrict(user))) return staffRoster();
  if (!force && adminStaffState.loading) return adminStaffState.staff;
  if (!force && adminStaffState.loaded) return adminStaffState.staff;
  adminStaffState = { ...adminStaffState, loading: true, error: '' };
  try {
    const token = (await ensureSupabaseToken(user)) || user.supabaseToken;
    const response = await fetch(`${ONYX.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/staff_directory?select=id,name,role,phone,salary,hours,days&order=created_at.asc`, {
      headers: { ...supabaseHeaders(token), Accept: 'application/json' }
    });
    const payload = await response.json().catch(() => []);
    if (!response.ok) throw new Error(payload && payload.message ? payload.message : `HTTP ${response.status}`);
    adminStaffState = { loading: false, loaded: true, error: '', staff: payload || [] };
    if ((payload || []).length) writeStaffLocal(payload);
  } catch (error) {
    adminStaffState = { ...adminStaffState, loading: false, loaded: true, error: error && error.message ? error.message : 'sync failed' };
  }
  if (document.body.classList.contains('admin-page')) renderAdmin();
  return adminStaffState.staff;
};
const writeStaffRemote = async (method, pathSuffix = '', body = null) => {
  const user = currentUser();
  if (!(ONYX.SUPABASE_URL && ONYX.SUPABASE_KEY && user && user.supabaseToken)) throw new Error('shared staff sync is not configured');
  const token = (await ensureSupabaseToken(user)) || user.supabaseToken;
  const response = await fetch(`${ONYX.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/staff_directory${pathSuffix}`, {
    method,
    headers: {
      ...supabaseHeaders(token),
      Prefer: method === 'POST' ? 'return=representation' : 'return=minimal',
      Accept: 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const payload = await response.json().catch(() => ([]));
  if (!response.ok) throw new Error(payload && payload.message ? payload.message : `HTTP ${response.status}`);
  await loadAdminStaff(true);
  return payload;
};
// since = epoch ms cutoff. Omitted by the Staff tab (all-time), passed by
// Reports so session counts respect the selected period. Client counts stay
// current either way — a roster is not a historical fact.
const trainerLoad = (since = null) => {
  const members = Object.values(readUsers()).filter(u => u && isMember(u));
  return coachList().map(c => {
    const clients = members.filter(m => m.assignedCoach === c.email);
    let sched = 0, done = 0;
    members.forEach(m => (m.sessions || []).forEach(s => {
      if (s.coach !== c.email) return;
      if (since !== null) {
        const t = new Date(s.date).getTime();
        if (Number.isNaN(t) || t < since) return;
      }
      if (s.status === 'done') done++;
      else if (s.status === 'scheduled' || s.status === 'requested') sched++;
    }));
    const value = clients.reduce((a, m) => a + planPrice(m.plan), 0);
    return { name: c.name, email: c.email, clients: clients.length, sched, done, value };
  });
};
const renderAdminStaff = () => {
  const staff = staffRoster();
  const load = trainerLoad();
  document.getElementById('st-list').innerHTML =
    adminStaffNotice() +
    `<div class="perm-table"><strong>ROLE PERMISSIONS</strong><table>` +
    `<tr><th>ROLE</th><th>ACCESS</th></tr>` +
    `<tr><td>Owner</td><td>Everything — all tabs, delete, billing</td></tr>` +
    `<tr><td>Manager</td><td>Members, reminders, inventory, reports (no delete, no staff)</td></tr>` +
    `<tr><td>Trainer</td><td>Own clients, programs, diet, sessions (trainer dashboard)</td></tr>` +
    `<tr><td>Receptionist</td><td>Front-desk check-in via staff PIN (no login needed)</td></tr></table></div>` +
    (load.length ? `<div class="perm-table"><strong>TRAINER LOAD (LIVE)</strong><table><tr><th>COACH</th><th>CLIENTS</th><th>SESSIONS</th><th>CLIENT VALUE</th></tr>` +
      load.map(t => `<tr><td>${esc(t.name)}</td><td>${t.clients}</td><td>${t.done} done · ${t.sched} upcoming</td><td>${inr(t.value)}</td></tr>`).join('') + `</table></div>` : '') +
    (staff.length ? staff.map(s => {
      const today = (s.days || []).includes(dayKey());
      return `<div class="adm-row"><strong>${esc(s.name)} · ${esc((s.role || '').toUpperCase())}${today ? ' · ✅ PRESENT' : ''}</strong>` +
        `<span>${esc(s.phone || 'no phone')} · ${inr(s.salary || 0)}/MO · ${esc(s.hours || 'hours?')} · ${(s.days || []).length} DAYS PRESENT${adminStaffState.loaded && !adminStaffState.error ? ' · SUPABASE' : ' · LOCAL'}</span>` +
        `<span class="adm-lead-ctl"><button type="button" data-st-day="${s.id}">${today ? 'Unmark today' : 'Mark present'}</button><button type="button" data-st-del="${s.id}" aria-label="Remove staff">×</button></span></div>`;
    }).join('') : '<p class="log-empty">No staff records — add trainers, receptionists, managers above.</p>');
};

/* ---------- reports ---------- */
const rpBars = pairs => {
  const max = Math.max(1, ...pairs.map(([, v]) => v));
  return `<div class="rp-bars">` + pairs.map(([label, v, disp]) =>
    `<div><span>${esc(label)}</span><span class="ch-bar"><i style="width:${Math.round((v / max) * 100)}%"></i></span><b>${esc(disp !== undefined ? disp : String(v))}</b></div>`
  ).join('') + `</div>`;
};
/* ---------------------------------------------------------------------------
   REPORTS — period selector + CSV export + real empty states.
   Attendance and sign-ups are genuinely historical, so the period applies to
   them. Revenue is the LIVE value of currently active plans (there is no
   billing ledger in the browser), so it stays labelled as a snapshot and the
   period-filtered number beside it is new plan value booked in the window.
   --------------------------------------------------------------------------- */
let reportRows = [];

const reportPeriod = () => {
  const el = document.getElementById('rp-period');
  return el ? el.value : '30';
};
const reportPeriodLabel = () => {
  const v = reportPeriod();
  return v === 'all' ? 'ALL TIME' : `LAST ${v} DAYS`;
};
// Reports are computed synchronously from storage, so a spinner would be fake.
// What the reader does need to know is WHERE the numbers came from.
const adminReportsNotice = () => {
  if (adminSupabaseState.loading) return 'Shared sync in progress \u2014 these figures come from this browser and refresh the moment it lands.';
  if (adminSupabaseState.error) return `Shared sync unavailable (${adminSupabaseState.error}) \u2014 showing this browser\u2019s records.`;
  if (adminSharedReady()) return 'Includes shared Supabase records.';
  return 'Showing records stored in this browser.';
};

const csvCell = value => {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
const buildReportCSV = () =>
  '\uFEFF' + ['section,label,value', ...reportRows.map(r => r.map(csvCell).join(','))].join('\r\n') + '\r\n';

const exportReports = () => {
  const button = document.getElementById('rp-export');
  if (!reportRows.length) {
    if (button) button.title = 'Nothing to export yet';
    return;
  }
  const blob = new Blob([buildReportCSV()], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `onyx-report-${reportPeriod() === 'all' ? 'all' : reportPeriod() + 'd'}-${dayKey()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};



/* ---------- site content ---------- */
const renderAdminReports = () => {
  const since = reportPeriod() === 'all' ? null : Date.now() - Number(reportPeriod()) * 86400000;
  const inPeriod = value => {
    if (since === null) return true;
    const t = new Date(value).getTime();
    return !Number.isNaN(t) && t >= since;
  };
  const row = (section, label, value) => { reportRows.push([section, label, value]); };
  reportRows = [];

  const members = Object.values(readUsers()).filter(u => u && isMember(u));
  const active = members.filter(memberActive);
  const revenue = active.reduce((a, m) => a + planPrice(m.plan), 0);
  const joined = active.filter(m => inPeriod(m.activatedAt || m.createdAt));
  const booked = joined.reduce((a, m) => a + planPrice(m.plan), 0);
  const planCounts = {};
  active.forEach(m => { planCounts[m.plan] = (planCounts[m.plan] || 0) + 1; });
  const popular = Object.entries(planCounts).sort((a, b) => b[1] - a[1])[0];
  const withBoth = members.filter(m => m.createdAt && m.expiresAt);
  const avgDur = withBoth.length ? Math.round(withBoth.reduce((a, m) => a + (new Date(m.expiresAt) - new Date(m.createdAt)) / 86400000, 0) / withBoth.length) : 0;
  const expired = members.filter(m => m.plan && !memberActive(m)).length;
  const churn = (active.length + expired) ? Math.round((expired / (active.length + expired)) * 100) : 0;

  const note = document.getElementById('rp-note');
  if (note) note.textContent = `${reportPeriodLabel()} \u00b7 ${adminReportsNotice()}`;

  row('summary', 'period', reportPeriodLabel());
  row('summary', 'generated', new Date().toISOString());
  row('summary', 'active members', active.length);
  row('summary', 'active revenue', revenue);
  row('summary', 'avg membership days', avgDur);
  row('summary', 'churn %', churn);
  row('summary', 'joined in period', joined.length);
  row('summary', 'new plan value in period', booked);

  Object.entries(planCounts).forEach(([plan, n]) => {
    row('plan mix', plan, n);
    row('plan mix', `${plan} value`, n * planPrice(plan));
  });

  document.getElementById('rp-revenue').innerHTML = `<strong>REVENUE &amp; MEMBERSHIP</strong>` +
    (active.length
      ? `<p class="csub">ACTIVE REVENUE ${inr(revenue)} \u00b7 AVG MEMBERSHIP ${avgDur} DAYS \u00b7 CHURN ${churn}% \u00b7 MOST POPULAR: ${popular ? esc(popular[0]) + ` (${popular[1]})` : '\u2014'}</p>` +
        `<p class="csub">${esc(reportPeriodLabel())}: ${joined.length} JOINED \u00b7 ${inr(booked)} NEW PLAN VALUE</p>` +
        rpBars(Object.entries(planCounts).map(([plan, n]) => [plan, n * planPrice(plan), `${n} \u00d7 ${inr(planPrice(plan))}`]))
      : `<p class="log-empty">No active memberships yet. Activate a plan on the Members tab and its value appears here.</p>`) +
    `<p class="csub">ACTIVE REVENUE IS LIVE PLAN VALUE, NOT BILLED HISTORY \u2014 PERIOD BILLING NEEDS A BACKEND LEDGER.</p>`;

  const hours = Array(24).fill(0);
  const wdays = Array(7).fill(0);
  const byDay = {};
  let total = 0;
  members.forEach(m => (m.visits || []).forEach(v => {
    const d = new Date(v.at);
    if (Number.isNaN(d) || !inPeriod(v.at)) return;
    total++;
    hours[d.getHours()]++;
    wdays[d.getDay()]++;
    const k = String(v.at).slice(0, 10);
    byDay[k] = (byDay[k] || 0) + 1;
  }));
  const wdNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  Object.keys(byDay).sort().forEach(d => row('visits by day', d, byDay[d]));
  hours.forEach((v, h) => { if (v > 0) row('visits by hour', `${h}:00`, v); });
  wdays.forEach((v, i) => row('visits by weekday', wdNames[i], v));

  const peak = hours.map((v, h) => [`${h}:00`, v]).filter(([, v]) => v > 0);
  document.getElementById('rp-attendance').innerHTML = `<strong>ATTENDANCE</strong>` +
    (total
      ? `<p class="csub">${total} VISIT${total === 1 ? '' : 'S'} IN ${esc(reportPeriodLabel())} \u00b7 ${Object.keys(byDay).length} ACTIVE DAY${Object.keys(byDay).length === 1 ? '' : 'S'}</p>` +
        `<p class="csub">PEAK HOURS</p>` + rpBars(peak) +
        `<p class="csub">ACTIVE DAYS</p>` + rpBars(wdays.map((v, i) => [wdNames[i], v]).filter(([, v]) => v > 0))
      : `<p class="log-empty">No check-ins in ${esc(reportPeriodLabel().toLowerCase())}. Widen the period above, or log check-ins on a member\u2019s profile.</p>`);

  const load = trainerLoad(since);
  const sessions = load.reduce((a, t) => a + t.sched + t.done, 0);
  load.forEach(t => {
    row('trainer', t.name, t.clients);
    row('trainer sessions', `${t.name} scheduled`, t.sched);
    row('trainer sessions', `${t.name} done`, t.done);
  });
  document.getElementById('rp-trainers').innerHTML = `<strong>TRAINERS</strong>` + (load.length
    ? `<p class="csub">${sessions} SESSION${sessions === 1 ? '' : 'S'} IN ${esc(reportPeriodLabel())}</p>` +
      rpBars(load.map(t => [t.name, t.clients, `${t.clients} clients \u00b7 ${t.done + t.sched} sessions`])) +
      (sessions ? '' : `<p class="log-empty">No sessions logged in this period yet \u2014 client counts above are current, not period-specific.</p>`)
    : '<p class="log-empty">No coaches on this device yet.</p>');

  const exportBtn = document.getElementById('rp-export');
  if (exportBtn) {
    exportBtn.disabled = !reportRows.length;
    exportBtn.title = reportRows.length ? `Download ${reportRows.length} rows as CSV` : 'Nothing to export yet';
  }
};
const saveRemoteSiteContent = async data => {
  const user = currentUser();
  if (!(ONYX.SUPABASE_URL && ONYX.SUPABASE_KEY && user && user.supabaseToken && isAdminStrict(user))) throw new Error('shared site content sync is not configured');
  const token = (await ensureSupabaseToken(user)) || user.supabaseToken;
  const response = await fetch(`${ONYX.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/site_content?id=eq.1`, {
    method: 'PATCH',
    headers: {
      ...supabaseHeaders(token),
      Prefer: 'return=minimal'
    },
    body: JSON.stringify({ payload: data, updated_at: new Date().toISOString() })
  });
  const payload = await response.json().catch(() => ([]));
  if (!response.ok) throw new Error(payload && payload.message ? payload.message : `HTTP ${response.status}`);
  siteSharedState = { loading: false, loaded: true, error: '', data };
  writeSiteLocal(data);
  applySiteContent();
  renderAdminSite();
};

const renderAdminSite = () => {
  const site = siteData();
  const form = document.getElementById('site-form');
  if (!form) return;
  const prices = site.prices || {};
  form.elements.pMonthly.value = prices['Monthly'] || '';
  form.elements.p3.value = prices['3 months'] || '';
  form.elements.p6.value = prices['6 months'] || '';
  form.elements.p12.value = prices['12 months'] || '';
  form.elements.offerTitle.value = (site.offer || {}).title || '';
  form.elements.offerText.value = (site.offer || {}).text || '';
  form.elements.offerOn.checked = !!(site.offer || {}).active;
  form.elements.annText.value = (site.announcement || {}).text || '';
  form.elements.annOn.checked = !!(site.announcement || {}).active;
  form.elements.faqs.value = Array.isArray(site.faqs) ? site.faqs.map(f => `${f.q}
${f.a}`).join('\n\n') : '';
  form.elements.phone.value = (site.contact || {}).phone || '';
  form.elements.email.value = (site.contact || {}).email || '';
  form.elements.hours.value = (site.contact || {}).hours || '';
  form.elements.address.value = (site.contact || {}).address || '';
  const note = document.getElementById('site-saved');
  if (note) note.textContent = siteSharedState.loaded && !siteSharedState.error ? 'Live across devices' : '';
};

/* ---------- tab-2 events (bound once) ---------- */
(() => {
  const main = document.getElementById('admin-main');
  if (!main) return;
  document.getElementById('iv-add').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.target;
    const name = form.elements.name.value.trim().slice(0, 60);
    const price = parseFloat(form.elements.price.value);
    const stock = parseInt(form.elements.stock.value, 10);
    const threshold = parseInt(form.elements.threshold.value, 10);
    if (!name || !(price >= 0) || !(stock >= 0)) return;
    try {
      if (adminInvState.loaded && !adminInvState.error) {
        await writeInventoryRemote('POST', '', { name, price: Math.round(price), stock, sold: 0, threshold: threshold >= 0 ? threshold : 5 });
      } else {
        const items = readInvLocal();
        items.push({ id: 'p' + Date.now().toString(36), name, price, stock, sold: 0, threshold: threshold >= 0 ? threshold : 5 });
        writeInvLocal(items);
      }
      form.reset();
      renderAdminInv();
    } catch (error) {
      alert(error && error.message ? error.message : 'Could not add product');
    }
  });
  document.getElementById('iv-list').addEventListener('click', async event => {
    const sell = event.target.closest('[data-iv-sell]');
    const add = event.target.closest('[data-iv-add]');
    const del = event.target.closest('[data-iv-del]');
    if (!sell && !add && !del) return;
    const id = (sell || add || del).dataset.ivSell || (sell || add || del).dataset.ivAdd || (sell || add || del).dataset.ivDel;
    try {
      if (adminInvState.loaded && !adminInvState.error) {
        const item = invRoster().find(x => x.id === id);
        if (!item) return;
        if (del) { await writeInventoryRemote('DELETE', `?id=eq.${encodeURIComponent(id)}`); renderAdminInv(); return; }
        const patch = {};
        if (sell && (+item.stock || 0) > 0) { patch.stock = (+item.stock || 0) - 1; patch.sold = (+item.sold || 0) + 1; }
        if (add) patch.stock = (+item.stock || 0) + 10;
        await writeInventoryRemote('PATCH', `?id=eq.${encodeURIComponent(id)}`, patch);
      } else {
        const items = readInvLocal();
        const p = items.find(x => x.id === id);
        if (del) { writeInvLocal(items.filter(x => x.id !== id)); renderAdminInv(); return; }
        if (!p) return;
        if (sell && (+p.stock || 0) > 0) { p.stock--; p.sold = (+p.sold || 0) + 1; }
        if (add) p.stock = (+p.stock || 0) + 10;
        writeInvLocal(items);
      }
      renderAdminInv();
    } catch (error) {
      alert(error && error.message ? error.message : 'Could not update inventory');
    }
  });
  document.getElementById('st-add').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.target;
    const name = form.elements.name.value.trim().slice(0, 50);
    if (name.length < 2) return;
    const record = {
      name,
      role: form.elements.role.value,
      phone: form.elements.phone.value.trim().slice(0, 13),
      salary: parseFloat(form.elements.salary.value) || 0,
      hours: form.elements.hours.value.trim().slice(0, 30) || '9–5',
      days: []
    };
    try {
      if (adminStaffState.loaded && !adminStaffState.error) {
        await writeStaffRemote('POST', '', record);
      } else {
        const staff = readStaffLocal();
        staff.push({ id: 's' + Date.now().toString(36), ...record });
        writeStaffLocal(staff);
      }
      form.reset();
      renderAdminStaff();
    } catch (error) {
      alert(error && error.message ? error.message : 'Could not add staff');
    }
  });
  document.getElementById('st-list').addEventListener('click', async event => {
    const day = event.target.closest('[data-st-day]');
    const del = event.target.closest('[data-st-del]');
    if (!day && !del) return;
    const id = (day || del).dataset.stDay || (day || del).dataset.stDel;
    try {
      if (adminStaffState.loaded && !adminStaffState.error) {
        const staff = staffRoster();
        const s = staff.find(x => x.id === id);
        if (!s) return;
        if (del) { await writeStaffRemote('DELETE', `?id=eq.${encodeURIComponent(id)}`); renderAdminStaff(); return; }
        const k = dayKey();
        const nextDays = (s.days || []).includes(k) ? (s.days || []).filter(d => d !== k) : [...(s.days || []), k];
        await writeStaffRemote('PATCH', `?id=eq.${encodeURIComponent(id)}`, { days: nextDays });
      } else {
        const staff = readStaffLocal();
        if (del) { writeStaffLocal(staff.filter(x => x.id !== id)); renderAdminStaff(); return; }
        const s = staff.find(x => x.id === id);
        if (!s) return;
        s.days = s.days || [];
        const k = dayKey();
        s.days = s.days.includes(k) ? s.days.filter(d => d !== k) : [...s.days, k];
        writeStaffLocal(staff);
      }
      renderAdminStaff();
    } catch (error) {
      alert(error && error.message ? error.message : 'Could not update staff');
    }
  });
})();

(() => {
  const form = document.getElementById('site-form');
  if (!form) return;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const num = v => { const n = parseFloat(v); return n > 0 ? Math.round(n) : undefined; };
    const prices = {};
    [['Monthly', form.elements.pMonthly.value], ['3 months', form.elements.p3.value],
     ['6 months', form.elements.p6.value], ['12 months', form.elements.p12.value]].forEach(([plan, v]) => {
      const n = num(v);
      if (n) prices[plan] = n;
    });
    const faqs = String(form.elements.faqs.value || '').split(/\n\s*\n/).map(block => {
      const lines = block.split('\n').map(s => s.trim()).filter(Boolean);
      return lines.length >= 2 ? { q: lines[0].slice(0, 140), a: lines.slice(1).join(' ').slice(0, 600) } : null;
    }).filter(Boolean);
    const payload = {
      prices,
      offer: { title: form.elements.offerTitle.value.trim().slice(0, 80), text: form.elements.offerText.value.trim().slice(0, 200), active: form.elements.offerOn.checked },
      announcement: { text: form.elements.annText.value.trim().slice(0, 160), active: form.elements.annOn.checked },
      faqs,
      contact: {
        phone: form.elements.phone.value.trim().slice(0, 18),
        email: form.elements.email.value.trim().slice(0, 80),
        hours: form.elements.hours.value.trim().slice(0, 80),
        address: form.elements.address.value.trim().slice(0, 120)
      }
    };
    try {
      if (siteSharedState.loaded && !siteSharedState.error && currentUser() && isAdminStrict(currentUser()) && currentUser().supabaseToken) {
        await saveRemoteSiteContent(payload);
      } else {
        writeSiteLocal(payload);
        siteSharedState.data = payload;
        applySiteContent();
        renderAdminSite();
      }
      sessionStorage.removeItem('onyx-ann-x');
      const note = document.getElementById('site-saved');
      if (note) note.textContent = siteSharedState.loaded && !siteSharedState.error ? 'Saved — live across devices.' : 'Saved — live on this browser immediately.';
    } catch (error) {
      const note = document.getElementById('site-saved');
      if (note) note.textContent = error && error.message ? error.message : 'Could not save site content';
    }
  });
  document.getElementById('site-reset').addEventListener('click', async () => {
    if (!window.confirm('Reset all site content to defaults?')) return;
    try {
      if (siteSharedState.loaded && !siteSharedState.error && currentUser() && isAdminStrict(currentUser()) && currentUser().supabaseToken) {
        await saveRemoteSiteContent({});
      } else {
        localStorage.removeItem(SITE_KEY);
        siteSharedState.data = {};
      }
      sessionStorage.removeItem('onyx-ann-x');
      renderAdminSite();
      applySiteContent();
      const note = document.getElementById('site-saved');
      if (note) note.textContent = siteSharedState.loaded && !siteSharedState.error ? 'Reset — shared defaults restored.' : 'Reset — reload the page to see defaults.';
    } catch (error) {
      const note = document.getElementById('site-saved');
      if (note) note.textContent = error && error.message ? error.message : 'Could not reset site content';
    }
  });
})();