/**
 * BuyMeCart + IBNK Multi-Platform Unified Ecosystem
 * Shared Design Tokens (Web, Android, iOS)
 */

export const colors = {
  // Brand Primary (Midnight Navy)
  midnight: {
    DEFAULT: "#0B1530",
    light: "#142040",
    dark: "#080F24",
    surface: "#0B1530",
  },
  navy: {
    DEFAULT: "#0B1530",
    light: "#142040",
    dark: "#080F24",
    surface: "#0B1530",
  },
  // Primary Accent (Electric Teal)
  teal: {
    DEFAULT: "#12C8B4",
    light: "#34E8D5",
    dark: "#0FA897",
    subtle: "#EAFBF8",
  },
  sky: {
    DEFAULT: "#0284C7",
    light: "#38BDF8",
    dark: "#0369A1",
    subtle: "#E0F2FE",
  },
  emerald: {
    DEFAULT: "#059669",
    light: "#34D399",
    dark: "#047857",
    subtle: "#ECFDF5",
  },
  rose: {
    DEFAULT: "#E11D48",
    light: "#FB7185",
    dark: "#BE123C",
    subtle: "#FFF1F2",
  },
  amber: {
    DEFAULT: "#D97706",
    light: "#FBBF24",
    dark: "#B45309",
    subtle: "#FFFBEB",
  },
  purple: {
    DEFAULT: "#7C3AED",
    light: "#A78BFA",
    dark: "#6D28D9",
    subtle: "#F5F3FF",
  },
  // Neutrals / Slate Scale
  slate: {
    50: "#F8FAFC",
    100: "#F1F5F9",
    200: "#E2E8F0",
    300: "#CBD5E1",
    400: "#94A3B8",
    500: "#64748B",
    600: "#475569",
    700: "#334155",
    800: "#1E293B",
    900: "#0F172A",
  },
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
};

export const typography = {
  fontFamily: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
  },
  fontWeight: {
    normal: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
    extrabold: "800" as const,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
};

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 24,
  full: 9999,
};

export const elevation = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  card: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  panel: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  modal: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
};

export const designTokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  elevation,
};

export default designTokens;
