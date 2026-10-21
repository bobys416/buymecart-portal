import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { FinancialTransaction } from "@buymecart/shared-types";
import { generateNeutralReceipt } from "@buymecart/business-logic";
import { theme } from "../theme";
import { ReceiptView } from "../components/ReceiptView";
import { Button } from "../components/Button";

export interface TransactionDetailScreenProps {
  transaction: FinancialTransaction;
  onBack: () => void;
  onFileDispute: (transaction: FinancialTransaction) => void;
}

export const TransactionDetailScreen: React.FC<TransactionDetailScreenProps> = ({
  transaction,
  onBack,
  onFileDispute,
}) => {
  const receipt = generateNeutralReceipt(transaction, "RET-MP-02");

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>← Back to Ledger</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Transaction Details</Text>
        <Text style={styles.subtitle}>
          Official consumer transaction summary and neutral compliance voucher.
        </Text>
      </View>

      {/* Note 1 Compliant Neutral Receipt */}
      <ReceiptView receipt={receipt} style={styles.receipt} />

      <View style={styles.actions}>
        <Button
          title="File Dispute or Chargeback Query"
          onPress={() => onFileDispute(transaction)}
          variant="outline"
          size="md"
        />
      </View>
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
  header: {
    marginBottom: 16,
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
  },
  receipt: {
    marginBottom: 16,
  },
  actions: {
    gap: 10,
    marginBottom: 20,
  },
});
