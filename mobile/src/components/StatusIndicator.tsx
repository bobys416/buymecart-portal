import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { theme } from "../theme";

export interface StatusIndicatorProps {
  status: "success" | "pending" | "failed" | "operational" | "degraded" | "down" | "flagged";
  label?: string;
  style?: ViewStyle;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  style,
}) => {
  const getColor = (): string => {
    switch (status) {
      case "success":
      case "operational":
        return theme.colors.success;
      case "pending":
      case "degraded":
        return theme.colors.warning;
      case "failed":
      case "down":
      case "flagged":
        return theme.colors.danger;
    }
  };

  const color = getColor();

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      {label && <Text style={[styles.label, { color }]}>{label}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "700",
    textTransform: "capitalize",
  },
});
