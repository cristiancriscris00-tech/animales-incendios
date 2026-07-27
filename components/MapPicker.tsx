"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";

interface Props {
  value: { lat: number; lng: number } | null;
  onChange: (pos: { lat: number; lng: number }) => void;
}

const SPAIN_CENTER: [number, number] = [40.0, -3.7];

export default function MapPicker({ value, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [geoError, setGeoError] = useState("");

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

      const icon = L.divIcon({
        className: "",
        html: '<span class="marker-dot seleccion"></span>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      map.on("click", (e) => {
        const pos = { lat: e.latlng.lat, lng: e.latlng.lng };
        if (markerRef.current) {
          markerRef.current.setLatLng(e.latlng);
        } else {
          markerRef.current = L.marker(e.latlng, { icon }).addTo(map);
        }
        onChangeRef.current(pos);
      });

      mapRef.current = map;
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Si la posición llega desde fuera (geolocalización), mover el marcador
  useEffect(() => {
    if (!value || !mapRef.current) return;
    (async () => {
      const L = (await import("leaflet")).default;
      const map = mapRef.current;
      if (!map) return;
      const latlng: [number, number] = [value.lat, value.lng];
      if (markerRef.current) {
        markerRef.current.setLatLng(latlng);
      } else {
        const icon = L.divIcon({
          className: "",
          html: '<span class="marker-dot seleccion"></span>',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });
        markerRef.current = L.marker(latlng, { icon }).addTo(map);
      }
      if (map.getZoom() < 13) map.setView(latlng, 14);
    })();
  }, [value]);

  function useMyLocation() {
    setGeoError("");
    if (!navigator.geolocation) {
      setGeoError("Tu navegador no permite obtener la ubicación.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGeoError("No se pudo obtener tu ubicación. Toca el punto en el mapa."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div>
      <div
        ref={containerRef}
        className="h-64 w-full rounded-lg border-2 border-neutral-300"
        aria-label="Mapa para seleccionar la ubicación"
      />
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={useMyLocation}
          className="rounded-lg bg-blue-700 px-4 py-3 text-base font-semibold text-white active:bg-blue-800"
        >
          📍 Usar mi ubicación
        </button>
        <span className="text-sm text-neutral-600">o toca el punto en el mapa</span>
      </div>
      {geoError && <p className="mt-1 text-sm font-medium text-perdido">{geoError}</p>}
    </div>
  );
}
