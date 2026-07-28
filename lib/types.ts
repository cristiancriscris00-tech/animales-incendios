export type Tipo = "perdido" | "encontrado" | "herido" | "ayuda";
export type Especie = "perro" | "gato" | "otro";
export type Subtipo = "acogida" | "transporte" | "veterinario" | "comida_agua";
export type Urgencia = "alta" | "media" | "baja";

export interface Report {
  id: string;
  tipo: Tipo;
  especie: Especie | null; // null en los avisos de tipo 'ayuda'
  subtipo: Subtipo | null; // solo en los avisos de tipo 'ayuda'
  urgencia: Urgencia | null; // solo en los avisos de tipo 'herido'
  descripcion: string;
  foto_url: string | null;
  lat: number;
  lng: number;
  provincia: string;
  municipio: string;
  telefono: string;
  tiene_chip: boolean | null;
  resuelto: boolean;
  oculto: boolean;
  created_at: string;
}

export const SUBTIPOS: Subtipo[] = [
  "acogida",
  "transporte",
  "veterinario",
  "comida_agua",
];

export const SUBTIPO_LABEL: Record<Subtipo, string> = {
  acogida: "Acogida temporal",
  transporte: "Transporte",
  veterinario: "Veterinario voluntario",
  comida_agua: "Comida y agua",
};

export const SUBTIPO_ICONO: Record<Subtipo, string> = {
  acogida: "🏠",
  transporte: "🚐",
  veterinario: "🩺",
  comida_agua: "💧",
};

export const URGENCIAS: Urgencia[] = ["alta", "media", "baja"];

export const URGENCIA_LABEL: Record<Urgencia, string> = {
  alta: "Urgencia alta",
  media: "Urgencia media",
  baja: "Urgencia baja",
};

/** Ayuda a elegir sin pensar: qué significa cada nivel */
export const URGENCIA_PISTA: Record<Urgencia, string> = {
  alta: "Peligro inmediato",
  media: "Herido, estable",
  baja: "Puede esperar",
};

/** Color de marca por tipo de aviso. Debe coincidir con tailwind.config.ts */
export const COLOR_TIPO: Record<Tipo, string> = {
  perdido: "#C81E1E",
  encontrado: "#0E7A46",
  herido: "#C2410C",
  ayuda: "#1D4ED8",
};
