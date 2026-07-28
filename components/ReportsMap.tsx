"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import {
  COLOR_TIPO,
  SUBTIPO_LABEL,
  URGENCIA_LABEL,
  type Report,
} from "@/lib/types";
import "leaflet/dist/leaflet.css";

interface Props {
  reports: Report[];
}

const SPAIN_CENTER: [number, number] = [40.0, -3.7];

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

export default function ReportsMap({ reports }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;
      const map = L.map(containerRef.current).setView(SPAIN_CENTER, 5);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      renderMarkers(L, reports);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      if (!mapRef.current || !layerRef.current) return;
      const L = (await import("leaflet")).default;
      renderMarkers(L, reports);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports]);

  function renderMarkers(L: typeof import("leaflet"), list: Report[]) {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();
    for (const r of list) {
      const urgente = r.tipo === "herido" && r.urgencia === "alta";
      const icon = L.divIcon({
        className: "",
        html: `<span class="marker-dot ${r.tipo}${urgente ? " urgente" : ""}"></span>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      L.marker([r.lat, r.lng], { icon })
        .bindPopup(popupHtml(r), { maxWidth: 240 })
        .addTo(layer);
    }
  }

  return (
    <div
      ref={containerRef}
      className="h-[55vh] min-h-[320px] w-full"
      aria-label="Mapa de animales perdidos, encontrados y ofertas de ayuda"
    />
  );
}
