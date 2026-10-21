import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { FinancialTransaction, DisputeRequest } from "@buymecart/shared-types";
import { disputeRequestSchema } from "@buymecart/validation";
import { theme } from "../theme";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { InputField } from "../components/InputField";

export interface DisputeRequestScreenProps {
  transaction?: FinancialTransaction;
  onBack: () => void;
  onSubmitDispute: (dispute: DisputeRequest) => void;
}

export const DisputeRequestScreen: React.FC<DisputeRequestScreenProps> = ({
  transaction,
  onBack,
  onSubmitDispute,
}) => {
  const [txRef, setTxRef] = useState(transaction?.transactionRef || "");
  const [customerPhone, setCustomerPhone] = useState(
    transaction?.customerIdentifier.replace(/\D/g, "").slice(-10) || ""
  );
  const [claimAmount, setClaimAmount] = useState(
    transaction ? String(transaction.amount) : ""
  );
  const [reason, setReason] = useState<DisputeRequest["reason"]>("account_not_credited");
  const [disputeNotes, setDisputeNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setErrorMsg(null);
    const parsed = disputeRequestSchema.safeParse({
      transactionRef: txRef,
      reason,
      customerPhone,
      claimAmount: parseFloat(claimAmount) || 0,
      disputeNotes,
    });

    if (!parsed.success) {
      setErrorMsg(parsed.error.errors[0]?.message || "Validation error");
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      const newDispute: DisputeRequest = {
        id: `disp-${Date.now()}`,
        transactionRef: txRef,
        reason,
        disputeNotes,
        claimAmount: parseFloat(claimAmount),
        customerPhone,
        status: "open",
        createdAt: new Date().toISOString(),
      };
      setSubmitting(false);
      setSubmitted(true);
      onSubmitDispute(newDispute);
    }, 600);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>File Transaction Dispute</Text>
      <Text style={styles.subtitle}>
        Lodge an inquiry or chargeback claim for reconciliation with the upstream switch.
      </Text>

      {submitted ? (
        <Card style={styles.successCard}>
          <Text style={styles.successTitle}>✅ Dispute Case Registered</Text>
          <Text style={styles.successDesc}>
            Your dispute has been logged under reference #{txRef}. Our automated reconciliation bot
            and banking support desk will audit the switch logs within 24 hours.
          </Text>
          <Button title="Back to IBNK Overview" onPress={onBack} size="md" />
        </Card>
      ) : (
        <Card style={styles.formCard}>
          {errorMsg && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
            </View>
          )}

          <InputField
            label="Transaction Reference / UTR"
            placeholder="BMC-DMT-123456"
            value={txRef}
            onChangeText={setTxRef}
          />

          <InputField
            label="Customer Mobile Number"
            placeholder="9876543210"
            value={customerPhone}
            onChangeText={setCustomerPhone}
            keyboardType="phone-pad"
          />

          <InputField
            label="Claimed Amount (₹)"
            placeholder="e.g. 2500"
            value={claimAmount}
            onChangeText={setClaimAmount}
            keyboardType="numeric"
          />

          <Text style={styles.fieldLabel}>Dispute Reason Code</Text>
          <View style={styles.reasonsList}>
            {[
              { id: "account_not_credited", label: "Account Debited but Not Credited" },
              { id: "duplicate_debit", label: "Duplicate Debit Charged" },
              { id: "terminal_timeout", label: "Terminal Timeout / Cash Not Dispensed" },
              { id: "unauthorized", label: "Unauthorized / Fraudulent Debit" },
            ].map((r) => (
              <TouchableOpacity
                key={r.id}
                onPress={() => setReason(r.id as DisputeRequest["reason"])}
                style={[
                  styles.reasonChip,
                  reason === r.id && styles.activeReasonChip,
                ]}
              >
                <Text style={[styles.reasonText, reason === r.id && styles.activeReasonText]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <InputField
            label="Detailed Context / Observations"
            placeholder="Explain error message shown on POS screen or bank SMS..."
            value={disputeNotes}
            onChangeText={setDisputeNotes}
            multiline
            numberOfLines={3}
          />

          <Button
            title={submitting ? "Submitting Dispute..." : "Submit Formal Dispute"}
            onPress={handleSubmit}
            loading={submitting}
            size="lg"
            style={styles.submitBtn}
          />
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  backBtn: {
    marginBottom: 12,
  },
  backText: {
    fontSize: 13,
    color: theme.colors.accent,
    fontWeight: "700",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  subtitle: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
    marginBottom: 16,
  },
  formCard: {
    padding: 16,
  },
  errorBox: {
    backgroundColor: theme.colors.dangerSubtle,
    padding: 8,
    borderRadius: theme.borderRadius.sm,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 11,
    color: theme.colors.danger,
    fontWeight: "600",
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  reasonsList: {
    gap: 6,
    marginBottom: 14,
  },
  reasonChip: {
    padding: 10,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  activeReasonChip: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surfaceSubtle,
  },
  reasonText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: "600",
  },
  activeReasonText: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
  submitBtn: {
    marginTop: 6,
  },
  successCard: {
    padding: 20,
    alignItems: "center",
  },
  successTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.success,
    marginBottom: 8,
  },
  successDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
});
