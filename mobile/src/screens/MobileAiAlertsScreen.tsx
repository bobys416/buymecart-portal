import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from "react-native";
import { BankingRiskCase, RiskSeverity } from "@buymecart/shared-types";
import { formatINR } from "@buymecart/business-logic";
import { theme } from "../theme";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { EmptyState } from "../components/EmptyState";

export interface MobileAiAlertsScreenProps {
  onBack: () => void;
  onSelectCase: (riskCase: BankingRiskCase) => void;
}

export const MobileAiAlertsScreen: React.FC<MobileAiAlertsScreenProps> = ({
  onBack,
  onSelectCase,
}) => {
  // Zero dummy data initial state
  const [cases, setCases] = useState<BankingRiskCase[]>([]);
  const [severityFilter, setSeverityFilter] = useState<RiskSeverity | "all">("all");

  const handleSimulateRisk = () => {
    const demoCase: BankingRiskCase = {
      id: `case-${Date.now()}`,
      caseRef: `RISK-${Date.now().toString().slice(-6)}`,
      transactionId: `TX-AEPS-${Date.now().toString().slice(-6)}`,
      retailerName: "Metro Mobile Point",
      retailerId: "RET-ZONE-04",
      amount: 10000,
      service: "aeps",
      riskScore: 88,
      severity: "Critical",
      reasonCodes: ["AEPS_RAPID_VELOCITY", "GEO_IP_MISMATCH"],
      anomaliesDetected: [
        { feature: "Terminal Velocity", description: "5 max-limit cash outs within 120 seconds", deviationScore: 4.8 },
        { feature: "Geographic Location", description: "IP origin does not match POS GPS coordinate", deviationScore: 3.2 },
      ],
      status: "Under Review",
      createdAt: new Date().toISOString(),
    };
    setCases([demoCase, ...cases]);
  };

  const filteredCases = cases.filter((c) => {
    if (severityFilter !== "all" && c.severity !== severityFilter) return false;
    return true;
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>← Back to AI Dashboard</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Banking Risk Radar Alerts</Text>
        <Text style={styles.subtitle}>
          Real-time anomaly detection identifying velocity bursts and suspicious switch debits.
        </Text>
      </View>

      {/* Severity Filter Chips */}
      <View style={styles.filtersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
          {[
            { label: "All Severities", value: "all" },
            { label: "Critical", value: "Critical" },
            { label: "High", value: "High" },
            { label: "Medium", value: "Medium" },
          ].map((f) => (
            <TouchableOpacity
              key={f.value}
              onPress={() => setSeverityFilter(f.value as RiskSeverity | "all")}
              style={[
                styles.chip,
                severityFilter === f.value && styles.activeChip,
              ]}
            >
              <Text style={[styles.chipText, severityFilter === f.value && styles.activeChipText]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Cases List or Clean Zero Dummy Data Empty State */}
      {filteredCases.length === 0 ? (
        <ScrollView contentContainerStyle={styles.emptyContainer}>
          <EmptyState
            title="No active banking risk cases detected"
            description="Transaction radar telemetry is currently clean with zero flagged anomalies."
            actionLabel="+ Simulate Risk Radar Alert"
            onAction={handleSimulateRisk}
          />
        </ScrollView>
      ) : (
        <FlatList
          data={filteredCases}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Card style={styles.caseCard}>
              <TouchableOpacity activeOpacity={0.7} onPress={() => onSelectCase(item)}>
                <View style={styles.caseHeader}>
                  <View>
                    <Text style={styles.caseRef}>{item.caseRef}</Text>
                    <Text style={styles.txId}>Tx: {item.transactionId}</Text>
                  </View>
                  <Badge
                    label={`${item.severity.toUpperCase()} (${item.riskScore})`}
                    variant={item.severity === "Critical" ? "rose" : "amber"}
                    size="sm"
                  />
                </View>

                <View style={styles.divider} />

                <Text style={styles.retailerText}>
                  {item.retailerName} · {item.service.toUpperCase()}
                </Text>
                <Text style={styles.amountText}>{formatINR(item.amount)}</Text>

                <View style={styles.reasonsList}>
                  {item.reasonCodes.map((code, idx) => (
                    <Text key={idx} style={styles.reasonCode}>
                      • {code}
                    </Text>
                  ))}
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.inspectText}>Inspect Anomaly Breakdown →</Text>
                </View>
              </TouchableOpacity>
            </Card>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  backText: {
    fontSize: 13,
    color: theme.colors.accent,
    fontWeight: "700",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
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
  filtersWrapper: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  filterChipsRow: {
    gap: 8,
  },
  chip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeChip: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  activeChipText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  emptyContainer: {
    paddingHorizontal: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  caseCard: {
    padding: 14,
  },
  caseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  caseRef: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.mono,
  },
  txId: {
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.mono,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 10,
  },
  retailerText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  amountText: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.colors.primary,
    marginTop: 2,
  },
  reasonsList: {
    marginTop: 6,
    gap: 2,
  },
  reasonCode: {
    fontSize: 11,
    color: theme.colors.danger,
    fontWeight: "600",
  },
  cardFooter: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 8,
  },
  inspectText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.accent,
  },
});
