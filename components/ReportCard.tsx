"use client";

import { useState } from "react";
import type { Report } from "@/lib/types";

interface Props {
  report: Report;
  onResolve: (id: string) => Promise<void>;
  onFlag: (id: string) => Promise<void>;
}

export default function ReportCard({ report: r, onResolve, onFlag }: Props) {
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
  const esPerdido = r.tipo === "perdido";

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
      className={`overflow-hidden rounded-xl border-2 bg-white ${
        esPerdido ? "border-red-200" : "border-green-200"
      } ${r.resuelto ? "opacity-60" : ""}`}
    >
      {r.foto_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={r.foto_url}
          alt={`Foto: ${r.especie} ${r.tipo}`}
          loading="lazy"
          className="h-44 w-full object-cover"
        />
      )}
      <div className="flex flex-col gap-2 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded px-2 py-0.5 text-xs font-bold uppercase text-white ${
              esPerdido ? "bg-perdido" : "bg-encontrado"
            }`}
          >
            {r.tipo}
          </span>
          <span className="rounded bg-neutral-200 px-2 py-0.5 text-xs font-bold uppercase">
            {r.especie}
          </span>
          {r.tipo === "encontrado" && r.tiene_chip !== null && (
            <span className="rounded bg-neutral-200 px-2 py-0.5 text-xs font-bold">
              {r.tiene_chip ? "Con chip" : "Sin chip"}
            </span>
          )}
          {r.resuelto && (
            <span className="rounded bg-neutral-800 px-2 py-0.5 text-xs font-bold text-white">
              ✓ Reencontrado
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
            className={`rounded-lg py-3 text-center text-base font-bold text-white ${
              esPerdido ? "bg-perdido" : "bg-encontrado"
            }`}
          >
            📞 Llamar · {r.telefono}
          </a>
        )}

        <div className="flex justify-between gap-2 pt-1">
          {!r.resuelto ? (
            <button
              onClick={handleResolve}
              disabled={busy}
              className="rounded-lg border-2 border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 disabled:opacity-50"
            >
              {confirmResolve ? "¿Seguro? Toca otra vez" : "✓ Marcar como resuelto"}
            </button>
          ) : (
            <span />
          )}
          <button
            onClick={handleFlag}
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
