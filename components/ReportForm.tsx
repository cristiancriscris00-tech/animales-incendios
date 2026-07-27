"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import { compressImage } from "@/lib/compressImage";
import { reverseGeocode } from "@/lib/nominatim";
import type { Especie, Tipo } from "@/lib/types";

const MapPicker = dynamic(() => import("./MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full animate-pulse rounded-lg bg-neutral-200" />
  ),
});

interface Props {
  tipoInicial: Tipo;
  onPublished: () => void;
  onClose: () => void;
}

export default function ReportForm({ tipoInicial, onPublished, onClose }: Props) {
  const [tipo, setTipo] = useState<Tipo>(tipoInicial);
  const [especie, setEspecie] = useState<Especie>("perro");
  const [descripcion, setDescripcion] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState("");
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [provincia, setProvincia] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [telefono, setTelefono] = useState("");
  const [tieneChip, setTieneChip] = useState<"si" | "no" | "nose">("nose");
  const [aceptaPublico, setAceptaPublico] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const geocodeSeq = useRef(0);

  useEffect(() => {
    setTipo(tipoInicial);
  }, [tipoInicial]);

  // Autocompletar provincia/municipio al fijar la ubicación
  useEffect(() => {
    if (!pos) return;
    const seq = ++geocodeSeq.current;
    reverseGeocode(pos.lat, pos.lng).then((r) => {
      if (seq !== geocodeSeq.current) return;
      if (r.provincia) setProvincia(r.provincia);
      if (r.municipio) setMunicipio(r.municipio);
    });
  }, [pos]);

  function onFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setFoto(file);
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setFotoPreview(file ? URL.createObjectURL(file) : "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!pos) {
      setError("Falta la ubicación: toca el punto en el mapa o usa tu ubicación.");
      return;
    }
    if (!/^[+\d][\d\s]{7,15}$/.test(telefono.trim())) {
      setError("Escribe un teléfono válido (mínimo 9 dígitos).");
      return;
    }
    if (!aceptaPublico) {
      setError("Tienes que aceptar que tu teléfono será público.");
      return;
    }

    setEnviando(true);
    try {
      let fotoUrl: string | null = null;
      if (foto) {
        const blob = await compressImage(foto);
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
        const { error: upErr } = await supabase.storage
          .from("fotos")
          .upload(path, blob, { contentType: "image/jpeg" });
        if (upErr) throw upErr;
        fotoUrl = supabase.storage.from("fotos").getPublicUrl(path).data.publicUrl;
      }

      const { error: insErr } = await supabase.from("reports").insert({
        tipo,
        especie,
        descripcion: descripcion.trim(),
        foto_url: fotoUrl,
        lat: pos.lat,
        lng: pos.lng,
        provincia: provincia.trim(),
        municipio: municipio.trim(),
        telefono: telefono.trim(),
        tiene_chip: tipo === "encontrado" && tieneChip !== "nose" ? tieneChip === "si" : null,
      });
      if (insErr) throw insErr;

      onPublished();
    } catch (err) {
      console.error(err);
      setError("No se pudo publicar. Revisa la conexión e inténtalo otra vez.");
    } finally {
      setEnviando(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border-2 border-neutral-300 px-3 py-3 text-base focus:border-neutral-900 focus:outline-none";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Publicar aviso</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-3 py-2 text-base font-semibold text-neutral-600"
        >
          ✕ Cerrar
        </button>
      </div>

      {/* Tipo */}
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo de aviso">
        {(["perdido", "encontrado"] as Tipo[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTipo(t)}
            aria-pressed={tipo === t}
            className={`rounded-lg border-2 px-3 py-3 text-base font-bold uppercase ${
              tipo === t
                ? t === "perdido"
                  ? "border-perdido bg-perdido text-white"
                  : "border-encontrado bg-encontrado text-white"
                : "border-neutral-300 bg-white text-neutral-700"
            }`}
          >
            {t === "perdido" ? "Lo he perdido" : "Lo he encontrado"}
          </button>
        ))}
      </div>

      {/* Especie */}
      <div>
        <label className="mb-1 block font-semibold">Animal</label>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["perro", "🐕 Perro"],
              ["gato", "🐈 Gato"],
              ["otro", "🐾 Otro"],
            ] as [Especie, string][]
          ).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setEspecie(val)}
              aria-pressed={especie === val}
              className={`rounded-lg border-2 px-2 py-3 text-base font-semibold ${
                especie === val
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 bg-white text-neutral-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Foto */}
      <div>
        <label className="mb-1 block font-semibold">
          Foto <span className="font-normal text-neutral-500">(recomendada)</span>
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={onFotoChange}
          className="block w-full text-base file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-900 file:px-4 file:py-3 file:font-semibold file:text-white"
        />
        {fotoPreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fotoPreview}
            alt="Vista previa de la foto"
            className="mt-2 h-40 rounded-lg object-cover"
          />
        )}
      </div>

      {/* Ubicación */}
      <div>
        <label className="mb-1 block font-semibold">
          ¿Dónde se perdió o se encontró?
        </label>
        <MapPicker value={pos} onChange={setPos} />
      </div>

      {/* Provincia y municipio */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="provincia" className="mb-1 block font-semibold">
            Provincia
          </label>
          <input
            id="provincia"
            value={provincia}
            onChange={(e) => setProvincia(e.target.value)}
            className={inputClass}
            placeholder="Se rellena sola"
          />
        </div>
        <div>
          <label htmlFor="municipio" className="mb-1 block font-semibold">
            Municipio
          </label>
          <input
            id="municipio"
            value={municipio}
            onChange={(e) => setMunicipio(e.target.value)}
            className={inputClass}
            placeholder="Se rellena solo"
          />
        </div>
      </div>

      {/* Descripción */}
      <div>
        <label htmlFor="descripcion" className="mb-1 block font-semibold">
          Descripción
        </label>
        <textarea
          id="descripcion"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value.slice(0, 300))}
          required
          rows={3}
          className={inputClass}
          placeholder="Raza, color, collar, dónde se vio por última vez…"
        />
        <p className="mt-1 text-right text-sm text-neutral-500">
          {descripcion.length}/300
        </p>
      </div>

      {/* Chip (solo encontrado) */}
      {tipo === "encontrado" && (
        <div>
          <label className="mb-1 block font-semibold">¿Lleva microchip?</label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["si", "Sí"],
                ["no", "No"],
                ["nose", "No lo sé"],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setTieneChip(val)}
                aria-pressed={tieneChip === val}
                className={`rounded-lg border-2 px-2 py-3 text-base font-semibold ${
                  tieneChip === val
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 bg-white text-neutral-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-1 text-sm text-neutral-600">
            Cualquier veterinario o protectora puede leer el chip gratis.
          </p>
        </div>
      )}

      {/* Teléfono */}
      <div>
        <label htmlFor="telefono" className="mb-1 block font-semibold">
          Teléfono de contacto
        </label>
        <input
          id="telefono"
          type="tel"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          required
          className={inputClass}
          placeholder="600 000 000"
        />
      </div>

      <label className="flex items-start gap-3 rounded-lg border-2 border-neutral-300 p-3">
        <input
          type="checkbox"
          checked={aceptaPublico}
          onChange={(e) => setAceptaPublico(e.target.checked)}
          required
          className="mt-1 h-5 w-5"
        />
        <span className="text-base">
          Entiendo que mi teléfono será <strong>público</strong> para que puedan
          contactarme.
        </span>
      </label>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 font-medium text-perdido">{error}</p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className={`rounded-lg px-4 py-4 text-lg font-bold text-white disabled:opacity-60 ${
          tipo === "perdido" ? "bg-perdido" : "bg-encontrado"
        }`}
      >
        {enviando ? "Publicando…" : "Publicar aviso"}
      </button>
    </form>
  );
}
