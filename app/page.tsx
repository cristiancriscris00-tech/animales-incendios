"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import {
  SUBTIPOS,
  SUBTIPO_LABEL,
  type Especie,
  type Report,
  type Subtipo,
  type Tipo,
} from "@/lib/types";
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
type FiltroSubtipo = "todos" | Subtipo;

const FLAGS_KEY = "flags-enviados";

export default function Home() {
  const [reports, setReports] = useState<Report[]>([]);
  const [cargando, setCargando] = useState(true);
  const [formTipo, setFormTipo] = useState<Tipo | null>(null);
  const [avisoPublicado, setAvisoPublicado] = useState(false);

  const [fTipo, setFTipo] = useState<FiltroTipo>("todos");
  const [fEspecie, setFEspecie] = useState<FiltroEspecie>("todas");
  const [fSubtipo, setFSubtipo] = useState<FiltroSubtipo>("todos");
  const [fProvincia, setFProvincia] = useState("todas");
  const [soloUrgentes, setSoloUrgentes] = useState(false);

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

  // Los filtros de especie y de tipo de ayuda se excluyen entre sí
  function cambiarTipo(nuevo: FiltroTipo) {
    setFTipo(nuevo);
    setSoloUrgentes(false);
    if (nuevo === "ayuda") setFEspecie("todas");
    else setFSubtipo("todos");
  }

  function alternarUrgentes() {
    setSoloUrgentes((antes) => {
      if (!antes) setFTipo("todos");
      return !antes;
    });
  }

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
          (fSubtipo === "todos" || r.subtipo === fSubtipo) &&
          (fProvincia === "todas" || r.provincia === fProvincia) &&
          (!soloUrgentes ||
            (r.tipo === "herido" && r.urgencia === "alta" && !r.resuelto))
      ),
    [reports, fTipo, fEspecie, fSubtipo, fProvincia, soloUrgentes]
  );

  const urgentes = useMemo(
    () =>
      reports.filter(
        (r) => r.tipo === "herido" && r.urgencia === "alta" && !r.resuelto
      ).length,
    [reports]
  );

  const activos = useMemo(() => filtrados.filter((r) => !r.resuelto), [filtrados]);

  // La urgencia solo ordena cuando se están viendo animales heridos. El
  // listado general es cronológico a propósito: si los urgentes encabezaran
  // toda la web, un aviso de perdido quedaría sepultado y "alta" acabaría
  // marcándose siempre. Los urgentes ganan visibilidad con el contador de
  // arriba, no robando el sitio a los demás.
  const ordenados = useMemo(() => {
    const viendoHeridos = fTipo === "herido" || soloUrgentes;
    if (!viendoHeridos) return filtrados; // ya viene por fecha desde Supabase

    const peso = (r: Report) => {
      if (r.resuelto) return 3;
      if (r.urgencia === "alta") return 0;
      if (r.urgencia === "media") return 1;
      return 2;
    };
    return [...filtrados].sort(
      (a, b) => peso(a) - peso(b) || b.created_at.localeCompare(a.created_at)
    );
  }, [filtrados, fTipo, soloUrgentes]);

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

  function abrirForm(tipo: Tipo) {
    setFormTipo(tipo);
    setAvisoPublicado(false);
  }

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
          onClick={() => abrirForm("perdido")}
          className="rounded-xl bg-perdido px-3 py-4 text-lg font-bold text-white active:opacity-90"
        >
          He perdido<br />un animal
        </button>
        <button
          onClick={() => abrirForm("encontrado")}
          className="rounded-xl bg-encontrado px-3 py-4 text-lg font-bold text-white active:opacity-90"
        >
          He encontrado<br />un animal
        </button>
        <button
          onClick={() => abrirForm("herido")}
          className="col-span-2 rounded-xl bg-herido px-3 py-3 text-lg font-bold text-white active:opacity-90"
        >
          🚨 Animal herido o atrapado
        </button>
        <button
          onClick={() => abrirForm("ayuda")}
          className="col-span-2 rounded-xl bg-ayuda px-3 py-3 text-lg font-bold text-white active:opacity-90"
        >
          Quiero ayudar
          <span className="block text-sm font-normal opacity-90">
            Acogida, transporte, veterinario, comida y agua
          </span>
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

      {/* Contador de urgencias: da visibilidad a los casos graves sin
          reordenar el listado general */}
      {urgentes > 0 && (
        <div className="px-4 pb-3">
          <button
            onClick={alternarUrgentes}
            aria-pressed={soloUrgentes}
            className={`flex w-full items-center justify-between gap-3 rounded-lg border-2 border-herido px-3 py-2 text-left ${
              soloUrgentes ? "bg-herido text-white" : "bg-orange-50 text-herido"
            }`}
          >
            <span className="font-bold">
              🚨 {urgentes}{" "}
              {urgentes === 1
                ? "animal en urgencia alta"
                : "animales en urgencia alta"}
            </span>
            <span className="shrink-0 text-sm font-semibold underline">
              {soloUrgentes ? "Ver todo" : "Ver solo estos"}
            </span>
          </button>
        </div>
      )}

      {/* Filtros */}
      <div className="sticky top-0 z-20 flex flex-wrap gap-2 border-y border-neutral-200 bg-white px-4 py-2">
        <select
          value={fTipo}
          onChange={(e) => cambiarTipo(e.target.value as FiltroTipo)}
          className={selectClass}
          aria-label="Filtrar por tipo"
        >
          <option value="todos">Todos los avisos</option>
          <option value="perdido">Solo perdidos</option>
          <option value="encontrado">Solo encontrados</option>
          <option value="herido">Solo heridos o atrapados</option>
          <option value="ayuda">Solo quien ofrece ayuda</option>
        </select>

        {fTipo === "ayuda" ? (
          <select
            value={fSubtipo}
            onChange={(e) => setFSubtipo(e.target.value as FiltroSubtipo)}
            className={selectClass}
            aria-label="Filtrar por tipo de ayuda"
          >
            <option value="todos">Toda la ayuda</option>
            {SUBTIPOS.map((s) => (
              <option key={s} value={s}>
                {SUBTIPO_LABEL[s]}
              </option>
            ))}
          </select>
        ) : (
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
        )}

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
      <p className="flex flex-wrap gap-4 px-4 py-2 text-sm text-neutral-600">
        <span>
          <span className="mr-1 inline-block h-3 w-3 rounded-full bg-perdido" />
          Perdido
        </span>
        <span>
          <span className="mr-1 inline-block h-3 w-3 rounded-full bg-encontrado" />
          Encontrado
        </span>
        <span>
          <span className="mr-1 inline-block h-3 w-3 rounded-full bg-herido" />
          Herido o atrapado
        </span>
        <span>
          <span className="mr-1 inline-block h-3 w-3 rounded-full bg-ayuda" />
          Ofrece ayuda
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
            {ordenados.map((r) => (
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
