"use client";

import { useState } from "react";
import {
  SUBTIPO_ICONO,
  SUBTIPO_LABEL,
  URGENCIA_LABEL,
  type Report,
  type Tipo,
  type Urgencia,
} from "@/lib/types";

interface Props {
  report: Report;
  onResolve: (id: string) => Promise<void>;
  onFlag: (id: string) => Promise<void>;
  /** Lleva el mapa hasta este aviso. */
  onSelect?: (id: string) => void;
  seleccionado?: boolean;
}

const ESTILO: Record<Tipo, { borde: string; fondo: string; etiqueta: string }> = {
  perdido: {
    borde: "border-red-200",
    fondo: "bg-perdido",
    etiqueta: "Perdido",
  },
  encontrado: {
    borde: "border-green-200",
    fondo: "bg-encontrado",
    etiqueta: "Encontrado",
  },
  herido: {
    borde: "border-orange-200",
    fondo: "bg-herido",
    etiqueta: "Herido o atrapado",
  },
  ayuda: {
    borde: "border-blue-200",
    fondo: "bg-ayuda",
    etiqueta: "Ofrece ayuda",
  },
};

const URGENCIA_CHIP: Record<Urgencia, string> = {
  alta: "bg-herido text-white",
  media: "bg-amber-200 text-amber-900",
  baja: "bg-neutral-200 text-neutral-700",
};

export default function ReportCard({
  report: r,
  onResolve,
  onFlag,
  onSelect,
  seleccionado = false,
}: Props) {
  const [confirmResolve, setConfirmResolve] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [busy, setBusy] = useState(false);

  const fecha = new Date(r.created_at).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const lugar = [r.municipio, r.provincia].filter(Boolean).join(", ");
  const esAyuda = r.tipo === "ayuda";
  const estilo = ESTILO[r.tipo];

  // "Resuelto" significa algo distinto en cada tipo de aviso
  const esHerido = r.tipo === "herido";
  const textoResolver = esAyuda
    ? "Ya no puedo ayudar"
    : esHerido
      ? "✓ Ya está atendido"
      : "✓ Marcar como resuelto";
  const textoResuelto = esAyuda
    ? "Ya no disponible"
    : esHerido
      ? "✓ Atendido"
      : "✓ Reencontrado";

  async function handleResolve() {
    if (!confirmResolve) {
      setConfirmResolve(true);
      setTimeout(() => setConfirmResolve(false), 4000);
      return;
    }
    setBusy(true);
    await onResolve(r.id);
    setBusy(false);
  }

  async function handleFlag() {
    if (flagged) return;
    setFlagged(true);
    await onFlag(r.id);
  }

  return (
    <article
      onClick={() => onSelect?.(r.id)}
      className={`overflow-hidden rounded-xl border-2 bg-white ${estilo.borde} ${
        r.resuelto ? "opacity-60" : ""
      } ${
        seleccionado ? "ring-2 ring-solaris-gold ring-offset-1" : ""
      } ${onSelect ? "cursor-pointer" : ""}`}
    >
      {r.foto_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={r.foto_url}
          alt={
            esAyuda
              ? "Foto de la oferta de ayuda"
              : `Foto: ${r.especie ?? "animal"} ${r.tipo}`
          }
          loading="lazy"
          className="h-44 w-full object-cover"
        />
      )}
      <div className="flex flex-col gap-2 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded px-2 py-0.5 text-xs font-bold uppercase text-white ${estilo.fondo}`}
          >
            {estilo.etiqueta}
          </span>
          {esAyuda
            ? r.subtipo && (
                <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-bold uppercase text-blue-900">
                  {SUBTIPO_ICONO[r.subtipo]} {SUBTIPO_LABEL[r.subtipo]}
                </span>
              )
            : r.especie && (
                <span className="rounded bg-neutral-200 px-2 py-0.5 text-xs font-bold uppercase">
                  {r.especie}
                </span>
              )}
          {esHerido && r.urgencia && (
            <span
              className={`rounded px-2 py-0.5 text-xs font-bold uppercase ${URGENCIA_CHIP[r.urgencia]}`}
            >
              {r.urgencia === "alta" && "🚨 "}
              {URGENCIA_LABEL[r.urgencia]}
            </span>
          )}
          {r.tipo === "encontrado" && r.tiene_chip !== null && (
            <span className="rounded bg-neutral-200 px-2 py-0.5 text-xs font-bold">
              {r.tiene_chip ? "Con chip" : "Sin chip"}
            </span>
          )}
          {r.resuelto && (
            <span className="rounded bg-neutral-800 px-2 py-0.5 text-xs font-bold text-white">
              {textoResuelto}
            </span>
          )}
        </div>

        <p className="text-base">{r.descripcion}</p>
        <p className="text-sm text-neutral-600">
          {lugar && <>{lugar} · </>}
          {fecha}
        </p>

        {!r.resuelto && (
          <a
            href={`tel:${r.telefono}`}
            onClick={(e) => e.stopPropagation()}
            className={`rounded-lg py-3 text-center text-base font-bold text-white ${estilo.fondo}`}
          >
            📞 Llamar · {r.telefono}
          </a>
        )}

        <div className="flex justify-between gap-2 pt-1">
          {!r.resuelto ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleResolve();
              }}
              disabled={busy}
              className="rounded-lg border-2 border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 disabled:opacity-50"
            >
              {confirmResolve ? "¿Seguro? Toca otra vez" : textoResolver}
            </button>
          ) : (
            <span />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleFlag();
            }}
            disabled={flagged}
            className="px-2 py-2 text-sm text-neutral-500 disabled:opacity-50"
          >
            {flagged ? "Reportado" : "⚑ Reportar contenido"}
          </button>
        </div>
      </div>
    </article>
  );
}
