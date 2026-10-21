import React, { useState } from "react";
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity, Share, Alert } from "react-native";
import { NeutralReceipt } from "@buymecart/shared-types";
import { formatINR } from "@buymecart/business-logic";
import { theme } from "../theme";
import { Card } from "./Card";
import { Badge } from "./Badge";

export interface ReceiptViewProps {
  receipt: NeutralReceipt;
  style?: ViewStyle;
}

export const ReceiptView: React.FC<ReceiptViewProps> = ({ receipt, style }) => {
  const [paperWidth, setPaperWidth] = useState<"standard" | "80mm" | "58mm">("standard");

  const handleShare = async () => {
    try {
      const message = `BUYMECART · IBNK TRANSACTION VOUCHER
Receipt No: ${receipt.receiptNumber}
Tx Ref: ${receipt.transactionRef}
Bank RRN: ${receipt.rrn}
Service: ${receipt.serviceType.toUpperCase()}
Customer: ${receipt.customerIdentifier}
Amount: ₹${receipt.baseAmount.toFixed(2)}
Statutory Fee: ₹${receipt.temperedMarginFee.toFixed(2)}
Total Paid: ₹${receipt.totalPaid.toFixed(2)}
Status: ${receipt.status.toUpperCase()}
Date: ${new Date(receipt.timestamp).toLocaleString("en-IN")}
Compliance: Note 1 Neutral Receipt (RBI PSS Act Compliant)`;

      await Share.share({
        title: `Receipt ${receipt.receiptNumber}`,
        message,
      });
    } catch (err: any) {
      Alert.alert("Share Voucher", "Receipt text ready to export.");
    }
  };

  const isCompact = paperWidth !== "standard";
  const is58mm = paperWidth === "58mm";

  return (
    <Card variant="outlined" style={[styles.container, is58mm ? styles.container58 : isCompact ? styles.container80 : undefined, style]}>
      {/* Paper Width Selector */}
      <View style={styles.formatSelector}>
        <TouchableOpacity
          onPress={() => setPaperWidth("standard")}
          style={[styles.formatBtn, paperWidth === "standard" && styles.formatBtnActive]}
        >
          <Text style={[styles.formatBtnText, paperWidth === "standard" && styles.formatBtnTextActive]}>A4</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setPaperWidth("80mm")}
          style={[styles.formatBtn, paperWidth === "80mm" && styles.formatBtnActive]}
        >
          <Text style={[styles.formatBtnText, paperWidth === "80mm" && styles.formatBtnTextActive]}>80mm</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setPaperWidth("58mm")}
          style={[styles.formatBtn, paperWidth === "58mm" && styles.formatBtnActive]}
        >
          <Text style={[styles.formatBtnText, paperWidth === "58mm" && styles.formatBtnTextActive]}>58mm</Text>
        </TouchableOpacity>
      </View>
      {/* Neutral Header (Strict Note 1 Compliance - No third-party bank logos) */}
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>BUYMECART · IBNK</Text>
        </View>
        <Text style={styles.subtitle}>Digital Services Transaction Voucher</Text>
        <View style={styles.complianceTag}>
          <Text style={styles.complianceText}>
            OFFICIAL NEUTRAL RECEIPT · RBI PSS ACT COMPLIANT
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Transaction Status & Amount */}
      <View style={styles.amountSection}>
        <Text style={styles.amountLabel}>Total Customer Debit</Text>
        <Text style={styles.totalAmount}>{formatINR(receipt.totalPaid)}</Text>
        <View style={styles.statusBadgeWrapper}>
          <Badge
            label={receipt.status.toUpperCase()}
            variant={receipt.status === "success" ? "emerald" : "amber"}
          />
        </View>
      </View>

      <View style={styles.divider} />

      {/* Transaction Details Grid */}
      <View style={styles.detailsGrid}>
        <View style={styles.row}>
          <Text style={styles.label}>Receipt Number:</Text>
          <Text style={styles.valueMono}>{receipt.receiptNumber}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Transaction Ref:</Text>
          <Text style={styles.valueMono}>{receipt.transactionRef}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Bank RRN:</Text>
          <Text style={styles.valueMono}>{receipt.rrn}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Service Type:</Text>
          <Text style={styles.value}>{receipt.serviceType.toUpperCase()}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Retailer / Kendra:</Text>
          <Text style={styles.value}>
            {receipt.retailerName} ({receipt.retailerCode})
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Customer ID:</Text>
          <Text style={styles.value}>{receipt.customerIdentifier}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Date & Time:</Text>
          <Text style={styles.value}>
            {new Date(receipt.timestamp).toLocaleString("en-IN")}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Statutory Fee Breakdown (Page 3 Tempered Margin) */}
      <View style={styles.breakdownSection}>
        <Text style={styles.breakdownTitle}>Statutory Fee Breakdown</Text>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Base Transaction Amount:</Text>
          <Text style={styles.breakdownValue}>{formatINR(receipt.baseAmount)}</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Service & Processing Fee:</Text>
          <Text style={styles.breakdownValue}>{formatINR(receipt.serviceFee)}</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Tempered Margin Convenience Surcharge:</Text>
          <Text style={styles.breakdownValue}>{formatINR(receipt.temperedMarginFee)}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Security QR / Neutral Notice */}
      <View style={styles.footer}>
        <View style={styles.qrPlaceholder}>
          <Text style={styles.qrText}>QR CODE</Text>
          <Text style={styles.qrPayload} numberOfLines={1}>
            {receipt.qrPayload}
          </Text>
        </View>
        <Text style={styles.legalNotice}>
          Notice: In accordance with standard operating guidelines (Note 1), this voucher carries no
          third-party banking sponsor advertisements and serves as definitive proof of transaction.
        </Text>

        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Text style={styles.shareBtnText}>Share / Export Voucher</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: theme.borderRadius.xl,
  },
  container80: {
    padding: 12,
    maxWidth: 340,
  },
  container58: {
    padding: 8,
    maxWidth: 270,
  },
  formatSelector: {
    flexDirection: "row",
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.borderRadius.md,
    padding: 3,
    marginBottom: 12,
    alignSelf: "center",
  },
  formatBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  formatBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  formatBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.textSecondary,
  },
  formatBtnTextActive: {
    color: "#FFFFFF",
  },
  shareBtn: {
    marginTop: 10,
    backgroundColor: theme.colors.teal,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
  },
  shareBtnText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  header: {
    alignItems: "center",
    marginBottom: 8,
  },
  logoBadge: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.md,
  },
  logoText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: theme.typography.fontSize.sm,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: "600",
    marginTop: 6,
  },
  complianceTag: {
    marginTop: 4,
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  complianceText: {
    fontSize: 9,
    fontWeight: "700",
    color: theme.colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 12,
  },
  amountSection: {
    alignItems: "center",
  },
  amountLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: "600",
  },
  totalAmount: {
    fontSize: 26,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  statusBadgeWrapper: {
    marginTop: 6,
  },
  detailsGrid: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  value: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  valueMono: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: theme.typography.fontFamily.mono,
    color: theme.colors.textPrimary,
  },
  breakdownSection: {
    gap: 6,
  },
  breakdownTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  breakdownLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  breakdownValue: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  footer: {
    alignItems: "center",
    gap: 8,
  },
  qrPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: theme.colors.border,
    padding: 8,
    borderRadius: 8,
    width: "100%",
  },
  qrText: {
    fontSize: 10,
    fontWeight: "800",
    color: theme.colors.textSecondary,
  },
  qrPayload: {
    fontSize: 9,
    fontFamily: theme.typography.fontFamily.mono,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  legalNotice: {
    fontSize: 9,
    color: theme.colors.textMuted,
    textAlign: "center",
    lineHeight: 13,
  },
});
