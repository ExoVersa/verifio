-- Migration: analyses_devis, alertes_abus, et modification user_plans
-- À exécuter dans l'éditeur SQL de Supabase

-- ── 1. Modifier user_plans : ajouter devis_analyse_used ──────────────────
alter table user_plans
  add column if not exists devis_analyse_used boolean not null default false;

-- ── 2. Table analyses_devis ──────────────────────────────────────────────
create table if not exists analyses_devis (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  chantier_id         uuid references public.chantiers(id) on delete set null,
  stripe_payment_id   text,
  plan                text not null check (plan in ('serenite', 'tranquillite')),
  pages_pdf           integer not null default 0,
  taille_pdf_bytes    integer not null default 0,
  created_at          timestamptz not null default now()
);

-- Index pour comptage mensuel rapide
create index if not exists analyses_devis_user_created_idx
  on analyses_devis(user_id, created_at desc);

-- RLS
alter table analyses_devis enable row level security;

create policy "analyses_devis: select own" on analyses_devis
  for select using (auth.uid() = user_id);

create policy "analyses_devis: service role all" on analyses_devis
  for all using (auth.role() = 'service_role');

-- ── 3. Table alertes_abus ────────────────────────────────────────────────
create table if not exists alertes_abus (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null default 'analyses_excessives',
  details     jsonb,
  created_at  timestamptz not null default now()
);

alter table alertes_abus enable row level security;

-- Seul le service role peut voir les alertes d'abus
create policy "alertes_abus: service role all" on alertes_abus
  for all using (auth.role() = 'service_role');
