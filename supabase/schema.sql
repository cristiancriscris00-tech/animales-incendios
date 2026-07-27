-- ============================================================
-- ANIMALES E INCENDIOS — Esquema Supabase
-- Pegar entero en: Supabase → SQL Editor → New query → Run
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Tabla principal de reportes
-- ------------------------------------------------------------
create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  tipo        text not null check (tipo in ('perdido', 'encontrado')),
  especie     text not null check (especie in ('perro', 'gato', 'otro')),
  descripcion text not null check (char_length(descripcion) <= 300),
  foto_url    text,
  lat         double precision not null,
  lng         double precision not null,
  provincia   text not null default '',
  municipio   text not null default '',
  telefono    text not null,
  tiene_chip  boolean,          -- solo aplica a 'encontrado'
  resuelto    boolean not null default false,
  oculto      boolean not null default false,  -- se activa con 3 flags
  created_at  timestamptz not null default now()
);

create index reports_created_at_idx on public.reports (created_at desc);
create index reports_oculto_idx on public.reports (oculto);

-- ------------------------------------------------------------
-- Tabla de reportes de contenido (flags)
-- ------------------------------------------------------------
create table public.flags (
  id         uuid primary key default gen_random_uuid(),
  report_id  uuid not null references public.reports (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index flags_report_id_idx on public.flags (report_id);

-- Al llegar a 3 flags, el reporte se oculta automáticamente
create or replace function public.hide_flagged_report()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.flags where report_id = new.report_id) >= 3 then
    update public.reports set oculto = true where id = new.report_id;
  end if;
  return new;
end;
$$;

create trigger flags_hide_report
  after insert on public.flags
  for each row execute function public.hide_flagged_report();

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
alter table public.reports enable row level security;
alter table public.flags enable row level security;

-- Cualquiera puede leer los reportes no ocultos
create policy "leer reportes visibles"
  on public.reports for select
  using (oculto = false);

-- Cualquiera puede publicar (sin login)
create policy "publicar reporte"
  on public.reports for insert
  with check (
    tipo in ('perdido', 'encontrado')
    and especie in ('perro', 'gato', 'otro')
    and char_length(descripcion) <= 300
    and oculto = false
    and resuelto = false
  );

-- Cualquiera puede actualizar, pero solo la columna resuelto
-- (se limita por privilegios de columna, ver GRANT más abajo)
create policy "marcar resuelto"
  on public.reports for update
  using (oculto = false)
  with check (oculto = false);

revoke update on public.reports from anon, authenticated;
grant update (resuelto) on public.reports to anon, authenticated;

-- Cualquiera puede reportar contenido
create policy "crear flag"
  on public.flags for insert
  with check (true);

-- ------------------------------------------------------------
-- Storage: bucket público para las fotos
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true)
on conflict (id) do nothing;

create policy "subir fotos"
  on storage.objects for insert
  with check (bucket_id = 'fotos');

create policy "ver fotos"
  on storage.objects for select
  using (bucket_id = 'fotos');
