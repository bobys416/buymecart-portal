import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { theme } from "../theme";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";

export interface SuperDistributorOverviewScreenProps {
  onNavigateToAds?: () => void;
  onNavigateToOnboarding?: () => void;
  onNavigateToReports?: () => void;
}

export const SuperDistributorOverviewScreen: React.FC<SuperDistributorOverviewScreenProps> = ({
  onNavigateToAds,
  onNavigateToOnboarding,
  onNavigateToReports,
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
          ⚡ DEV FIXTURE · SUPER DISTRIBUTOR PORTAL (SD-CENTRAL-01)
        </Text>
      </View>

      {/* Screen Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Super Distributor Portal</Text>
        <Text style={styles.subtitle}>
          Central Spark FinTech Pvt Ltd · Central India Division
        </Text>
      </View>

      {/* Pool Balance Card */}
      <Card style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Allocated Pool Balance</Text>
        <Text style={styles.balanceValue}>₹8,45,000.00</Text>
        <Text style={styles.balanceSub}>
          Credit Line Limit: ₹25,00,000 · Available Liquidity: 33.8%
        </Text>

        <View style={styles.balanceFooter}>
          <Badge label="LEVEL-3 VERIFIED" variant="emerald" />
          <Badge label="ZONE-01 HEAD" variant="navy" />
        </View>
      </Card>

      {/* Key Metrics */}
      <View style={styles.metricsGrid}>
        <Card style={styles.metricCard}>
          <Text style={styles.metricLabel}>Assigned ADs</Text>
          <Text style={styles.metricValue}>8 ADs</Text>
          <Text style={styles.metricSub}>100% Operational</Text>
        </Card>

        <Card style={styles.metricCard}>
          <Text style={styles.metricLabel}>Network Retailers</Text>
          <Text style={styles.metricValue}>142 Stores</Text>
          <Text style={styles.metricSub}>Across 4 Zones</Text>
        </Card>

        <Card style={styles.metricCard}>
          <Text style={styles.metricLabel}>Today's Turnout</Text>
          <Text style={styles.metricValue}>₹28,64,200</Text>
          <Badge label="+12.4% vs yday" variant="emerald" />
        </Card>

        <Card style={styles.metricCard}>
          <Text style={styles.metricLabel}>Commission Ledger</Text>
          <Text style={styles.metricValue}>₹14,280.00</Text>
          <Badge label="Tempered Split" variant="teal" />
        </Card>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionHeading}>Management Actions</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionCard} onPress={onNavigateToAds}>
          <Text style={styles.actionIcon}>🏢</Text>
          <Text style={styles.actionTitle}>Area Distributors</Text>
          <Text style={styles.actionDesc}>Manage limits & territories</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={onNavigateToOnboarding}>
          <Text style={styles.actionIcon}>📝</Text>
          <Text style={styles.actionTitle}>AD Onboarding</Text>
          <Text style={styles.actionDesc}>2 requests pending admin</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={onNavigateToReports}>
          <Text style={styles.actionIcon}>📊</Text>
          <Text style={styles.actionTitle}>Fund Ledger</Text>
          <Text style={styles.actionDesc}>Statutory commissions</Text>
        </TouchableOpacity>
      </View>

      {/* Territory Scoping Notice */}
      <Card style={styles.scopingCard}>
        <Text style={styles.scopingTitle}>Territorial Authorization Note</Text>
        <Text style={styles.scopingDesc}>
          Your channel operations are authorized exclusively for Central India Division. Downline merchant transactions automatically credit statutory Tempered Margin commissions to your pool account.
        </Text>
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
  balanceCard: {
    padding: 16,
    backgroundColor: theme.colors.primary,
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 11,
    color: theme.colors.tealLight,
    fontWeight: "700",
  },
  balanceValue: {
    fontSize: 26,
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
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
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
  scopingCard: {
    padding: 14,
    backgroundColor: theme.colors.surfaceSubtle,
  },
  scopingTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.primary,
    marginBottom: 4,
  },
  scopingDesc: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
});
