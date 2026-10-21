import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { theme } from "../theme";

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const getContainerStyle = (): ViewStyle[] => {
    const list: ViewStyle[] = [styles.base];

    // Size
    if (size === "sm") list.push(styles.smContainer);
    if (size === "md") list.push(styles.mdContainer);
    if (size === "lg") list.push(styles.lgContainer);

    // Variant
    switch (variant) {
      case "primary":
        list.push(styles.primaryContainer);
        break;
      case "secondary":
        list.push(styles.secondaryContainer);
        break;
      case "danger":
        list.push(styles.dangerContainer);
        break;
      case "outline":
        list.push(styles.outlineContainer);
        break;
      case "ghost":
        list.push(styles.ghostContainer);
        break;
    }

    if (disabled || loading) {
      list.push(styles.disabledContainer);
    }

    if (style) list.push(style);
    return list;
  };

  const getTextStyle = (): TextStyle[] => {
    const list: TextStyle[] = [styles.baseText];

    if (size === "sm") list.push(styles.smText);
    if (size === "md") list.push(styles.mdText);
    if (size === "lg") list.push(styles.lgText);

    switch (variant) {
      case "primary":
      case "danger":
        list.push(styles.whiteText);
        break;
      case "secondary":
        list.push(styles.secondaryText);
        break;
      case "outline":
        list.push(styles.outlineText);
        break;
      case "ghost":
        list.push(styles.ghostText);
        break;
    }

    if (textStyle) list.push(textStyle);
    return list;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={getContainerStyle()}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "outline" || variant === "ghost" ? theme.colors.primary : "#FFFFFF"}
        />
      ) : (
        <>
          {icon}
          <Text style={getTextStyle()}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  smContainer: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  mdContainer: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  lgContainer: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  primaryContainer: {
    backgroundColor: theme.colors.primary,
  },
  secondaryContainer: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dangerContainer: {
    backgroundColor: theme.colors.danger,
  },
  outlineContainer: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  ghostContainer: {
    backgroundColor: "transparent",
  },
  disabledContainer: {
    opacity: 0.5,
  },
  baseText: {
    fontWeight: "700",
  },
  smText: {
    fontSize: theme.typography.fontSize.xs,
  },
  mdText: {
    fontSize: theme.typography.fontSize.sm,
  },
  lgText: {
    fontSize: theme.typography.fontSize.base,
  },
  whiteText: {
    color: "#FFFFFF",
  },
  secondaryText: {
    color: theme.colors.textPrimary,
  },
  outlineText: {
    color: theme.colors.primary,
  },
  ghostText: {
    color: theme.colors.primary,
  },
});
