"use client";

import { useState } from "react";
import { PawIcon } from "./PawIcon";

export default function SiteHeader() {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 h-[60px] border-b border-solaris-gold/25 bg-solaris-ink md:h-[78px]">
        <div className="flex h-full items-center gap-3 px-5">
          <PawIcon className="h-[30px] w-[30px] shrink-0 text-solaris-gold md:h-10 md:w-10" />
          <span className="flex flex-col text-[15px] font-extrabold uppercase leading-[0.9] tracking-[-0.02em] md:text-xl">
            <span className="text-solaris-cream">Solaris</span>
            <span className="text-solaris-gold">Rescate</span>
          </span>
        </div>
      </header>

      {/* Franja de explicación: sin botón de cerrar, es la primera vez que
          alguien llega desde TikTok y tiene que entender la web sin leer nada más */}
      <div className="border-b border-solaris-gold/20 bg-solaris-gold/[0.08]">
        <div className="flex items-center justify-between gap-2 px-4 py-1.5 sm:gap-3">
          {/* En móvil solo caben ~195 px de texto, así que la frase larga se
              sustituye por una corta en vez de romperse en tres líneas y
              empujar los botones fuera de la primera pantalla. */}
          <p className="min-w-0 flex-1 truncate text-center text-[12px] text-neutral-700 sm:whitespace-normal sm:text-[13px]">
            <span className="sm:hidden">Mapa de animales en emergencias.</span>
            <span className="hidden sm:inline">
              Mapa colaborativo de animales perdidos, encontrados o heridos en
              emergencias. Publica un aviso en 30 segundos.
            </span>
          </p>
          <button
            onClick={() => setAbierto((v) => !v)}
            aria-expanded={abierto}
            aria-controls="como-funciona"
            className="shrink-0 text-[12px] font-semibold text-solaris-gold underline-offset-2 hover:underline sm:text-[13px]"
          >
            ¿Cómo funciona?
          </button>
        </div>

        {abierto && (
          <ol
            id="como-funciona"
            className="list-decimal space-y-1 border-t border-solaris-gold/20 px-8 py-3 text-[13px] text-neutral-700 marker:font-bold marker:text-solaris-gold"
          >
            <li>Pulsa el tipo de aviso que necesitas.</li>
            <li>Marca el punto en el mapa, añade foto y descripción.</li>
            <li>Tu teléfono solo se muestra si marcas la casilla.</li>
          </ol>
        )}
      </div>
    </>
  );
}
