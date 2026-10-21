import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { theme } from "../theme";

export interface BadgeProps {
  label: string;
  variant?: "navy" | "sky" | "emerald" | "rose" | "amber" | "purple" | "neutral" | "teal";
  size?: "sm" | "md";
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = "navy",
  size = "md",
  style,
}) => {
  const getBadgeStyle = (): ViewStyle[] => {
    const list: ViewStyle[] = [styles.base];
    if (size === "sm") list.push(styles.smContainer);
    if (size === "md") list.push(styles.mdContainer);

    switch (variant) {
      case "navy":
        list.push({ backgroundColor: "#0F172A" });
        break;
      case "sky":
        list.push({ backgroundColor: theme.colors.accentSubtle });
        break;
      case "emerald":
        list.push({ backgroundColor: theme.colors.successSubtle });
        break;
      case "rose":
        list.push({ backgroundColor: theme.colors.dangerSubtle });
        break;
      case "amber":
        list.push({ backgroundColor: theme.colors.warningSubtle });
        break;
      case "purple":
        list.push({ backgroundColor: theme.colors.aiPurpleSubtle });
        break;
      case "teal":
        list.push({ backgroundColor: theme.colors.tealSubtle });
        break;
      case "neutral":
        list.push({ backgroundColor: theme.colors.surfaceSubtle });
        break;
    }

    if (style) list.push(style);
    return list;
  };

  const getTextStyle = (): TextStyle[] => {
    const list: TextStyle[] = [styles.text];
    if (size === "sm") list.push(styles.smText);
    if (size === "md") list.push(styles.mdText);

    switch (variant) {
      case "navy":
        list.push({ color: "#FFFFFF" });
        break;
      case "sky":
        list.push({ color: theme.colors.accent });
        break;
      case "emerald":
        list.push({ color: theme.colors.success });
        break;
      case "rose":
        list.push({ color: theme.colors.danger });
        break;
      case "amber":
        list.push({ color: theme.colors.warning });
        break;
      case "purple":
        list.push({ color: theme.colors.aiPurple });
        break;
      case "teal":
        list.push({ color: theme.colors.tealDark });
        break;
      case "neutral":
        list.push({ color: theme.colors.textSecondary });
        break;
    }

    return list;
  };

  return (
    <View style={getBadgeStyle()}>
      <Text style={getTextStyle()}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.full,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
  },
  smContainer: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  mdContainer: {
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  text: {
    fontWeight: "700",
  },
  smText: {
    fontSize: 10,
  },
  mdText: {
    fontSize: 11,
  },
});
