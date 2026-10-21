import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { IbnkServiceType, FinancialTransaction, SwitchHealth } from "@buymecart/shared-types";
import { calculateTemperedMargin, formatINR } from "@buymecart/business-logic";
import { dmtTransferSchema, upiPaySchema } from "@buymecart/validation";
import { theme } from "../theme";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { InputField } from "../components/InputField";
import { StatusIndicator } from "../components/StatusIndicator";

export interface IbnkOverviewScreenProps {
  onTransactionComplete: (tx: FinancialTransaction) => void;
  onNavigateToTransactions: () => void;
  onNavigateToServiceStatus: () => void;
}

export const IbnkOverviewScreen: React.FC<IbnkOverviewScreenProps> = ({
  onTransactionComplete,
  onNavigateToTransactions,
  onNavigateToServiceStatus,
}) => {
  const [activeModal, setActiveModal] = useState<IbnkServiceType | null>(null);

  // Form states for DMT
  const [dmtRecipient, setDmtRecipient] = useState("");
  const [dmtAccount, setDmtAccount] = useState("");
  const [dmtConfirmAccount, setDmtConfirmAccount] = useState("");
  const [dmtIfsc, setDmtIfsc] = useState("");
  const [dmtAmount, setDmtAmount] = useState("");
  const [dmtError, setDmtError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // Form states for UPI
  const [upiVpa, setUpiVpa] = useState("");
  const [upiAmount, setUpiAmount] = useState("");
  const [upiNote, setUpiNote] = useState("");
  const [upiError, setUpiError] = useState<string | null>(null);

  const switches: SwitchHealth[] = [
    { switchName: "NPCI IMPS Switch", serviceType: "dmt", status: "operational", latencyMs: 94, successRate: 99.8, lastChecked: "Just now" },
    { switchName: "UIDAI AEPS Switch", serviceType: "aeps", status: "operational", latencyMs: 112, successRate: 99.4, lastChecked: "Just now" },
    { switchName: "BBPS Central Unit", serviceType: "bbps", status: "operational", latencyMs: 88, successRate: 99.9, lastChecked: "Just now" },
  ];

  const handleExecuteDmt = () => {
    setDmtError(null);
    const numAmount = parseFloat(dmtAmount);
    const parsed = dmtTransferSchema.safeParse({
      recipientName: dmtRecipient,
      accountNumber: dmtAccount,
      confirmAccountNumber: dmtConfirmAccount,
      ifsc: dmtIfsc,
      amount: numAmount,
      transferMode: "IMPS",
    });

    if (!parsed.success) {
      setDmtError(parsed.error.errors[0]?.message || "Invalid transfer details");
      return;
    }

    setProcessing(true);
    setTimeout(() => {
      const calc = calculateTemperedMargin(numAmount, "dmt");
      const tx: FinancialTransaction = {
        id: `tx-dmt-${Date.now()}`,
        transactionRef: `BMC-DMT-${Date.now().toString().slice(-6)}`,
        rrn: `41${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        utr: `UTR-IMPS-${Date.now().toString().slice(-8)}`,
        serviceType: "dmt",
        retailerId: "RET-MOBILE-01",
        retailerName: "Sharma Digital Services",
        customerIdentifier: dmtAccount.replace(/.(?=.{4})/g, "*"),
        amount: numAmount,
        temperedMarginFee: calc.platformNetMargin,
        commissionEarned: calc.retailerCommission,
        netDebit: calc.totalCustomerDebit,
        status: "success",
        upstreamSwitch: "NPCI IMPS Switch",
        latencyMs: 98,
        createdAt: new Date().toISOString(),
      };

      setProcessing(false);
      setActiveModal(null);
      setDmtRecipient("");
      setDmtAccount("");
      setDmtConfirmAccount("");
      setDmtIfsc("");
      setDmtAmount("");
      onTransactionComplete(tx);
    }, 700);
  };

  const handleExecuteUpi = () => {
    setUpiError(null);
    const numAmount = parseFloat(upiAmount);
    const parsed = upiPaySchema.safeParse({
      vpa: upiVpa,
      amount: numAmount,
      note: upiNote,
    });

    if (!parsed.success) {
      setUpiError(parsed.error.errors[0]?.message || "Invalid UPI request");
      return;
    }

    setProcessing(true);
    setTimeout(() => {
      const calc = calculateTemperedMargin(numAmount, "upi_switch");
      const tx: FinancialTransaction = {
        id: `tx-upi-${Date.now()}`,
        transactionRef: `BMC-UPI-${Date.now().toString().slice(-6)}`,
        rrn: `42${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        serviceType: "upi_switch",
        retailerId: "RET-MOBILE-01",
        retailerName: "Sharma Digital Services",
        customerIdentifier: upiVpa,
        amount: numAmount,
        temperedMarginFee: calc.platformNetMargin,
        commissionEarned: calc.retailerCommission,
        netDebit: calc.totalCustomerDebit,
        status: "success",
        upstreamSwitch: "NPCI UPI Switch",
        latencyMs: 65,
        createdAt: new Date().toISOString(),
      };

      setProcessing(false);
      setActiveModal(null);
      setUpiVpa("");
      setUpiAmount("");
      setUpiNote("");
      onTransactionComplete(tx);
    }, 600);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>IBNK Financial Switching</Text>
          <Text style={styles.subtitle}>Direct UPI, AEPS, DMT, and BBPS Banking Rails</Text>
        </View>
        <TouchableOpacity onPress={onNavigateToTransactions} style={styles.ledgerBtn}>
          <Text style={styles.ledgerBtnText}>📜 View Ledger</Text>
        </TouchableOpacity>
      </View>

      {/* Switch Health Status Bar */}
      <Card style={styles.switchHealthCard}>
        <View style={styles.switchHeader}>
          <Text style={styles.switchTitle}>Upstream Gateway Health</Text>
          <TouchableOpacity onPress={onNavigateToServiceStatus}>
            <Text style={styles.switchTelemetryLink}>Telemetry →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.switchList}>
          {switches.map((s, idx) => (
            <View key={idx} style={styles.switchItem}>
              <Text style={styles.switchName}>{s.switchName}</Text>
              <View style={styles.switchStatusWrapper}>
                <StatusIndicator status={s.status} label={`${s.latencyMs}ms`} />
              </View>
            </View>
          ))}
        </View>
      </Card>

      {/* Financial Service Tiles */}
      <Text style={styles.sectionTitle}>Available Financial Rails</Text>
      <View style={styles.grid}>
        <TouchableOpacity
          onPress={() => setActiveModal("dmt")}
          style={styles.serviceTile}
        >
          <Text style={styles.serviceIcon}>💸</Text>
          <Text style={styles.serviceName}>Domestic Money Transfer (DMT)</Text>
          <Text style={styles.serviceDesc}>Direct IMPS / NEFT transfer with statutory Tempered Margin fee.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveModal("upi_switch")}
          style={styles.serviceTile}
        >
          <Text style={styles.serviceIcon}>⚡</Text>
          <Text style={styles.serviceName}>UPI Pay & Collect</Text>
          <Text style={styles.serviceDesc}>Instant VPA collection with zero surcharge on consumer P2M.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveModal("aeps")}
          style={styles.serviceTile}
        >
          <Text style={styles.serviceIcon}>🖐️</Text>
          <Text style={styles.serviceName}>AEPS Cash Out</Text>
          <Text style={styles.serviceDesc}>Aadhaar micro-ATM cash withdrawals with biometric scanner.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveModal("bbps")}
          style={styles.serviceTile}
        >
          <Text style={styles.serviceIcon}>🧾</Text>
          <Text style={styles.serviceName}>Bharat Bill Pay (BBPS)</Text>
          <Text style={styles.serviceDesc}>Electricity, water, gas, and fastag bill settlements.</Text>
        </TouchableOpacity>
      </View>

      {/* DMT Modal Simulation */}
      {activeModal === "dmt" && (
        <Card style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Initiate DMT Money Transfer</Text>
            <TouchableOpacity onPress={() => setActiveModal(null)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {dmtError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {dmtError}</Text>
            </View>
          )}

          <InputField
            label="Beneficiary Full Name"
            placeholder="e.g. Ramesh Patel"
            value={dmtRecipient}
            onChangeText={setDmtRecipient}
          />
          <InputField
            label="Bank Account Number"
            placeholder="123456789012"
            value={dmtAccount}
            onChangeText={setDmtAccount}
            keyboardType="number-pad"
          />
          <InputField
            label="Confirm Account Number"
            placeholder="Re-enter bank account"
            value={dmtConfirmAccount}
            onChangeText={setDmtConfirmAccount}
            keyboardType="number-pad"
          />
          <InputField
            label="Bank IFSC Code"
            placeholder="SBIN0001234"
            value={dmtIfsc}
            onChangeText={setDmtIfsc}
          />
          <InputField
            label="Transfer Amount (₹)"
            placeholder="e.g. 5000"
            value={dmtAmount}
            onChangeText={setDmtAmount}
            keyboardType="numeric"
          />

          {parseFloat(dmtAmount) > 0 && (
            <View style={styles.calcPreview}>
              <Text style={styles.calcText}>
                Statutory Tempered Margin: {formatINR(calculateTemperedMargin(parseFloat(dmtAmount), "dmt").platformNetMargin)}
              </Text>
              <Text style={styles.calcText}>
                Total Customer Debit: {formatINR(calculateTemperedMargin(parseFloat(dmtAmount), "dmt").totalCustomerDebit)}
              </Text>
            </View>
          )}

          <Button
            title={processing ? "Executing IMPS Transfer..." : "Authorize & Send Transfer"}
            onPress={handleExecuteDmt}
            loading={processing}
            size="lg"
            style={styles.modalSubmitBtn}
          />
        </Card>
      )}

      {/* UPI Modal Simulation */}
      {activeModal === "upi_switch" && (
        <Card style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Initiate UPI Payment</Text>
            <TouchableOpacity onPress={() => setActiveModal(null)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {upiError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {upiError}</Text>
            </View>
          )}

          <InputField
            label="Recipient UPI VPA"
            placeholder="merchant@upi or mobile@paytm"
            value={upiVpa}
            onChangeText={setUpiVpa}
          />
          <InputField
            label="Amount (₹)"
            placeholder="e.g. 1500"
            value={upiAmount}
            onChangeText={setUpiAmount}
            keyboardType="numeric"
          />
          <InputField
            label="Remarks / Note"
            placeholder="Store payment"
            value={upiNote}
            onChangeText={setUpiNote}
          />

          <Button
            title={processing ? "Processing UPI Switch..." : "Confirm UPI Payment"}
            onPress={handleExecuteUpi}
            loading={processing}
            size="lg"
            style={styles.modalSubmitBtn}
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
    gap: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  ledgerBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  ledgerBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  switchHealthCard: {
    padding: 14,
  },
  switchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  switchTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  switchTelemetryLink: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.accent,
  },
  switchList: {
    gap: 8,
  },
  switchItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchName: {
    fontSize: 12,
    color: theme.colors.textPrimary,
  },
  switchStatusWrapper: {
    flexDirection: "row",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  serviceTile: {
    width: "48%",
    backgroundColor: theme.colors.surface,
    padding: 14,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.elevation.card,
  },
  serviceIcon: {
    fontSize: 26,
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.primary,
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    lineHeight: 14,
  },
  modalCard: {
    padding: 18,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  closeBtn: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textMuted,
    padding: 4,
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
  calcPreview: {
    backgroundColor: theme.colors.surfaceSubtle,
    padding: 10,
    borderRadius: theme.borderRadius.md,
    marginVertical: 10,
    gap: 4,
  },
  calcText: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  modalSubmitBtn: {
    marginTop: 6,
  },
});
