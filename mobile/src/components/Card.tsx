import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { theme } from "../theme";

export interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | (ViewStyle | undefined)[];
  variant?: "elevated" | "outlined" | "flat";
  padding?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = "elevated",
  padding = 16,
}) => {
  return (
    <View
      style={[
        styles.base,
        variant === "elevated" && styles.elevated,
        variant === "outlined" && styles.outlined,
        variant === "flat" && styles.flat,
        { padding },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
  },
  elevated: {
    ...theme.elevation.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  outlined: {
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  flat: {
    backgroundColor: theme.colors.surfaceSubtle,
  },
});
