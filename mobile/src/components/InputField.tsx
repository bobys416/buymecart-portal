import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardTypeOptions,
  ViewStyle,
  TextStyle,
} from "react-native";
import { theme } from "../theme";

export interface InputFieldProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  multiline?: boolean;
  numberOfLines?: number;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize,
  multiline = false,
  numberOfLines = 1,
  disabled = false,
  leftIcon,
  containerStyle,
  inputStyle,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.focusedBorder,
          Boolean(error) && styles.errorBorder,
          disabled && styles.disabledInput,
        ]}
      >
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[styles.input, multiline && styles.multilineInput, inputStyle]}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.rightIconButton}
          >
            <Text style={styles.togglePasswordText}>
              {isPasswordVisible ? "Hide" : "Show"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
  },
  focusedBorder: {
    borderColor: theme.colors.primary,
    borderWidth: 1.5,
  },
  errorBorder: {
    borderColor: theme.colors.danger,
  },
  disabledInput: {
    backgroundColor: theme.colors.surfaceSubtle,
    opacity: 0.6,
  },
  leftIconContainer: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textPrimary,
  },
  multilineInput: {
    minHeight: 70,
    textAlignVertical: "top",
  },
  rightIconButton: {
    padding: 6,
  },
  togglePasswordText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.accent,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 11,
    color: theme.colors.danger,
    marginTop: 4,
    fontWeight: "500",
  },
});
