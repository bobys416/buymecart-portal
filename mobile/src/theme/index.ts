import { colors, typography, spacing, borderRadius, elevation } from "@buymecart/design-tokens";

export const theme = {
  colors: {
    // Brand Core
    primary: "#101C32", // Midnight Navy
    primaryLight: "#1D2D4F",
    primaryDark: "#0B1324",
    teal: "#16B8A6", // Electric Teal
    tealLight: "#2DD4BF",
    tealDark: "#0F766E",
    tealSubtle: "#F0FDFA",
    accent: "#16B8A6", // Electric Teal primary accent
    accentLight: "#2DD4BF",
    accentSubtle: "#F0FDFA",
    success: colors.emerald.DEFAULT,
    successSubtle: colors.emerald.subtle,
    danger: colors.rose.DEFAULT,
    dangerSubtle: colors.rose.subtle,
    warning: colors.amber.DEFAULT,
    warningSubtle: colors.amber.subtle,
    aiPurple: colors.purple.DEFAULT,
    aiPurpleSubtle: colors.purple.subtle,
    background: "#F5F7FA", // Cloud White
    surface: "#FFFFFF",
    surfaceSubtle: "#EAEFF5",
    border: "#CBD5E1",
    borderLight: "#E2E8F0",
    textPrimary: "#101C32",
    textSecondary: "#475569",
    textMuted: "#94A3B8",
    white: "#FFFFFF",
    black: "#000000",
  },
  typography,
  spacing,
  borderRadius,
  elevation,
};

export type AppTheme = typeof theme;
