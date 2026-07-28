import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        perdido: "#C81E1E",
        encontrado: "#0E7A46",
        herido: "#C2410C",
        ayuda: "#1D4ED8",
      },
    },
  },
  plugins: [],
};
export default config;
