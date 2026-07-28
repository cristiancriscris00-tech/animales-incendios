"use client";

import { useRef, useState } from "react";

interface Props {
  id: string;
  titulo: string;
  descripcion: string;
  /** Versión reducida para las tarjetas del listado. */
  compacto?: boolean;
}

/**
 * Compartir con el diálogo nativo del móvil (WhatsApp, Telegram…) y, en los
 * navegadores que no lo tienen, copiando el enlace al portapapeles.
 */
export default function CompartirAviso({
  id,
  titulo,
  descripcion,
  compacto = false,
}: Props) {
  const [copiado, setCopiado] = useState(false);
  const [urlManual, setUrlManual] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function compartir() {
    // El origen se lee del navegador para que el enlace funcione tanto en la
    // URL actual como en el dominio definitivo cuando esté conectado.
    const url = `${window.location.origin}/aviso/${id}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: titulo, text: descripcion, url });
      } catch {
        /* cancelar el diálogo no es un error */
      }
      return;
    }

    try {
      // Si la pestaña no tiene el foco, Chrome deja la escritura pendiente en
      // lugar de fallar: sin este límite el botón se queda mudo para siempre.
      await Promise.race([
        navigator.clipboard.writeText(url),
        new Promise((_, reject) => setTimeout(() => reject(new Error("lento")), 1500)),
      ]);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Nada de window.prompt: un diálogo bloquea la página entera. Se enseña
      // el enlace ya seleccionado para copiarlo a mano.
      setUrlManual(url);
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          compartir();
        }}
        className={`rounded-lg border-2 border-solaris-gold font-bold text-solaris-gold active:opacity-80 ${
          compacto ? "py-2.5 text-sm" : "py-3 text-base"
        }`}
      >
        {copiado
          ? "✓ Enlace copiado"
          : compacto
            ? "↗ Compartir"
            : "↗ Compartir este aviso"}
      </button>

      {urlManual && (
        <input
          ref={inputRef}
          readOnly
          value={urlManual}
          onClick={(e) => {
            e.stopPropagation();
            e.currentTarget.select();
          }}
          aria-label="Enlace del aviso para copiar"
          className="w-full rounded-lg border-2 border-solaris-gold/40 bg-white px-2 py-1.5 text-xs text-neutral-700"
        />
      )}
    </div>
  );
}
