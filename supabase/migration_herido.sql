-- ============================================================
-- MIGRACIÓN 2: cuarto tipo de aviso "Animal herido o atrapado"
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- Requiere haber ejecutado antes migration_ayuda.sql
-- ============================================================

-- 1. Permitir el tipo 'herido'
alter table public.reports drop constraint if exists reports_tipo_check;
alter table public.reports add constraint reports_tipo_check
  check (tipo in ('perdido', 'encontrado', 'ayuda', 'herido'));

-- 2. Nivel de urgencia (solo para 'herido')
alter table public.reports add column if not exists urgencia text
  check (urgencia in ('alta', 'media', 'baja'));

-- 3. Actualizar la política de publicación con las reglas de cada tipo
drop policy if exists "publicar reporte" on public.reports;

create policy "publicar reporte"
  on public.reports for insert
  with check (
    char_length(descripcion) <= 300
    and oculto = false
    and resuelto = false
    and (
      -- Ofertas de ayuda: llevan subtipo, no especie ni urgencia
      (tipo = 'ayuda'
        and subtipo in ('acogida', 'transporte', 'veterinario', 'comida_agua')
        and especie is null
        and urgencia is null)
      -- Animal herido o atrapado: especie y urgencia obligatorias
      or (tipo = 'herido'
        and especie in ('perro', 'gato', 'otro')
        and urgencia in ('alta', 'media', 'baja')
        and subtipo is null)
      -- Perdidos y encontrados: solo especie
      or (tipo in ('perdido', 'encontrado')
        and especie in ('perro', 'gato', 'otro')
        and subtipo is null
        and urgencia is null)
    )
  );
