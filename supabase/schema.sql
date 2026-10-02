-- Landfello schema for Supabase Postgres.
-- Run in the Supabase SQL editor after enabling Auth.
-- The API connects with DATABASE_URL (pooler) and bypasses RLS.
-- auth.users is created by Supabase. public.users stores the app profile.

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id text primary key,
  email text not null unique,
  hashed_password text,
  account_type text not null default 'investor' check (account_type in ('investor', 'agent')),
  account_type_chosen boolean not null default false,
  first_name text,
  last_name text,
  phone_number text,
  license_number text,
  company_name text,
  photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.properties (
  property_id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  listing_type text not null default 'sale' check (listing_type in ('sale', 'rent')),
  title text not null,
  description text not null default '',
  country text not null,
  city text not null,
  neighborhood text,
  property_type text not null default 'Residential',
  category text not null default 'Land',
  bedrooms integer,
  bathrooms integer,
  area_acres double precision not null default 0,
  tenure text default 'Freehold',
  lease_term text,
  price double precision,
  monthly_rent double precision,
  tags jsonb not null default '[]'::jsonb,
  images jsonb not null default '[]'::jsonb,
  contact_name text not null default '',
  contact_phone text not null default '',
  contact_email text not null default '',
  verified boolean not null default true,
  days_on_market integer not null default 0,
  status text not null default 'available',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchases (
  id text primary key,
  property_id text not null references public.properties(property_id) on delete cascade,
  buyer_id text not null references public.users(id) on delete cascade,
  amount_usd double precision not null,
  amount_local double precision not null,
  currency text not null default 'NGN',
  reference text not null unique,
  status text not null default 'pending',
  paystack_access_code text,
  authorization_url text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists users_email_idx on public.users (email);
create index if not exists properties_user_id_idx on public.properties (user_id);
create index if not exists properties_created_at_idx on public.properties (created_at desc);
create index if not exists purchases_property_id_idx on public.purchases (property_id);
create index if not exists purchases_buyer_id_idx on public.purchases (buyer_id);

create or replace function public.set_properties_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists properties_set_updated_at on public.properties;
create trigger properties_set_updated_at
  before update on public.properties
  for each row
  execute function public.set_properties_updated_at();

-- Copy new Supabase Auth users into public.users.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  full_name text := coalesce(meta->>'full_name', meta->>'name', '');
  chosen boolean := coalesce((meta->>'account_type_chosen')::boolean, false)
    or (meta ? 'account_type');
  acct text := coalesce(meta->>'account_type', 'investor');
begin
  if acct not in ('investor', 'agent') then
    acct := 'investor';
  end if;

  insert into public.users (
    id,
    email,
    account_type,
    account_type_chosen,
    first_name,
    last_name,
    phone_number,
    photo_url
  )
  values (
    new.id::text,
    coalesce(new.email, new.id::text || '@users.landfello.local'),
    acct,
    chosen,
    coalesce(meta->>'first_name', nullif(split_part(full_name, ' ', 1), '')),
    coalesce(meta->>'last_name', nullif(split_part(full_name, ' ', 2), '')),
    meta->>'phone_number',
    coalesce(meta->>'avatar_url', meta->>'picture')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_auth_user();

alter table public.users enable row level security;
alter table public.properties enable row level security;
alter table public.purchases enable row level security;

drop policy if exists "Public can read properties" on public.properties;
create policy "Public can read properties"
  on public.properties
  for select
  using (true);

-- Writes go through the FastAPI service role connection, which bypasses RLS.
