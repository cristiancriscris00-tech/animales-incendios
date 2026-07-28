"use client";

import type { Tipo } from "@/lib/types";

interface Props {
  onElegir: (tipo: Tipo) => void;
  /** Versión reducida para el estado vacío, donde no son el elemento principal. */
  compacto?: boolean;
}

export default function TipoBotones({ onElegir, compacto = false }: Props) {
  const base = compacto
    ? "rounded-lg px-3 py-2.5 text-sm font-bold text-white active:opacity-90"
    : "rounded-xl px-3 py-4 text-lg font-bold text-white active:opacity-90";
  const ancho = compacto
    ? "col-span-2 rounded-lg px-3 py-2.5 text-sm font-bold text-white active:opacity-90"
    : "col-span-2 rounded-xl px-3 py-3 text-lg font-bold text-white active:opacity-90";

  return (
    <div className="grid grid-cols-2 gap-3">
      <button onClick={() => onElegir("perdido")} className={`${base} bg-perdido`}>
        He perdido
        <br />
        un animal
      </button>
      <button
        onClick={() => onElegir("encontrado")}
        className={`${base} bg-encontrado`}
      >
        He encontrado
        <br />
        un animal
      </button>
      <button onClick={() => onElegir("herido")} className={`${ancho} bg-herido`}>
        🚨 Animal herido o atrapado
      </button>
      <button onClick={() => onElegir("ayuda")} className={`${ancho} bg-ayuda`}>
        Quiero ayudar
        {!compacto && (
          <span className="block text-sm font-normal opacity-90">
            Acogida, transporte, veterinario, comida y agua
          </span>
        )}
      </button>
    </div>
  );
}
