import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { theme } from "../theme";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";

interface CommissionStatement {
  id: string;
  date: string;
  adSource: string;
  service: "AEPS" | "DMT" | "BBPS" | "MicroATM";
  volume: number;
  sdCommission: number;
  status: "Settled" | "Processing";
}

const mockCommissionLedger: CommissionStatement[] = [
  {
    id: "COM-2026-401",
    date: "Today, 15:30",
    adSource: "Sunil Verma (Zone-01)",
    service: "DMT",
    volume: 1250000,
    sdCommission: 6250.0,
    status: "Settled",
  },
  {
    id: "COM-2026-402",
    date: "Today, 14:15",
    adSource: "Pooja Sharma (Zone-02)",
    service: "AEPS",
    volume: 840000,
    sdCommission: 4200.0,
    status: "Settled",
  },
  {
    id: "COM-2026-403",
    date: "Today, 12:00",
    adSource: "Kavita Singh (Zone-04)",
    service: "BBPS",
    volume: 480000,
    sdCommission: 2400.0,
    status: "Settled",
  },
  {
    id: "COM-2026-404",
    date: "Today, 10:45",
    adSource: "Mukesh Yadav (Zone-03)",
    service: "MicroATM",
    volume: 294200,
    sdCommission: 1471.0,
    status: "Settled",
  },
];

export const SuperDistributorReportsScreen: React.FC = () => {
  const [selectedService, setSelectedService] = useState<string>("all");

  const filtered = mockCommissionLedger.filter(
    (item) => selectedService === "all" || item.service === selectedService
  );

  const totalCommissions = filtered.reduce((acc, i) => acc + i.sdCommission, 0);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Fund & Commercial Reports</Text>
      <Text style={styles.subtitle}>
        Authorized statutory Tempered Margin earnings & downline network ledger
      </Text>

      {/* Summary Card */}
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Net Commission (Filtered)</Text>
        <Text style={styles.summaryVal}>₹{totalCommissions.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</Text>
        <Text style={styles.summaryDesc}>
          Direct statutory split from {filtered.length} downline Area Distributor batches.
        </Text>
      </Card>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {["all", "AEPS", "DMT", "BBPS", "MicroATM"].map((svc) => (
          <TouchableOpacity
            key={svc}
            style={[styles.filterTab, selectedService === svc && styles.activeFilterTab]}
            onPress={() => setSelectedService(svc)}
          >
            <Text style={[styles.filterTabText, selectedService === svc && styles.activeFilterTabText]}>
              {svc === "all" ? "All Rails" : svc}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Ledger Feed */}
      <View style={styles.list}>
        {filtered.map((item) => (
          <Card key={item.id} style={styles.ledgerCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.adName}>{item.adSource}</Text>
                <Text style={styles.meta}>
                  {item.id} · {item.date}
                </Text>
              </View>
              <Badge label={item.service} variant="teal" />
            </View>

            <View style={styles.detailsRow}>
              <View>
                <Text style={styles.detailLabel}>Network Volume</Text>
                <Text style={styles.detailVal}>₹{item.volume.toLocaleString("en-IN")}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.detailLabel}>SD Earning</Text>
                <Text style={styles.earningVal}>
                  +₹{item.sdCommission.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
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
  summaryDesc: {
    fontSize: 11,
    color: "#CBD5E1",
  },
  filterTabs: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 14,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeFilterTab: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.textSecondary,
  },
  activeFilterTabText: {
    color: "#FFFFFF",
  },
  list: {
    gap: 10,
  },
  ledgerCard: {
    padding: 12,
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  adName: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  meta: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceSubtle,
    padding: 8,
    borderRadius: theme.borderRadius.md,
  },
  detailLabel: {
    fontSize: 9,
    color: theme.colors.textSecondary,
  },
  detailVal: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  earningVal: {
    fontSize: 13,
    fontWeight: "900",
    color: theme.colors.success,
  },
});
