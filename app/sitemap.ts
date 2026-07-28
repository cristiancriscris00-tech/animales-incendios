import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";
import { SITE_URL } from "@/lib/site";

// Los avisos entran y salen constantemente, así que el sitemap se regenera
// cada 10 minutos en lugar de congelarse en el momento del despliegue.
export const revalidate = 600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const portada: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1,
    },
  ];

  // Si Supabase no responde, preferimos un sitemap con la portada a un
  // despliegue roto: el resto de la web no depende de esto.
  try {
    const { data, error } = await supabase
      .from("reports")
      .select("id, created_at")
      .eq("oculto", false)
      .eq("resuelto", false)
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error || !data) return portada;

    return [
      ...portada,
      ...data.map((r) => ({
        url: `${SITE_URL}/aviso/${r.id}`,
        lastModified: new Date(r.created_at),
        changeFrequency: "daily" as const,
        priority: 0.7,
      })),
    ];
  } catch {
    return portada;
  }
}
