import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput, Alert } from "react-native";
import { theme } from "../theme";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { FinancialTransaction, NeutralReceipt } from "@buymecart/shared-types";
import { generateNeutralReceipt } from "@buymecart/business-logic";
import { ReceiptView } from "../components/ReceiptView";

export interface RetailerDashboardScreenProps {
  onNavigateToTransactions?: () => void;
  onNavigateToKyc?: () => void;
  onNavigateToSupport?: () => void;
}

export const RetailerDashboardScreen: React.FC<RetailerDashboardScreenProps> = ({
  onNavigateToTransactions,
  onNavigateToKyc,
  onNavigateToSupport,
}) => {
  const [balance, setBalance] = useState(42500.0);
  const [refreshing, setRefreshing] = useState(false);
  const [activeModal, setActiveModal] = useState<"aeps" | "dmt" | "bbps" | "upi" | null>(null);
  const [inputAmount, setInputAmount] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [completedReceipt, setCompletedReceipt] = useState<NeutralReceipt | null>(null);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleExecuteTx = (serviceType: "aeps" | "dmt" | "bbps" | "upi_switch") => {
    const amt = parseFloat(inputAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid transaction amount.");
      return;
    }

    const txRef = `BMC-${serviceType.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const rrn = `${Date.now()}`.slice(-12);

    const tx: FinancialTransaction = {
      id: `tx-${Date.now()}`,
      transactionRef: txRef,
      rrn,
      serviceType,
      retailerId: "RET-ZONE-01-401",
      retailerName: "Patel Digital Kendra",
      customerIdentifier: customerPhone.trim() ? `+91 ${customerPhone}` : "+91 98765 43210",
      amount: amt,
      temperedMarginFee: amt * 0.008,
      commissionEarned: amt * 0.005,
      netDebit: amt + (serviceType === "dmt" ? amt * 0.008 : 0),
      status: "success",
      upstreamSwitch: "NPCI IMPS Switch",
      latencyMs: 82,
      createdAt: new Date().toISOString(),
    };

    setBalance((prev) => prev - (serviceType === "dmt" ? amt : 0) + (serviceType === "aeps" ? amt : 0));
    const receipt = generateNeutralReceipt(tx, "RET-ZONE-01-401");
    setCompletedReceipt(receipt);
    setActiveModal(null);
    setInputAmount("");
    setCustomerPhone("");
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {/* Dev Mode Banner */}
      <View style={styles.devBanner}>
        <Text style={styles.devBannerText}>
          ⚡ DEV FIXTURE ACTIVE · RETAILER MERCHANT TERMINAL (RET-ZONE-01-401)
        </Text>
      </View>

      {/* Screen Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Merchant Retail Desk</Text>
        <Text style={styles.subtitle}>
          Patel Digital Kendra · Main Market, Zone-01 Division
        </Text>
      </View>

      {/* Wallet Balance Card */}
      <Card style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Merchant Operating Float</Text>
        <Text style={styles.balanceValue}>
          ₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </Text>
        <Text style={styles.balanceSub}>
          Parent AD: Sunil Verma (Zone-01) · Settlement: Real-time T+0 IMPS
        </Text>

        <View style={styles.balanceFooter}>
          <Badge label="LEVEL-3 VERIFIED" variant="emerald" />
          <Badge label="NPCI NORMAL (82ms)" variant="teal" />
        </View>
      </Card>

      {/* Quick Financial Services Rails */}
      <Text style={styles.sectionHeading}>Authorized Banking Services</Text>
      <View style={styles.servicesGrid}>
        <TouchableOpacity
          style={styles.serviceCard}
          onPress={() => setActiveModal("aeps")}
        >
          <Text style={styles.serviceIcon}>🖐️</Text>
          <Text style={styles.serviceName}>AEPS Cash</Text>
          <Text style={styles.serviceDesc}>Aadhaar Pay & Withdrawal</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.serviceCard}
          onPress={() => setActiveModal("dmt")}
        >
          <Text style={styles.serviceIcon}>💸</Text>
          <Text style={styles.serviceName}>DMT Transfer</Text>
          <Text style={styles.serviceDesc}>Instant IMPS to Any Bank</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.serviceCard}
          onPress={() => setActiveModal("bbps")}
        >
          <Text style={styles.serviceIcon}>⚡</Text>
          <Text style={styles.serviceName}>BBPS Bill Pay</Text>
          <Text style={styles.serviceDesc}>Electricity, Fastag, DTH</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.serviceCard}
          onPress={() => setActiveModal("upi")}
        >
          <Text style={styles.serviceIcon}>📱</Text>
          <Text style={styles.serviceName}>UPI Collect QR</Text>
          <Text style={styles.serviceDesc}>Dynamic Merchant QR</Text>
        </TouchableOpacity>
      </View>

      {/* Secondary Actions */}
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.navCard} onPress={onNavigateToTransactions}>
          <Text style={styles.navIcon}>🧾</Text>
          <Text style={styles.navTitle}>Ledger & Receipts</Text>
          <Text style={styles.navDesc}>Note 1 Neutral Vouchers</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navCard} onPress={onNavigateToKyc}>
          <Text style={styles.navIcon}>🛡️</Text>
          <Text style={styles.navTitle}>KYC & Bank Proof</Text>
          <Text style={styles.navDesc}>Masked UID & Penny Drop</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navCard} onPress={onNavigateToSupport}>
          <Text style={styles.navIcon}>🎧</Text>
          <Text style={styles.navTitle}>Support & Help</Text>
          <Text style={styles.navDesc}>1800-200-4265</Text>
        </TouchableOpacity>
      </View>

      {/* Transaction Modal */}
      <Modal visible={!!activeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {activeModal === "aeps"
                ? "Initiate AEPS Cash Withdrawal"
                : activeModal === "dmt"
                ? "Initiate DMT Money Transfer"
                : activeModal === "bbps"
                ? "Initiate BBPS Bill Payment"
                : "Generate UPI Dynamic QR"}
            </Text>
            <Text style={styles.modalSub}>
              Protected under statutory Tempered Margin schedule
            </Text>

            <Text style={styles.inputLabel}>Customer Phone Number:</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 9876543210"
              keyboardType="phone-pad"
              value={customerPhone}
              onChangeText={setCustomerPhone}
            />

            <Text style={styles.inputLabel}>Transaction Amount (INR):</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2000"
              keyboardType="numeric"
              value={inputAmount}
              onChangeText={setInputAmount}
            />

            <View style={styles.modalActions}>
              <Button
                title="Process Transaction"
                onPress={() =>
                  handleExecuteTx(
                    activeModal === "upi" ? "upi_switch" : (activeModal as any)
                  )
                }
                style={{ flex: 1 }}
              />
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setActiveModal(null)}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Neutral Receipt Modal */}
      <Modal visible={!!completedReceipt} transparent animationType="slide">
        <View style={styles.receiptOverlay}>
          <ScrollView contentContainerStyle={styles.receiptContent}>
            {completedReceipt && <ReceiptView receipt={completedReceipt} />}
            <Button
              title="Close Receipt"
              onPress={() => setCompletedReceipt(null)}
              style={{ marginTop: 16 }}
            />
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: theme.colors.background,
  },
  devBanner: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 12,
    alignItems: "center",
  },
  devBannerText: {
    color: theme.colors.teal,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: theme.colors.primary,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  balanceCard: {
    padding: 16,
    backgroundColor: theme.colors.primary,
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 11,
    color: theme.colors.tealLight,
    fontWeight: "700",
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    marginVertical: 4,
  },
  balanceSub: {
    fontSize: 11,
    color: "#CBD5E1",
    marginBottom: 12,
  },
  balanceFooter: {
    flexDirection: "row",
    gap: 8,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.primary,
    marginBottom: 10,
  },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  serviceCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
  },
  serviceIcon: {
    fontSize: 26,
    marginBottom: 6,
  },
  serviceName: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.primary,
    textAlign: "center",
  },
  serviceDesc: {
    fontSize: 10,
    color: theme.colors.textMuted,
    textAlign: "center",
    marginTop: 2,
  },
  navRow: {
    flexDirection: "row",
    gap: 8,
  },
  navCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: theme.colors.primary,
    textAlign: "center",
  },
  navDesc: {
    fontSize: 9,
    color: theme.colors.textMuted,
    textAlign: "center",
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(16, 28, 50, 0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: theme.borderRadius.xl,
    padding: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: theme.colors.primary,
  },
  modalSub: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.primary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  receiptOverlay: {
    flex: 1,
    backgroundColor: "rgba(16, 28, 50, 0.75)",
    padding: 16,
    justifyContent: "center",
  },
  receiptContent: {
    paddingVertical: 20,
  },
});
