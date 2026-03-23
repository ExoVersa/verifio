-- Enum statut artisan
create type statut_artisan as enum ('en_attente', 'verifie', 'refuse');

-- Table artisans
create table if not exists artisans (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid references auth.users(id) on delete cascade,
  siret                   text unique not null,
  nom_entreprise          text not null,
  adresse                 text,
  types_travaux           text[] default '{}',
  zone_intervention       text[] default '{}',
  site_web                text,
  nom_dirigeant           text not null,
  email                   text not null,
  telephone               text not null,
  justificatif_url        text,
  statut                  statut_artisan not null default 'en_attente',
  motif_refus             text,
  stripe_customer_id      text,
  stripe_subscription_id  text,
  essai_debut             timestamptz,
  essai_fin               timestamptz,
  abonnement_actif        boolean not null default false,
  badge_actif             boolean not null default false,
  photo_url               text,
  description             text,
  created_at              timestamptz not null default now()
);

alter table artisans enable row level security;
create policy "artisans: select own" on artisans for select using (auth.uid() = user_id);
create policy "artisans: insert own" on artisans for insert with check (auth.uid() = user_id);
create policy "artisans: update own" on artisans for update using (auth.uid() = user_id);
create policy "artisans: service role all" on artisans for all using (auth.role() = 'service_role');
-- Public select pour les fiches vérifiées
create policy "artisans: public read verified" on artisans for select using (statut = 'verifie');

-- Table devis_artisan
create type statut_devis as enum ('brouillon', 'envoye', 'accepte', 'refuse', 'expire');

create table if not exists devis_artisan (
  id                    uuid primary key default gen_random_uuid(),
  artisan_id            uuid not null references artisans(id) on delete cascade,
  numero_devis          integer not null,
  client_nom            text not null,
  client_email          text,
  client_telephone      text,
  client_adresse        text,
  lignes                jsonb not null default '[]',
  total_ht              numeric(10,2) not null default 0,
  tva_taux              numeric(4,1) not null default 20,
  total_ttc             numeric(10,2) not null default 0,
  acompte               numeric(10,2) not null default 0,
  statut                statut_devis not null default 'brouillon',
  date_envoi            timestamptz,
  date_ouverture_client timestamptz,
  date_reponse_client   timestamptz,
  created_at            timestamptz not null default now()
);

alter table devis_artisan enable row level security;
create policy "devis_artisan: own" on devis_artisan for all using (
  artisan_id in (select id from artisans where user_id = auth.uid())
);
create policy "devis_artisan: service role all" on devis_artisan for all using (auth.role() = 'service_role');
