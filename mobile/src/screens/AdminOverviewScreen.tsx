import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { theme } from "../theme";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";

export interface AdminOverviewScreenProps {
  onNavigateToNetwork?: () => void;
  onNavigateToKyc?: () => void;
  onNavigateToAudit?: () => void;
}

export const AdminOverviewScreen: React.FC<AdminOverviewScreenProps> = ({
  onNavigateToNetwork,
  onNavigateToKyc,
  onNavigateToAudit,
}) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {/* Dev Mode Banner */}
      <View style={styles.devBanner}>
        <Text style={styles.devBannerText}>
          ⚡ DEV FIXTURE ACTIVE · SYSTEM-WIDE ADMIN CONSOLE
        </Text>
      </View>

      {/* Screen Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Admin Control Center</Text>
        <Text style={styles.subtitle}>
          System-wide performance, regulatory compliance, and channel distribution
        </Text>
      </View>

      {/* KPI Grid */}
      <View style={styles.kpiGrid}>
        <Card style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Total Settlement</Text>
          <Text style={styles.kpiValue}>₹1,42,85,600</Text>
          <View style={styles.kpiFooter}>
            <Badge label="+18.4% today" variant="emerald" />
          </View>
        </Card>

        <Card style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Tempered Margin Pool</Text>
          <Text style={styles.kpiValue}>₹4,89,120</Text>
          <View style={styles.kpiFooter}>
            <Badge label="Statutory Share" variant="teal" />
          </View>
        </Card>

        <Card style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Super Distributors</Text>
          <Text style={styles.kpiValue}>14 Active</Text>
          <View style={styles.kpiFooter}>
            <Text style={styles.kpiSub}>100% Verified</Text>
          </View>
        </Card>

        <Card style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Area Distributors</Text>
          <Text style={styles.kpiValue}>68 Active</Text>
          <View style={styles.kpiFooter}>
            <Text style={styles.kpiSub}>4 Regions</Text>
          </View>
        </Card>

        <Card style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Retailer Merchants</Text>
          <Text style={styles.kpiValue}>412 Active</Text>
          <View style={styles.kpiFooter}>
            <Text style={styles.kpiSub}>18 Pending KYC</Text>
          </View>
        </Card>

        <Card style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Switch Uptime</Text>
          <Text style={styles.kpiValue}>99.98%</Text>
          <View style={styles.kpiFooter}>
            <Badge label="NPCI Normal" variant="emerald" />
          </View>
        </Card>
      </View>

      {/* Quick Action Shortcuts */}
      <Text style={styles.sectionHeading}>Administrative Quick Actions</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionCard} onPress={onNavigateToKyc}>
          <Text style={styles.actionIcon}>📋</Text>
          <Text style={styles.actionTitle}>Review KYC Queue</Text>
          <Text style={styles.actionDesc}>18 pending applicant dossiers</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={onNavigateToNetwork}>
          <Text style={styles.actionIcon}>👥</Text>
          <Text style={styles.actionTitle}>Channel Hierarchy</Text>
          <Text style={styles.actionDesc}>SD, AD & Retailer directory</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={onNavigateToAudit}>
          <Text style={styles.actionIcon}>🛡️</Text>
          <Text style={styles.actionTitle}>Audit Stream</Text>
          <Text style={styles.actionDesc}>Maker-Checker signoffs</Text>
        </TouchableOpacity>
      </View>

      {/* Switch Telemetry Status */}
      <Card style={styles.telemetryCard}>
        <Text style={styles.telemetryTitle}>Upstream Switch Gateway Latency</Text>
        <View style={styles.telemetryRow}>
          <Text style={styles.telemetryLabel}>NPCI IMPS Switch:</Text>
          <Text style={styles.telemetryVal}>78ms · Operational</Text>
        </View>
        <View style={styles.telemetryRow}>
          <Text style={styles.telemetryLabel}>AEPS Biometric Switch:</Text>
          <Text style={styles.telemetryVal}>112ms · Operational</Text>
        </View>
        <View style={styles.telemetryRow}>
          <Text style={styles.telemetryLabel}>BBPS Bharat BillPay:</Text>
          <Text style={styles.telemetryVal}>94ms · Operational</Text>
        </View>
      </Card>
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
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  kpiCard: {
    width: "48%",
    padding: 12,
  },
  kpiLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: "600",
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: "900",
    color: theme.colors.primary,
    marginVertical: 4,
  },
  kpiFooter: {
    marginTop: 2,
  },
  kpiSub: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.primary,
    marginBottom: 10,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  actionCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
  },
  actionIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  actionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: theme.colors.primary,
    textAlign: "center",
  },
  actionDesc: {
    fontSize: 9,
    color: theme.colors.textMuted,
    textAlign: "center",
    marginTop: 2,
  },
  telemetryCard: {
    padding: 14,
    gap: 8,
  },
  telemetryTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.primary,
    marginBottom: 4,
  },
  telemetryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  telemetryLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  telemetryVal: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.tealDark,
  },
});
