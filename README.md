# 🐾 Animales perdidos y encontrados — Incendios en España

Web de una sola página para reportar animales **perdidos** y **encontrados**
durante los incendios forestales. Sin registro, sin login: publicar un aviso
lleva menos de 60 segundos desde el móvil.

- **Stack:** Next.js 14 (App Router) + TypeScript + Tailwind
- **Datos y fotos:** Supabase (gratis)
- **Mapa:** Leaflet + OpenStreetMap (sin API key)
- **Hosting:** Vercel (gratis)

---

## 1. Crear el proyecto en Supabase (5 min)

1. Entra en [supabase.com](https://supabase.com) → **New project** (plan Free vale).
2. Cuando termine de crearse, ve a **SQL Editor → New query**.
3. Pega el contenido completo de [`supabase/schema.sql`](supabase/schema.sql) y pulsa **Run**.
   Esto crea:
   - la tabla `reports` (los avisos),
   - la tabla `flags` (reportes de contenido; a los 3 flags el aviso se oculta solo),
   - el bucket público `fotos` para las imágenes,
   - las políticas de seguridad (cualquiera puede publicar y leer, pero solo
     puede modificar la columna `resuelto`).
4. Ve a **Project Settings → API** y copia:
   - **Project URL**
   - **anon public key**

## 2. Ejecutar en local

```bash
npm install
cp .env.local.example .env.local
# edita .env.local y pega la URL y la anon key de Supabase
npm run dev
```

Abre http://localhost:3000

## 3. Desplegar en Vercel (5 min)

**Opción A — con GitHub (recomendada, se actualiza sola con cada push):**

1. Sube esta carpeta a un repositorio de GitHub:
   ```bash
   git init && git add -A && git commit -m "web animales incendios"
   gh repo create animales-incendios --public --source=. --push
   ```
2. Entra en [vercel.com](https://vercel.com) → **Add New → Project** → importa el repo.
3. En **Environment Variables** añade:
   - `NEXT_PUBLIC_SUPABASE_URL` = tu Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = tu anon key
4. **Deploy**. Listo: tendrás una URL pública tipo `animales-incendios.vercel.app`.

**Opción B — sin GitHub, con la CLI:**

```bash
npm i -g vercel
vercel
# responde a las preguntas y añade las 2 variables cuando lo pida:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel --prod
```

## Qué hace la web

- **Publicar aviso** sin registro: perdido/encontrado, especie, foto
  (se comprime en el navegador a máx. 1200 px antes de subir), punto en el
  mapa o «usar mi ubicación», provincia/municipio autocompletados con
  Nominatim, descripción (300 caracteres), teléfono y aceptación explícita
  de que el teléfono será público. Si es «encontrado», pregunta por el microchip.
- **Mapa** con marcadores rojos (perdidos) y verdes (encontrados); el popup
  muestra foto, descripción, lugar, fecha y botón de llamada.
- **Filtros** por tipo, especie y provincia.
- **Tarjetas** ordenadas por más reciente, con botón de llamada directa.
- **Marcar como resuelto** (con doble toque de confirmación) y
  **Reportar contenido**: al llegar a 3 reportes el aviso se oculta
  automáticamente (trigger en la base de datos).
- La lista se refresca sola cada 60 segundos.

## Moderación y límites conocidos

- No hay cuentas: cualquiera puede marcar un aviso como resuelto o reportarlo.
  Es el precio de que publicar sea instantáneo en plena emergencia.
- El anti-duplicado de flags es por navegador (localStorage), no infalible.
- Si necesitas borrar algo a mano: Supabase → Table Editor → `reports`.
- Nominatim (autocompletado de provincia) tiene límite de ~1 petición/seg.;
  aquí solo se llama al fijar la ubicación, así que sobra.

## Próximas ampliaciones previstas

- Mapa de incendios activos y posibles expansiones en tiempo real.
- Se irá actualizando esta misma web ya publicada (misma URL de Vercel).
