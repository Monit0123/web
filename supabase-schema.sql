-- ONYX demo backend schema
-- Run this once in Supabase Dashboard -> SQL Editor.
-- This keeps public lead/booking intake open for inserts, while private data stays protected by RLS.

create extension if not exists pgcrypto;

do $$ begin
  create type public.user_role as enum ('member', 'coach', 'admin', 'manager');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.booking_status as enum ('requested', 'confirmed', 'cancelled', 'completed');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  role public.user_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  phone text not null check (char_length(phone) between 10 and 20),
  email text,
  source text not null default 'website',
  preferred_date date,
  preferred_time text,
  goal text,
  experience text,
  consent boolean not null default false,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references auth.users(id) on delete set null,
  name text not null check (char_length(name) between 2 and 80),
  phone text not null check (char_length(phone) between 10 and 20),
  email text,
  booking_type text not null default 'free_trial',
  preferred_date date,
  preferred_time text,
  goal text,
  experience text,
  status public.booking_status not null default 'requested',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references auth.users(id) on delete cascade,
  plan text not null,
  payment_reference text unique,
  status text not null default 'pending',
  starts_at date,
  ends_at date,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists leads_created_at_idx on public.leads(created_at desc);
create index if not exists bookings_date_idx on public.bookings(preferred_date, preferred_time);
create index if not exists memberships_member_idx on public.memberships(member_id);

create or replace function public.is_staff()
returns boolean language sql security definer stable set search_path = public
as $$ select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','manager','coach')); $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$ begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.raw_user_meta_data->>'phone')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.bookings enable row level security;
alter table public.memberships enable row level security;
alter table public.audit_events enable row level security;

drop policy if exists "profiles own read" on public.profiles;
create policy "profiles own read" on public.profiles for select using (id = auth.uid() or public.is_staff());
drop policy if exists "profiles own update" on public.profiles;
create policy "profiles own update" on public.profiles for update using (id = auth.uid() or public.is_staff()) with check (id = auth.uid() or public.is_staff());

drop policy if exists "public can create leads" on public.leads;
create policy "public can create leads" on public.leads for insert with check (consent = true);
drop policy if exists "staff can read leads" on public.leads;
create policy "staff can read leads" on public.leads for select using (public.is_staff());
drop policy if exists "staff can update leads" on public.leads;
create policy "staff can update leads" on public.leads for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists "public can create bookings" on public.bookings;
create policy "public can create bookings" on public.bookings for insert with check (true);
drop policy if exists "member or staff can read bookings" on public.bookings;
create policy "member or staff can read bookings" on public.bookings for select using (member_id = auth.uid() or public.is_staff());
drop policy if exists "member or staff can update bookings" on public.bookings;
create policy "member or staff can update bookings" on public.bookings for update using (member_id = auth.uid() or public.is_staff()) with check (member_id = auth.uid() or public.is_staff());

drop policy if exists "members own memberships" on public.memberships;
create policy "members own memberships" on public.memberships for select using (member_id = auth.uid() or public.is_staff());
drop policy if exists "staff manage memberships" on public.memberships;
create policy "staff manage memberships" on public.memberships for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "staff read audit" on public.audit_events;
create policy "staff read audit" on public.audit_events for select using (public.is_staff());
drop policy if exists "authenticated write audit" on public.audit_events;
create policy "authenticated write audit" on public.audit_events for insert with check (actor_id = auth.uid());

-- Optional: set your own user to admin after signing up. Replace the email.
-- update public.profiles set role = 'admin'
-- where id = (select id from auth.users where email = 'owner@example.com');

-- Payment verification ledger — written ONLY by the verify-payment edge
-- function (service role). One payment_id may activate one membership, ever.
-- No RLS policies on purpose: browser roles must not read or write it.
create table if not exists public.payment_verifications (
  payment_id text primary key,
  email text,
  ref text,
  plan text not null,
  amount integer not null,
  verified_at timestamptz not null default now()
);
alter table public.payment_verifications enable row security;
