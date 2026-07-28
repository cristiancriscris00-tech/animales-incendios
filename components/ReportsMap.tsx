"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker, MarkerClusterGroup } from "leaflet";
import {
  COLOR_TIPO,
  SUBTIPO_LABEL,
  URGENCIA_LABEL,
  type Report,
} from "@/lib/types";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";

interface Props {
  reports: Report[];
  /** Aviso cuya ficha se ha pulsado en el listado. */
  seleccionado?: string | null;
}

const SPAIN_CENTER: [number, number] = [40.1, -3.7];
const SPAIN_ZOOM = 6;
// Encierra la península, Baleares y Canarias queda fuera a propósito: si se
// incluyera, el encuadre por defecto se abriría al Atlántico y España se vería
// diminuta. Canarias sigue siendo navegable, solo no condiciona el encuadre.
const SPAIN_BOUNDS: [[number, number], [number, number]] = [
  [35.0, -10.0],
  [44.0, 4.5],
];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function popupHtml(r: Report): string {
  const fecha = new Date(r.created_at).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
  const color = COLOR_TIPO[r.tipo];
  const lugar = [r.municipio, r.provincia].filter(Boolean).join(", ");
  const encabezado =
    r.tipo === "ayuda"
      ? `Ofrece ayuda · ${r.subtipo ? SUBTIPO_LABEL[r.subtipo] : ""}`
      : r.tipo === "herido"
        ? `Herido o atrapado · ${r.especie ?? ""}${r.urgencia ? ` · ${URGENCIA_LABEL[r.urgencia]}` : ""}`
        : `${r.tipo} · ${r.especie ?? ""}`;
  return `
    <div style="width:200px">
      ${
        r.foto_url
          ? `<img src="${escapeHtml(r.foto_url)}" alt="" style="width:100%;height:110px;object-fit:cover;border-radius:6px" />`
          : ""
      }
      <p style="margin:6px 0 2px;font-weight:700;color:${color};text-transform:uppercase;font-size:12px">
        ${escapeHtml(encabezado)}
      </p>
      <p style="margin:0 0 4px;font-size:13px">${escapeHtml(r.descripcion)}</p>
      ${lugar ? `<p style="margin:0 0 4px;font-size:12px;color:#555">${escapeHtml(lugar)} · ${fecha}</p>` : ""}
      <a href="tel:${escapeHtml(r.telefono)}" style="display:block;text-align:center;background:${color};color:#fff;padding:8px;border-radius:6px;font-weight:700;text-decoration:none">
        📞 ${escapeHtml(r.telefono)}
      </a>
    </div>`;
}

export default function ReportsMap({ reports, seleccionado }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const clusterRef = useRef<MarkerClusterGroup | null>(null);
  const marcadoresRef = useRef<Map<string, Marker>>(new Map());
  // Leaflet se carga de forma asíncrona: si los avisos llegan antes de que
  // termine, el efecto de abajo sale sin pintar. Guardamos la lista vigente
  // aquí para que el mapa se dibuje con ella en cuanto esté listo.
  const reportsRef = useRef(reports);
  reportsRef.current = reports;
  // El primer fitBounds encuadra los avisos; después respetamos el encuadre
  // que la persona haya elegido a mano en vez de devolverla al principio.
  const encuadradoRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet.markercluster");
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        // La rueda del ratón hacía zoom en lugar de dejar bajar la página: al
        // desplazarse con el cursor encima, el mapa se iba al Atlántico.
        scrollWheelZoom: false,
        maxBounds: SPAIN_BOUNDS,
        maxBoundsViscosity: 0.9,
        minZoom: 5,
      }).setView(SPAIN_CENTER, SPAIN_ZOOM);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(map);

      clusterRef.current = L.markerClusterGroup({
        maxClusterRadius: 45,
        showCoverageOnHover: false,
        iconCreateFunction: (cluster) => {
          const n = cluster.getChildCount();
          const tam = n < 10 ? 34 : n < 50 ? 42 : 50;
          return L.divIcon({
            className: "",
            html: `<span class="cluster-dot">${n}</span>`,
            iconSize: [tam, tam],
            iconAnchor: [tam / 2, tam / 2],
          });
        },
      });
      map.addLayer(clusterRef.current);
      mapRef.current = map;
      renderMarkers(L, reportsRef.current);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      clusterRef.current = null;
      marcadoresRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      if (!mapRef.current || !clusterRef.current) return;
      const L = (await import("leaflet")).default;
      renderMarkers(L, reports);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports]);

  // Al pulsar una ficha del listado: vuela hasta ella, abre su globo y la
  // resalta. El resto de marcadores siguen visibles.
  useEffect(() => {
    const map = mapRef.current;
    const cluster = clusterRef.current;
    if (!map || !cluster || !seleccionado) return;
    const marker = marcadoresRef.current.get(seleccionado);
    if (!marker) return;

    const destino = marker.getLatLng();
    map.flyTo(destino, Math.max(map.getZoom(), 12), { duration: 0.8 });
    // Si está agrupado hay que separarlo antes de poder abrir su globo
    cluster.zoomToShowLayer(marker, () => marker.openPopup());
  }, [seleccionado]);

  // El aro dorado es puramente visual, así que se aplica sobre el icono ya
  // pintado en lugar de volver a construir todos los marcadores.
  useEffect(() => {
    marcadoresRef.current.forEach((marker, id) => {
      const el = marker.getElement()?.firstElementChild;
      el?.classList.toggle("seleccionado", id === seleccionado);
    });
  }, [seleccionado, reports]);

  function renderMarkers(L: typeof import("leaflet"), list: Report[]) {
    const cluster = clusterRef.current;
    const map = mapRef.current;
    if (!cluster || !map) return;
    cluster.clearLayers();
    marcadoresRef.current.clear();

    for (const r of list) {
      const urgente = r.tipo === "herido" && r.urgencia === "alta";
      const icon = L.divIcon({
        className: "",
        html: `<span class="marker-dot ${r.tipo}${urgente ? " urgente" : ""}${
          r.id === seleccionado ? " seleccionado" : ""
        }"></span>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      const marker = L.marker([r.lat, r.lng], { icon }).bindPopup(popupHtml(r), {
        maxWidth: 240,
      });
      cluster.addLayer(marker);
      marcadoresRef.current.set(r.id, marker);
    }

    // Encuadra los avisos la primera vez que los hay, sin salirse de España
    if (!encuadradoRef.current && list.length > 0) {
      encuadradoRef.current = true;
      const limites = L.latLngBounds(list.map((r) => [r.lat, r.lng]));
      map.fitBounds(limites.pad(0.35), {
        maxZoom: 11,
        animate: false,
      });
      // Dos avisos lejanos hacen que fitBounds se abra más que la vista de
      // España y aparezca medio Atlántico. El encuadre por defecto es el
      // suelo: nunca se ve menos detalle que el país entero.
      const c = map.getCenter();
      if (map.getZoom() < SPAIN_ZOOM || !dentroDeEspana(c.lat, c.lng)) {
        map.setView(SPAIN_CENTER, SPAIN_ZOOM, { animate: false });
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className="h-[55vh] min-h-[320px] w-full"
      aria-label="Mapa de animales perdidos, encontrados, heridos y ofertas de ayuda"
    />
  );
}

function dentroDeEspana(lat: number, lng: number): boolean {
  const [[latMin, lngMin], [latMax, lngMax]] = SPAIN_BOUNDS;
  return lat >= latMin && lat <= latMax && lng >= lngMin && lng <= lngMax;
}
