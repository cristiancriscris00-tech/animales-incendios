export type Tipo = "perdido" | "encontrado";
export type Especie = "perro" | "gato" | "otro";

export interface Report {
  id: string;
  tipo: Tipo;
  especie: Especie;
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
