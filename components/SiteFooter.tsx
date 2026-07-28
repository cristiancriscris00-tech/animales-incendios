import { PawIcon } from "./PawIcon";

export default function SiteFooter() {
  return (
    <footer className="mt-12 bg-solaris-ink px-4 py-8 text-center">
      <PawIcon className="mx-auto h-7 w-7 text-solaris-gold" />
      <p className="pt-2 text-sm font-extrabold uppercase tracking-[-0.02em] text-solaris-cream">
        Solaris Rescate
      </p>
      <p className="pt-3 text-xs text-neutral-400">
        Plataforma gratuita. Los teléfonos solo se muestran si marcas la casilla.
      </p>
      <p className="pt-1 text-xs text-neutral-400">
        ¿Se te ocurre algo que falte? Escríbeme por TikTok:{" "}
        <a
          href="https://www.tiktok.com/@solaris01"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-solaris-gold underline-offset-2 hover:underline"
        >
          @solaris01
        </a>
      </p>
    </footer>
  );
}
