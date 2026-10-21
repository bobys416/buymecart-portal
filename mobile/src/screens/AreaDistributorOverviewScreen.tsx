import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { theme } from "../theme";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { MobileKycScreen } from "./MobileKycScreen";

export interface AreaDistributorOverviewScreenProps {
  onNavigateToRetailers?: () => void;
  onNavigateToKycQueue?: () => void;
  onNavigateToReports?: () => void;
}

export const AreaDistributorOverviewScreen: React.FC<AreaDistributorOverviewScreenProps> = ({
  onNavigateToRetailers,
  onNavigateToKycQueue,
  onNavigateToReports,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [showKycWizard, setShowKycWizard] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  if (showKycWizard) {
    return (
      <MobileKycScreen
        initiatorRole="area_distributor"
        targetRole="retailer"
        onComplete={() => setShowKycWizard(false)}
        onCancel={() => setShowKycWizard(false)}
      />
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {/* Dev Mode Banner */}
      <View style={styles.devBanner}>
        <Text style={styles.devBannerText}>
          ⚡ DEV FIXTURE · AREA DISTRIBUTOR PORTAL (AD-ZONE-01)
        </Text>
      </View>

      {/* Screen Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Area Distributor Desk</Text>
        <Text style={styles.subtitle}>
          Sunil Verma · Assigned Territory: Zone-01 Division
        </Text>
      </View>

      {/* Primary Liquidity Card */}
      <Card style={styles.liquidityCard}>
        <Text style={styles.liquidityLabel}>AD Operating Float Balance</Text>
        <Text style={styles.liquidityValue}>₹1,85,000.00</Text>
        <Text style={styles.liquiditySub}>
          Parent SD: Central Spark FinTech (SD-CENTRAL-01) · Limit: ₹5,00,000
        </Text>

        <View style={styles.liquidityFooter}>
          <Badge label="ZONE-01 ACTIVE" variant="emerald" />
          <Badge label="AEPS/DMT RAILS" variant="teal" />
        </View>
      </Card>

      {/* Key Metrics Grid */}
      <View style={styles.metricsGrid}>
        <Card style={styles.metricCard}>
          <Text style={styles.metricLabel}>Assigned Retailers</Text>
          <Text style={styles.metricValue}>24 Active</Text>
          <Text style={styles.metricSub}>3 Pending KYC</Text>
        </Card>

        <Card style={styles.metricCard}>
          <Text style={styles.metricLabel}>Today's Volume</Text>
          <Text style={styles.metricValue}>₹2,18,400</Text>
          <Badge label="104 Swipes/Tx" variant="teal" />
        </Card>

        <Card style={styles.metricCard}>
          <Text style={styles.metricLabel}>Today's AD Share</Text>
          <Text style={styles.metricValue}>₹3,276.00</Text>
          <Badge label="Auto-Credited" variant="emerald" />
        </Card>

        <Card style={styles.metricCard}>
          <Text style={styles.metricLabel}>Logistics Kits</Text>
          <Text style={styles.metricValue}>6 Available</Text>
          <Text style={styles.metricSub}>For Handover</Text>
        </Card>
      </View>

      {/* Action Banner: Onboard New Retailer */}
      <Card style={styles.actionCard}>
        <Text style={styles.actionTitle}>Onboard New Merchant / Retailer</Text>
        <Text style={styles.actionDesc}>
          Register a retail outlet in Zone-01 with full 12-point KYC, camera proof uploads, and mandatory 30-second Video KYC recording.
        </Text>
        <Button
          title="+ Launch Retailer KYC Wizard"
          onPress={() => setShowKycWizard(true)}
          size="md"
        />
      </Card>

      {/* Quick Nav Row */}
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.navCard} onPress={onNavigateToRetailers}>
          <Text style={styles.navIcon}>🏪</Text>
          <Text style={styles.navTitle}>Retailer Directory</Text>
          <Text style={styles.navDesc}>Balance & kit status</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navCard} onPress={onNavigateToKycQueue}>
          <Text style={styles.navIcon}>📋</Text>
          <Text style={styles.navTitle}>KYC Corrections</Text>
          <Text style={styles.navDesc}>3 require re-upload</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navCard} onPress={onNavigateToReports}>
          <Text style={styles.navIcon}>📈</Text>
          <Text style={styles.navTitle}>Daily Reports</Text>
          <Text style={styles.navDesc}>Terminal tx statements</Text>
        </TouchableOpacity>
      </View>
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
  liquidityCard: {
    padding: 16,
    backgroundColor: theme.colors.primary,
    marginBottom: 16,
  },
  liquidityLabel: {
    fontSize: 11,
    color: theme.colors.tealLight,
    fontWeight: "700",
  },
  liquidityValue: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
    marginVertical: 4,
  },
  liquiditySub: {
    fontSize: 11,
    color: "#CBD5E1",
    marginBottom: 12,
  },
  liquidityFooter: {
    flexDirection: "row",
    gap: 8,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    width: "48%",
    padding: 12,
  },
  metricLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: "600",
  },
  metricValue: {
    fontSize: 17,
    fontWeight: "900",
    color: theme.colors.primary,
    marginVertical: 4,
  },
  metricSub: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  actionCard: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: theme.colors.teal,
    marginBottom: 16,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.primary,
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    lineHeight: 16,
    marginBottom: 12,
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
});
