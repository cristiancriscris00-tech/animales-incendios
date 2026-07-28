import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Colores de información: identifican el tipo de aviso. No son
        // decorativos, así que la marca no los toca.
        perdido: "#C81E1E",
        encontrado: "#0E7A46",
        herido: "#C2410C",
        ayuda: "#1D4ED8",
        // Marca: solo cabecera, pie, enlaces y bordes.
        "solaris-gold": "#CB982F",
        "solaris-gold-light": "#F0D080",
        "solaris-ink": "#0B0A09",
        "solaris-cream": "#F2EEE6",
      },
    },
  },
  plugins: [],
};
export default config;
