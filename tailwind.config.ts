import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { ink: "#152238", navy: "#0B1F3A", mist: "#F5F7FB" },
      boxShadow: { panel: "0 12px 30px rgba(15, 35, 65, 0.06)" },
    },
  },
  plugins: [],
};

export default config;
