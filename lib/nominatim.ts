interface NominatimAddress {
  province?: string;
  state?: string;
  county?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
}

/**
 * Geocodificación inversa con Nominatim (OpenStreetMap, sin API key).
 * Devuelve provincia y municipio aproximados para unas coordenadas.
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<{ provincia: string; municipio: string }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10&accept-language=es`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) return { provincia: "", municipio: "" };
    const data = await res.json();
    const a: NominatimAddress = data.address ?? {};
    return {
      provincia: a.province ?? a.state ?? a.county ?? "",
      municipio: a.city ?? a.town ?? a.village ?? a.municipality ?? "",
    };
  } catch {
    return { provincia: "", municipio: "" };
  }
}
