import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { theme } from "../theme";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";

interface TerminalReport {
  id: string;
  terminalName: string;
  retailerName: string;
  service: "AEPS" | "DMT" | "BBPS" | "MicroATM";
  txCount: number;
  grossVolume: number;
  adCommission: number;
  timestamp: string;
}

const mockTerminalReports: TerminalReport[] = [
  {
    id: "TRM-01",
    terminalName: "POS-Z01-001",
    retailerName: "Patel Digital Kendra",
    service: "AEPS",
    txCount: 42,
    grossVolume: 126000,
    adCommission: 1260.0,
    timestamp: "Today, 15:45",
  },
  {
    id: "TRM-02",
    terminalName: "POS-Z01-002",
    retailerName: "Mahaveer Kirana & Pay",
    service: "DMT",
    txCount: 28,
    grossVolume: 64200,
    adCommission: 963.0,
    timestamp: "Today, 14:30",
  },
  {
    id: "TRM-03",
    terminalName: "POS-Z01-003",
    retailerName: "Gupta Mini Banking",
    service: "BBPS",
    txCount: 19,
    grossVolume: 18500,
    adCommission: 277.5,
    timestamp: "Today, 12:15",
  },
  {
    id: "TRM-04",
    terminalName: "POS-Z01-004",
    retailerName: "Deepak Communications",
    service: "MicroATM",
    txCount: 15,
    grossVolume: 9700,
    adCommission: 145.5,
    timestamp: "Today, 11:00",
  },
];

export const AreaDistributorReportsScreen: React.FC = () => {
  const [filter, setFilter] = useState<string>("all");

  const filtered = mockTerminalReports.filter(
    (t) => filter === "all" || t.service === filter
  );

  const totalEarnings = filtered.reduce((acc, i) => acc + i.adCommission, 0);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Area Daily Reports & Ledger</Text>
      <Text style={styles.subtitle}>
        Authorized terminal transaction feed and statutory commission statements for Zone-01
      </Text>

      {/* Summary Card */}
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>AD Commission Total (Today)</Text>
        <Text style={styles.summaryVal}>
          ₹{totalEarnings.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </Text>
        <Text style={styles.summarySub}>
          Calculated via Tempered Margin statutory schedule.
        </Text>
      </Card>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {["all", "AEPS", "DMT", "BBPS", "MicroATM"].map((svc) => (
          <TouchableOpacity
            key={svc}
            style={[styles.filterChip, filter === svc && styles.activeFilterChip]}
            onPress={() => setFilter(svc)}
          >
            <Text style={[styles.filterChipText, filter === svc && styles.activeFilterChipText]}>
              {svc === "all" ? "All Rails" : svc}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Terminal Transaction Cards */}
      <View style={styles.list}>
        {filtered.map((item) => (
          <Card key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.retailerName}>{item.retailerName}</Text>
                <Text style={styles.terminalName}>
                  {item.terminalName} · {item.timestamp}
                </Text>
              </View>
              <Badge label={item.service} variant="teal" />
            </View>

            <View style={styles.detailsRow}>
              <View>
                <Text style={styles.metaLabel}>Transactions / Swipes</Text>
                <Text style={styles.metaVal}>{item.txCount} txs</Text>
              </View>
              <View>
                <Text style={styles.metaLabel}>Gross Volume</Text>
                <Text style={styles.metaVal}>₹{item.grossVolume.toLocaleString("en-IN")}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.metaLabel}>AD Earning</Text>
                <Text style={styles.commissionVal}>
                  +₹{item.adCommission.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </Text>
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
    padding: 16,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: theme.colors.primary,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
    marginBottom: 14,
  },
  summaryCard: {
    padding: 16,
    backgroundColor: theme.colors.primary,
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 11,
    color: theme.colors.tealLight,
    fontWeight: "700",
  },
  summaryVal: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
    marginVertical: 4,
  },
  summarySub: {
    fontSize: 11,
    color: "#CBD5E1",
  },
  filterRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeFilterChip: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.textSecondary,
  },
  activeFilterChipText: {
    color: "#FFFFFF",
  },
  list: {
    gap: 10,
  },
  card: {
    padding: 12,
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  retailerName: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  terminalName: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: theme.colors.surfaceSubtle,
    padding: 8,
    borderRadius: theme.borderRadius.md,
  },
  metaLabel: {
    fontSize: 9,
    color: theme.colors.textSecondary,
  },
  metaVal: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  commissionVal: {
    fontSize: 12,
    fontWeight: "900",
    color: theme.colors.success,
  },
});
