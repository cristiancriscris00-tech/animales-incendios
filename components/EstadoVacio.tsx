"use client";

import type { Tipo } from "@/lib/types";
import { PawIcon } from "./PawIcon";
import TipoBotones from "./TipoBotones";

interface Props {
  onElegir: (tipo: Tipo) => void;
  /** Cuando hay filtros puestos, el vacío no significa "no hay nada". */
  porFiltros?: boolean;
  onLimpiarFiltros?: () => void;
}

export default function EstadoVacio({
  onElegir,
  porFiltros = false,
  onLimpiarFiltros,
}: Props) {
  return (
    <div className="mx-auto max-w-md rounded-xl border-2 border-solaris-gold/30 bg-solaris-gold/[0.06] p-5 text-center">
      <PawIcon className="mx-auto h-9 w-9 text-solaris-gold" />
      {porFiltros ? (
        <>
          <p className="pt-3 text-base text-neutral-700">
            No hay avisos con estos filtros. Prueba a quitarlos para ver todo lo
            que hay publicado.
          </p>
          {onLimpiarFiltros && (
            <button
              onClick={onLimpiarFiltros}
              className="mt-3 rounded-lg border-2 border-solaris-gold px-4 py-2 text-sm font-bold text-solaris-gold"
            >
              Quitar filtros
            </button>
          )}
        </>
      ) : (
        <p className="pt-3 text-base text-neutral-700">
          Todavía no hay avisos en esta zona. Si has perdido o encontrado un
          animal, publica el primero — aparecerá aquí y en el mapa al instante.
        </p>
      )}
      <div className="pt-4">
        <TipoBotones onElegir={onElegir} compacto />
      </div>
    </div>
  );
}
