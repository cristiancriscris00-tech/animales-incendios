import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { SITE_URL } from "@/lib/site";
import {
  SUBTIPO_ICONO,
  SUBTIPO_LABEL,
  URGENCIA_LABEL,
  type Report,
  type Tipo,
} from "@/lib/types";
import { PawIcon } from "@/components/PawIcon";
import SiteFooter from "@/components/SiteFooter";
import CompartirAviso from "@/components/CompartirAviso";

// Un aviso cambia de estado en minutos durante una emergencia: nunca se sirve
// una copia congelada.
export const dynamic = "force-dynamic";

const ETIQUETA: Record<Tipo, string> = {
  perdido: "Perdido",
  encontrado: "Encontrado",
  herido: "Herido o atrapado",
  ayuda: "Ofrece ayuda",
};

const FONDO: Record<Tipo, string> = {
  perdido: "bg-perdido",
  encontrado: "bg-encontrado",
  herido: "bg-herido",
  ayuda: "bg-ayuda",
};

async function getAviso(id: string): Promise<Report | null> {
  // Un id inventado no debe reventar la consulta con un error de tipo uuid.
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .eq("oculto", false)
    .maybeSingle();
  if (error || !data) return null;
  return data as Report;
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const aviso = await getAviso(params.id);
  if (!aviso) {
    return { title: "Aviso no encontrado — Solaris Rescate" };
  }

  const lugar = [aviso.municipio, aviso.provincia].filter(Boolean).join(", ");
  const titulo = `${ETIQUETA[aviso.tipo]}${aviso.especie ? ` · ${aviso.especie}` : ""}${
    lugar ? ` en ${lugar}` : ""
  } — Solaris Rescate`;
  const url = `${SITE_URL}/aviso/${aviso.id}`;

  return {
    title: titulo,
    description: aviso.descripcion,
    alternates: { canonical: url },
    openGraph: {
      title: titulo,
      description: aviso.descripcion,
      url,
      siteName: "Solaris Rescate",
      locale: "es_ES",
      type: "article",
      // La foto del animal es lo que hace que alguien pare el dedo al ver el
      // enlace en WhatsApp; si no hay, cae en la imagen de marca.
      images: [aviso.foto_url ?? "/og.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: titulo,
      description: aviso.descripcion,
      images: [aviso.foto_url ?? "/og.png"],
    },
  };
}

export default async function AvisoPage({ params }: { params: { id: string } }) {
  const aviso = await getAviso(params.id);
  if (!aviso) notFound();

  const lugar = [aviso.municipio, aviso.provincia].filter(Boolean).join(", ");
  const fecha = new Date(aviso.created_at).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <header className="sticky top-0 z-40 h-[60px] border-b border-solaris-gold/25 bg-solaris-ink md:h-[78px]">
        <Link href="/" className="flex h-full items-center gap-3 px-5">
          <PawIcon className="h-[30px] w-[30px] shrink-0 text-solaris-gold md:h-10 md:w-10" />
          <span className="flex flex-col text-[15px] font-extrabold uppercase leading-[0.9] tracking-[-0.02em] md:text-xl">
            <span className="text-solaris-cream">Solaris</span>
            <span className="text-solaris-gold">Rescate</span>
          </span>
        </Link>
      </header>

      <main className="mx-auto max-w-xl px-4 pb-10 pt-4">
        <Link
          href="/"
          className="text-sm font-semibold text-solaris-gold underline-offset-2 hover:underline"
        >
          ← Ver todos los avisos en el mapa
        </Link>

        <article className="mt-3 overflow-hidden rounded-xl border-2 border-neutral-200 bg-white">
          {aviso.foto_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={aviso.foto_url}
              alt={`Foto: ${aviso.especie ?? "animal"} ${aviso.tipo}`}
              className="max-h-80 w-full object-cover"
            />
          )}
          <div className="flex flex-col gap-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded px-2 py-0.5 text-xs font-bold uppercase text-white ${FONDO[aviso.tipo]}`}
              >
                {ETIQUETA[aviso.tipo]}
              </span>
              {aviso.especie && (
                <span className="rounded bg-neutral-200 px-2 py-0.5 text-xs font-bold uppercase">
                  {aviso.especie}
                </span>
              )}
              {aviso.subtipo && (
                <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-bold uppercase text-blue-900">
                  {SUBTIPO_ICONO[aviso.subtipo]} {SUBTIPO_LABEL[aviso.subtipo]}
                </span>
              )}
              {aviso.urgencia && (
                <span className="rounded bg-herido px-2 py-0.5 text-xs font-bold uppercase text-white">
                  {URGENCIA_LABEL[aviso.urgencia]}
                </span>
              )}
              {aviso.resuelto && (
                <span className="rounded bg-neutral-800 px-2 py-0.5 text-xs font-bold text-white">
                  Ya no está activo
                </span>
              )}
            </div>

            <p className="text-lg">{aviso.descripcion}</p>
            <p className="text-sm text-neutral-600">
              {lugar && <>{lugar} · </>}
              {fecha}
            </p>

            {!aviso.resuelto && (
              <a
                href={`tel:${aviso.telefono}`}
                className={`rounded-lg py-3 text-center text-lg font-bold text-white ${FONDO[aviso.tipo]}`}
              >
                📞 Llamar · {aviso.telefono}
              </a>
            )}

            <CompartirAviso
              id={aviso.id}
              titulo={`${ETIQUETA[aviso.tipo]}${aviso.especie ? ` · ${aviso.especie}` : ""} — Solaris Rescate`}
              descripcion={aviso.descripcion}
            />
          </div>
        </article>

        <p className="pt-4 text-center text-sm text-neutral-500">
          ¿Lo has visto? Comparte este aviso: cuanta más gente lo vea, más
          posibilidades hay de que aparezca.
        </p>
      </main>

      <SiteFooter />
    </>
  );
}
