-- ============================================================
-- MIGRACIÓN: tercer tipo de aviso "Ofrezco ayuda"
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- Solo para proyectos creados ANTES de esta función.
-- (schema.sql ya incluye todo esto para instalaciones nuevas.)
-- ============================================================

-- 1. Permitir el tipo 'ayuda'
alter table public.reports drop constraint if exists reports_tipo_check;
alter table public.reports add constraint reports_tipo_check
  check (tipo in ('perdido', 'encontrado', 'ayuda'));

-- 2. Nueva columna con el tipo de ayuda ofrecida
alter table public.reports add column if not exists subtipo text
  check (subtipo in ('acogida', 'transporte', 'veterinario', 'comida_agua'));

-- 3. La especie no aplica a las ofertas de ayuda
alter table public.reports alter column especie drop not null;

-- 4. Actualizar la política de publicación (si no, los avisos de ayuda
--    serían rechazados por RLS)
drop policy if exists "publicar reporte" on public.reports;

create policy "publicar reporte"
  on public.reports for insert
  with check (
    tipo in ('perdido', 'encontrado', 'ayuda')
    and (especie is null or especie in ('perro', 'gato', 'otro'))
    and (
      (tipo = 'ayuda' and subtipo in ('acogida', 'transporte', 'veterinario', 'comida_agua'))
      or (tipo <> 'ayuda' and especie is not null and subtipo is null)
    )
    and char_length(descripcion) <= 300
    and oculto = false
    and resuelto = false
  );
