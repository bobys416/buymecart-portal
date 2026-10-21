import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { theme } from "../theme";
import { InputField } from "../components/InputField";
import { Button } from "../components/Button";

export interface ForgotPasswordScreenProps {
  onBackToLogin: () => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onBackToLogin,
}) => {
  const [identifier, setIdentifier] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleReset = () => {
    if (identifier.trim().length > 3) {
      setSubmitted(true);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reset Account Password</Text>
        <Text style={styles.subtitle}>
          Enter your registered mobile number or email to receive a secure OTP verification token.
        </Text>
      </View>

      {submitted ? (
        <View style={styles.successBox}>
          <Text style={styles.successTitle}>✅ OTP Dispatched</Text>
          <Text style={styles.successDesc}>
            A one-time reset code has been sent to {identifier}. Enter the OTP in your SMS or email to complete the reset.
          </Text>
          <Button
            title="Return to Login"
            onPress={onBackToLogin}
            style={styles.backBtn}
          />
        </View>
      ) : (
        <View style={styles.form}>
          <InputField
            label="Mobile Number or Email"
            placeholder="e.g. 9876543210 or user@buymecart.org"
            value={identifier}
            onChangeText={setIdentifier}
          />
          <Button
            title="Send Verification OTP"
            onPress={handleReset}
            size="lg"
            style={styles.submitBtn}
          />
          <Button
            title="Cancel and Return to Login"
            onPress={onBackToLogin}
            variant="ghost"
            style={styles.cancelBtn}
          />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: theme.colors.background,
  },
  header: {
    marginTop: 40,
    marginBottom: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  form: {
    gap: 12,
  },
  submitBtn: {
    marginTop: 8,
  },
  cancelBtn: {
    marginTop: 4,
  },
  successBox: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
  },
  successTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.success,
    marginBottom: 8,
  },
  successDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  backBtn: {
    minWidth: 160,
  },
});
