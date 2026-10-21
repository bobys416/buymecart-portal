import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { theme } from "../theme";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";

interface AuditLogEntry {
  id: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  timestamp: string;
  ip: string;
  category: "KYC" | "FUNDS" | "ACCESS" | "SECURITY";
}

interface MakerCheckerItem {
  id: string;
  title: string;
  requester: string;
  role: string;
  amount?: string;
  targetTenant: string;
  details: string;
  timestamp: string;
}

const mockAuditLogs: AuditLogEntry[] = [
  {
    id: "AUD-9901",
    actor: "Admin Master User",
    role: "Admin",
    action: "Approved Retailer KYC Dossier (APP-2026-8710)",
    target: "Verma Digital Services",
    timestamp: "10 mins ago",
    ip: "10.0.1.15",
    category: "KYC",
  },
  {
    id: "AUD-9902",
    actor: "Central Spark FinTech",
    role: "Super Distributor",
    action: "Allocated Credit Limit of ₹5,00,000",
    target: "AD Sunil Verma (Zone-01)",
    timestamp: "45 mins ago",
    ip: "10.0.4.88",
    category: "FUNDS",
  },
  {
    id: "AUD-9903",
    actor: "Sunil Verma",
    role: "Area Distributor",
    action: "Submitted Onboarding Application with 30s Video KYC",
    target: "Ramesh Chandra Gupta",
    timestamp: "1 hour ago",
    ip: "10.0.8.21",
    category: "KYC",
  },
  {
    id: "AUD-9904",
    actor: "System Security Sentinel",
    role: "System Engine",
    action: "Biometric Authentication Verified",
    target: "Mobile Terminal Session #7721",
    timestamp: "2 hours ago",
    ip: "10.0.1.10",
    category: "SECURITY",
  },
];

const mockMakerCheckerQueue: MakerCheckerItem[] = [
  {
    id: "MC-2026-001",
    title: "Super Distributor Limit Escalation",
    requester: "Ops Manager Rajiv Nair",
    role: "Level-1 Maker",
    amount: "₹15,00,000",
    targetTenant: "SD-WEST-02",
    details: "Seasonal liquidity surge request for festival remittance period.",
    timestamp: "Today, 12:15",
  },
  {
    id: "MC-2026-002",
    title: "Upstream Switch Gateway Failover",
    requester: "Infrastructure Admin Alok Sen",
    role: "System Architect",
    targetTenant: "NPCI IMPS Switch 2",
    details: "Scheduled latency optimization route switchover.",
    timestamp: "Today, 10:40",
  },
];

export const AdminAuditHistoryScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"audit" | "maker_checker">("audit");
  const [makerCheckerItems, setMakerCheckerItems] = useState(mockMakerCheckerQueue);

  const handleMakerCheckerDecision = (id: string, decision: "Approved" | "Rejected") => {
    setMakerCheckerItems((prev) => prev.filter((item) => item.id !== id));
    Alert.alert("Dual Authorization Signed", `Request ${id} has been ${decision} by Admin Checker.`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Audit History & Dual Authorization</Text>
      <Text style={styles.subtitle}>
        Immutable audit trail of all operational events and Maker-Checker requests
      </Text>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "audit" && styles.activeTabBtn]}
          onPress={() => setActiveTab("audit")}
        >
          <Text style={[styles.tabBtnText, activeTab === "audit" && styles.activeTabBtnText]}>
            Audit Log Stream ({mockAuditLogs.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "maker_checker" && styles.activeTabBtn]}
          onPress={() => setActiveTab("maker_checker")}
        >
          <Text style={[styles.tabBtnText, activeTab === "maker_checker" && styles.activeTabBtnText]}>
            Maker-Checker Signoffs ({makerCheckerItems.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "audit" ? (
        /* Audit Log Stream */
        <View style={styles.list}>
          {mockAuditLogs.map((log) => (
            <Card key={log.id} style={styles.logCard}>
              <View style={styles.logHeader}>
                <View>
                  <Text style={styles.logActor}>{log.actor}</Text>
                  <Text style={styles.logRole}>{log.role}</Text>
                </View>
                <Badge
                  label={log.category}
                  variant={
                    log.category === "KYC"
                      ? "teal"
                      : log.category === "FUNDS"
                      ? "emerald"
                      : "navy"
                  }
                />
              </View>

              <Text style={styles.logAction}>{log.action}</Text>
              <Text style={styles.logTarget}>Target: {log.target}</Text>

              <View style={styles.logFooter}>
                <Text style={styles.logMeta}>{log.timestamp}</Text>
                <Text style={styles.logMeta}>IP: {log.ip}</Text>
              </View>
            </Card>
          ))}
        </View>
      ) : (
        /* Maker Checker Approvals */
        <View style={styles.list}>
          {makerCheckerItems.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>✓ All Maker-Checker queues are fully authorized.</Text>
            </View>
          ) : (
            makerCheckerItems.map((item) => (
              <Card key={item.id} style={styles.mcCard}>
                <View style={styles.mcHeader}>
                  <View>
                    <Text style={styles.mcTitle}>{item.title}</Text>
                    <Text style={styles.mcId}>{item.id} · {item.targetTenant}</Text>
                  </View>
                  <Badge label="REQUIRES CHECKER" variant="amber" />
                </View>

                {item.amount && (
                  <Text style={styles.mcAmount}>Value: {item.amount}</Text>
                )}

                <Text style={styles.mcDetails}>{item.details}</Text>
                <Text style={styles.mcRequester}>
                  Initiated by {item.requester} ({item.role}) at {item.timestamp}
                </Text>

                <View style={styles.mcActions}>
                  <Button
                    title="✓ Dual Signoff (Approve)"
                    size="sm"
                    onPress={() => handleMakerCheckerDecision(item.id, "Approved")}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Reject"
                    variant="danger"
                    size="sm"
                    onPress={() => handleMakerCheckerDecision(item.id, "Rejected")}
                    style={{ flex: 1 }}
                  />
                </View>
              </Card>
            ))
          )}
        </View>
      )}
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
  tabRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeTabBtn: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.textSecondary,
  },
  activeTabBtnText: {
    color: "#FFFFFF",
  },
  list: {
    gap: 12,
  },
  logCard: {
    padding: 14,
    gap: 6,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  logActor: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  logRole: {
    fontSize: 10,
    color: theme.colors.tealDark,
    fontWeight: "700",
  },
  logAction: {
    fontSize: 12,
    color: theme.colors.textPrimary,
    fontWeight: "600",
    marginTop: 2,
  },
  logTarget: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  logFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    paddingTop: 6,
  },
  logMeta: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  mcCard: {
    padding: 14,
    gap: 8,
  },
  mcHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  mcTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  mcId: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  mcAmount: {
    fontSize: 15,
    fontWeight: "900",
    color: theme.colors.tealDark,
  },
  mcDetails: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  mcRequester: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  mcActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    color: theme.colors.success,
    fontWeight: "700",
  },
});
