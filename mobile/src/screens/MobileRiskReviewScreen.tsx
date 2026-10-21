import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { BankingRiskCase } from "@buymecart/shared-types";
import { formatINR } from "@buymecart/business-logic";
import { theme } from "../theme";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { InputField } from "../components/InputField";

export interface MobileRiskReviewScreenProps {
  riskCase: BankingRiskCase;
  onBack: () => void;
  onEscalate: (caseId: string, notes: string) => void;
  onClear: (caseId: string) => void;
}

export const MobileRiskReviewScreen: React.FC<MobileRiskReviewScreenProps> = ({
  riskCase,
  onBack,
  onEscalate,
  onClear,
}) => {
  const [reviewerNotes, setReviewerNotes] = useState(riskCase.reviewerNotes || "");
  const [actionDone, setActionDone] = useState<string | null>(null);

  const handleEscalate = () => {
    onEscalate(riskCase.id, reviewerNotes);
    setActionDone("Case escalated to Maker-Checker approval queue.");
  };

  const handleClear = () => {
    onClear(riskCase.id);
    setActionDone("Risk flag cleared. Telemetry marked resolved.");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>← Back to Risk Alerts</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.badgeRow}>
          <Badge
            label={`${riskCase.severity.toUpperCase()} RISK (${riskCase.riskScore}/100)`}
            variant={riskCase.severity === "Critical" ? "rose" : "amber"}
          />
          <Badge label={riskCase.status.toUpperCase()} variant="neutral" />
        </View>
        <Text style={styles.title}>Risk Case #{riskCase.caseRef}</Text>
        <Text style={styles.subtitle}>
          Underlying Tx: {riskCase.transactionId} · Service: {riskCase.service.toUpperCase()}
        </Text>
      </View>

      {actionDone && (
        <View style={styles.actionBanner}>
          <Text style={styles.actionBannerText}>✅ {actionDone}</Text>
        </View>
      )}

      {/* Case Metrics Card */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Transaction Context</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Retailer / Merchant:</Text>
          <Text style={styles.detailVal}>{riskCase.retailerName} ({riskCase.retailerId})</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Transaction Amount:</Text>
          <Text style={styles.detailVal}>{formatINR(riskCase.amount)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Flagged At:</Text>
          <Text style={styles.detailVal}>
            {new Date(riskCase.createdAt).toLocaleString("en-IN")}
          </Text>
        </View>
      </Card>

      {/* Anomaly Breakdown */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>ML Anomaly Diagnostics & Features</Text>
        <View style={styles.anomaliesList}>
          {riskCase.anomaliesDetected.map((anom, idx) => (
            <View key={idx} style={styles.anomalyItem}>
              <View style={styles.anomalyHeader}>
                <Text style={styles.anomalyFeature}>{anom.feature}</Text>
                <Text style={styles.deviationScore}>
                  Deviation: +{anom.deviationScore}σ
                </Text>
              </View>
              <Text style={styles.anomalyDesc}>{anom.description}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Reviewer Observations */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Reviewer Observations & Notes</Text>
        <InputField
          placeholder="Record notes on IP verification, merchant contact, or switch log check..."
          value={reviewerNotes}
          onChangeText={setReviewerNotes}
          multiline
          numberOfLines={3}
        />

        <View style={styles.actionButtons}>
          <Button
            title="Escalate to Maker-Checker Queue"
            onPress={handleEscalate}
            variant="danger"
            size="md"
          />
          <Button
            title="Clear False Positive"
            onPress={handleClear}
            variant="outline"
            size="md"
          />
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: theme.colors.background,
    gap: 14,
  },
  backBtn: {
    marginBottom: 8,
  },
  backText: {
    fontSize: 13,
    color: theme.colors.accent,
    fontWeight: "700",
  },
  header: {
    gap: 6,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.mono,
  },
  actionBanner: {
    backgroundColor: theme.colors.successSubtle,
    borderWidth: 1,
    borderColor: theme.colors.success,
    borderRadius: theme.borderRadius.md,
    padding: 10,
  },
  actionBannerText: {
    fontSize: 12,
    color: theme.colors.success,
    fontWeight: "700",
  },
  card: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.primary,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  detailVal: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  anomaliesList: {
    gap: 8,
  },
  anomalyItem: {
    backgroundColor: theme.colors.surfaceSubtle,
    padding: 10,
    borderRadius: theme.borderRadius.md,
  },
  anomalyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  anomalyFeature: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  deviationScore: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.danger,
    fontFamily: theme.typography.fontFamily.mono,
  },
  anomalyDesc: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    lineHeight: 15,
  },
  actionButtons: {
    gap: 8,
    marginTop: 10,
  },
});
