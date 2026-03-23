-- Migration: user_plans table
-- À exécuter dans l'éditeur SQL de Supabase : https://supabase.com/dashboard/project/eflaghdxvrfenyqkrfnt/sql

-- Enum pour les plans
create type plan_type as enum ('gratuit', 'serenite', 'tranquillite');

-- Table user_plans
create table if not exists user_plans (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  plan              plan_type not null default 'gratuit',
  chantier_id       uuid references public.chantiers(id) on delete set null, -- nullable (pack sérénité lié à un chantier)
  siret             text,                   -- artisan lié (pour Pack Sérénité)
  stripe_payment_id text,                   -- session_id ou subscription_id Stripe
  date_achat        timestamptz not null default now(),
  date_expiration   timestamptz,            -- null = pas d'expiration (Sérénité) ou date fin abonnement
  actif             boolean not null default true,
  created_at        timestamptz not null default now()
);

-- Index pour accès rapide par user
create index if not exists user_plans_user_id_idx on user_plans(user_id);
create index if not exists user_plans_siret_idx on user_plans(siret) where siret is not null;

-- RLS (Row Level Security)
alter table user_plans enable row level security;

-- Politique : l'utilisateur ne voit que ses propres plans
create policy "user_plans: select own" on user_plans
  for select using (auth.uid() = user_id);

create policy "user_plans: insert own" on user_plans
  for insert with check (auth.uid() = user_id);

-- Le service role peut tout faire (pour les webhooks Stripe)
create policy "user_plans: service role all" on user_plans
  for all using (auth.role() = 'service_role');

-- Colonne plan dans surveillances (si la table existe)
-- alter table surveillances add column if not exists plan plan_type not null default 'gratuit';
