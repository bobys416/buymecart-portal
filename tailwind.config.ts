import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./packages/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        midnight: {
          DEFAULT: "#0B1530",
          50: "#1A274E",
          100: "#142040",
          200: "#0F1A35",
          900: "#0B1530",
        },
        teal: {
          DEFAULT: "#12C8B4",
          50: "#EAFBF8",
          100: "#D1F7F2",
          200: "#A3EFE5",
          400: "#12C8B4",
          500: "#0FA897",
          600: "#0C887A",
          700: "#09685E",
        },
        workspace: "#F4F7FB",
        surface: "#FFFFFF",
        primaryText: "#142033",
        secondaryText: "#64748B",
        borderSubtle: "#E2E8F0",
        navy: "#0B1530",
        ink: "#142033",
        mist: "#F4F7FB",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(11, 21, 48, 0.04), 0 1px 2px -1px rgba(11, 21, 48, 0.04)",
        panel: "0 4px 20px -2px rgba(11, 21, 48, 0.05)",
        elevated: "0 10px 25px -3px rgba(11, 21, 48, 0.08)",
        dropdown: "0 10px 38px -10px rgba(11, 21, 48, 0.2), 0 10px 20px -15px rgba(11, 21, 48, 0.15)",
      },
    },
  },
  plugins: [],
};

export default config;
