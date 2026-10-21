import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SwitchHealth } from "@buymecart/shared-types";
import { theme } from "../theme";
import { Card } from "../components/Card";
import { StatusIndicator } from "../components/StatusIndicator";

export interface ServiceStatusScreenProps {
  onBack: () => void;
}

export const ServiceStatusScreen: React.FC<ServiceStatusScreenProps> = ({ onBack }) => {
  const switches: SwitchHealth[] = [
    { switchName: "NPCI IMPS Switch (Direct Host)", serviceType: "dmt", status: "operational", latencyMs: 94, successRate: 99.8, lastChecked: "10s ago" },
    { switchName: "UIDAI Biometric Auth Switch", serviceType: "aeps", status: "operational", latencyMs: 112, successRate: 99.4, lastChecked: "5s ago" },
    { switchName: "NPCI Bharat BillPay Central Unit", serviceType: "bbps", status: "operational", latencyMs: 88, successRate: 99.9, lastChecked: "12s ago" },
    { switchName: "NPCI UPI Switching Node", serviceType: "upi_switch", status: "operational", latencyMs: 65, successRate: 99.9, lastChecked: "3s ago" },
    { switchName: "Micro-ATM Card Switch Engine", serviceType: "micro_atm", status: "operational", latencyMs: 104, successRate: 99.5, lastChecked: "8s ago" },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>← Back to IBNK Overview</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Switch Status & Network Health</Text>
      <Text style={styles.subtitle}>
        Live latency metrics and operational status of all connected financial payment switches.
      </Text>

      <View style={styles.list}>
        {switches.map((s, idx) => (
          <Card key={idx} style={styles.switchCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.switchName}>{s.switchName}</Text>
                <Text style={styles.serviceRail}>{s.serviceType.toUpperCase()} Gateway Rail</Text>
              </View>
              <StatusIndicator status={s.status} label={s.status} />
            </View>

            <View style={styles.divider} />

            <View style={styles.metricsRow}>
              <View>
                <Text style={styles.metricLabel}>Switch Latency</Text>
                <Text style={styles.metricValue}>{s.latencyMs} ms</Text>
              </View>
              <View>
                <Text style={styles.metricLabel}>Success Rate</Text>
                <Text style={styles.metricValue}>{s.successRate}%</Text>
              </View>
              <View>
                <Text style={styles.metricLabel}>Last Ping</Text>
                <Text style={styles.metricValue}>{s.lastChecked}</Text>
              </View>
            </View>
          </Card>
        ))}
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
  list: {
    gap: 12,
  },
  switchCard: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  switchName: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  serviceRail: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 12,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metricLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
});
