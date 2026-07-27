"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import type { Especie, Report, Tipo } from "@/lib/types";
import ReportForm from "@/components/ReportForm";
import ReportCard from "@/components/ReportCard";

const ReportsMap = dynamic(() => import("@/components/ReportsMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[55vh] min-h-[320px] w-full animate-pulse bg-neutral-200" />
  ),
});

type FiltroTipo = "todos" | Tipo;
type FiltroEspecie = "todas" | Especie;

const FLAGS_KEY = "flags-enviados";

export default function Home() {
  const [reports, setReports] = useState<Report[]>([]);
  const [cargando, setCargando] = useState(true);
  const [formTipo, setFormTipo] = useState<Tipo | null>(null);
  const [avisoPublicado, setAvisoPublicado] = useState(false);

  const [fTipo, setFTipo] = useState<FiltroTipo>("todos");
  const [fEspecie, setFEspecie] = useState<FiltroEspecie>("todas");
  const [fProvincia, setFProvincia] = useState("todas");

  const cargar = useCallback(async () => {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("oculto", false)
      .order("created_at", { ascending: false })
      .limit(500);
    if (!error && data) setReports(data as Report[]);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
    const id = setInterval(cargar, 60_000);
    return () => clearInterval(id);
  }, [cargar]);

  const provincias = useMemo(
    () =>
      Array.from(new Set(reports.map((r) => r.provincia).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b, "es")
      ),
    [reports]
  );

  const filtrados = useMemo(
    () =>
      reports.filter(
        (r) =>
          (fTipo === "todos" || r.tipo === fTipo) &&
          (fEspecie === "todas" || r.especie === fEspecie) &&
          (fProvincia === "todas" || r.provincia === fProvincia)
      ),
    [reports, fTipo, fEspecie, fProvincia]
  );

  const activos = useMemo(() => filtrados.filter((r) => !r.resuelto), [filtrados]);

  async function marcarResuelto(id: string) {
    await supabase.from("reports").update({ resuelto: true }).eq("id", id);
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, resuelto: true } : r))
    );
  }

  async function reportarContenido(id: string) {
    // Evita flags repetidos desde el mismo navegador
    try {
      const enviados: string[] = JSON.parse(localStorage.getItem(FLAGS_KEY) ?? "[]");
      if (enviados.includes(id)) return;
      localStorage.setItem(FLAGS_KEY, JSON.stringify([...enviados, id]));
    } catch {
      /* localStorage no disponible: seguimos igualmente */
    }
    await supabase.from("flags").insert({ report_id: id });
    cargar();
  }

  const selectClass =
    "rounded-lg border-2 border-neutral-300 bg-white px-2 py-2 text-sm font-semibold";

  return (
    <main className="mx-auto max-w-3xl pb-16">
      {/* Aviso oficial */}
      <div className="bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-900">
        Esta web <strong>NO</strong> es un servicio oficial de emergencias. Para
        emergencias llama al <a href="tel:112" className="font-bold underline">112</a>.
        Para incendios activos, viento y carreteras cortadas consulta{" "}
        <a
          href="https://incendiosespaña.es"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold underline"
        >
          incendiosespaña.es
        </a>
      </div>

      {/* Cabecera */}
      <header className="px-4 pb-3 pt-5">
        <h1 className="text-2xl font-extrabold leading-tight">
          🐾 Animales perdidos y encontrados
        </h1>
        <p className="text-neutral-600">
          Incendios forestales en España · sin registro, gratis
        </p>
      </header>

      {/* Botones principales */}
      <div className="grid grid-cols-2 gap-3 px-4 pb-4">
        <button
          onClick={() => {
            setFormTipo("perdido");
            setAvisoPublicado(false);
          }}
          className="rounded-xl bg-perdido px-3 py-4 text-lg font-bold text-white active:opacity-90"
        >
          He perdido<br />un animal
        </button>
        <button
          onClick={() => {
            setFormTipo("encontrado");
            setAvisoPublicado(false);
          }}
          className="rounded-xl bg-encontrado px-3 py-4 text-lg font-bold text-white active:opacity-90"
        >
          He encontrado<br />un animal
        </button>
      </div>

      {avisoPublicado && (
        <p className="mx-4 mb-4 rounded-lg bg-green-100 p-3 font-semibold text-green-900">
          ✓ Aviso publicado. Ya está visible en el mapa.
        </p>
      )}

      {!supabaseConfigured && (
        <p className="mx-4 mb-4 rounded-lg bg-amber-100 p-3 text-sm text-amber-900">
          ⚠️ Falta configurar Supabase: copia <code>.env.local.example</code> a{" "}
          <code>.env.local</code> y rellena las claves.
        </p>
      )}

      {/* Formulario */}
      {formTipo && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-2 sm:p-6">
          <div className="mx-auto max-w-xl rounded-xl bg-white p-4">
            <ReportForm
              tipoInicial={formTipo}
              onClose={() => setFormTipo(null)}
              onPublished={() => {
                setFormTipo(null);
                setAvisoPublicado(true);
                cargar();
              }}
            />
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="sticky top-0 z-20 flex flex-wrap gap-2 border-y border-neutral-200 bg-white px-4 py-2">
        <select
          value={fTipo}
          onChange={(e) => setFTipo(e.target.value as FiltroTipo)}
          className={selectClass}
          aria-label="Filtrar por tipo"
        >
          <option value="todos">Perdidos y encontrados</option>
          <option value="perdido">Solo perdidos</option>
          <option value="encontrado">Solo encontrados</option>
        </select>
        <select
          value={fEspecie}
          onChange={(e) => setFEspecie(e.target.value as FiltroEspecie)}
          className={selectClass}
          aria-label="Filtrar por especie"
        >
          <option value="todas">Todas las especies</option>
          <option value="perro">Perros</option>
          <option value="gato">Gatos</option>
          <option value="otro">Otros</option>
        </select>
        <select
          value={fProvincia}
          onChange={(e) => setFProvincia(e.target.value)}
          className={selectClass}
          aria-label="Filtrar por provincia"
        >
          <option value="todas">Todas las provincias</option>
          {provincias.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* Mapa: solo avisos activos */}
      <ReportsMap reports={activos} />
      <p className="flex gap-4 px-4 py-2 text-sm text-neutral-600">
        <span>
          <span className="mr-1 inline-block h-3 w-3 rounded-full bg-perdido" />
          Perdido
        </span>
        <span>
          <span className="mr-1 inline-block h-3 w-3 rounded-full bg-encontrado" />
          Encontrado
        </span>
      </p>

      {/* Listado */}
      <section className="px-4 pt-2">
        <h2 className="pb-3 text-lg font-bold">
          Últimos avisos{" "}
          <span className="font-normal text-neutral-500">({filtrados.length})</span>
        </h2>
        {cargando ? (
          <p className="py-8 text-center text-neutral-500">Cargando avisos…</p>
        ) : filtrados.length === 0 ? (
          <p className="py-8 text-center text-neutral-500">
            Todavía no hay avisos con estos filtros. Sé la primera persona en
            publicar uno.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtrados.map((r) => (
              <ReportCard
                key={r.id}
                report={r}
                onResolve={marcarResuelto}
                onFlag={reportarContenido}
              />
            ))}
          </div>
        )}
      </section>

      <footer className="px-4 pt-10 text-center text-xs text-neutral-400">
        Hecho por voluntarios. Los datos los publica cada persona bajo su
        responsabilidad.
      </footer>
    </main>
  );
}
