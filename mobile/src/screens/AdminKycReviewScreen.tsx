import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { theme } from "../theme";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";

interface KycApplication {
  id: string;
  applicantName: string;
  businessName: string;
  role: "super_distributor" | "area_distributor" | "retailer";
  territory: string;
  panNumber: string;
  aadhaarMasked: string;
  bankAccountMasked: string;
  vkycStatus: "Verified" | "Recorded" | "Rejected";
  vkycCode: string;
  status: "Pending Review" | "Approved" | "Corrections Needed" | "Rejected";
  submittedAt: string;
  kitSerial: string;
}

const mockKycQueue: KycApplication[] = [
  {
    id: "APP-2026-9041",
    applicantName: "Ramesh Chandra Gupta",
    businessName: "Gupta Mini Banking Kendra",
    role: "retailer",
    territory: "Zone-01 Main Market",
    panNumber: "ABCDE1234F",
    aadhaarMasked: "•••• •••• 9012",
    bankAccountMasked: "•••• •••• 4291",
    vkycStatus: "Recorded",
    vkycCode: "729-418",
    status: "Pending Review",
    submittedAt: "Today, 14:20",
    kitSerial: "KIT-2026-8812",
  },
  {
    id: "APP-2026-8924",
    applicantName: "Vikram Malhotra",
    businessName: "Malhotra Telecom & Money",
    role: "area_distributor",
    territory: "Zone-02 Division",
    panNumber: "BKMPP9012K",
    aadhaarMasked: "•••• •••• 4421",
    bankAccountMasked: "•••• •••• 1009",
    vkycStatus: "Recorded",
    vkycCode: "492-019",
    status: "Pending Review",
    submittedAt: "Today, 11:45",
    kitSerial: "KIT-2026-7731",
  },
  {
    id: "APP-2026-8710",
    applicantName: "Sunil Verma",
    businessName: "Verma Digital Services",
    role: "area_distributor",
    territory: "Zone-01 Division",
    panNumber: "AABCS9912M",
    aadhaarMasked: "•••• •••• 1290",
    bankAccountMasked: "•••• •••• 8812",
    vkycStatus: "Verified",
    vkycCode: "109-882",
    status: "Approved",
    submittedAt: "Yesterday, 16:30",
    kitSerial: "KIT-2026-5541",
  },
  {
    id: "APP-2026-8511",
    applicantName: "Deepak Sharma",
    businessName: "Sharma Kirana Store",
    role: "retailer",
    territory: "Zone-01 Rural Outpost",
    panNumber: "CCCPD8812L",
    aadhaarMasked: "•••• •••• 6632",
    bankAccountMasked: "•••• •••• 3341",
    vkycStatus: "Rejected",
    vkycCode: "000-000",
    status: "Corrections Needed",
    submittedAt: "Oct 18, 10:15",
    kitSerial: "KIT-2026-4410",
  },
];

export const AdminKycReviewScreen: React.FC = () => {
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "corrections">("all");
  const [applications, setApplications] = useState<KycApplication[]>(mockKycQueue);
  const [selectedApp, setSelectedApp] = useState<KycApplication | null>(null);
  const [auditRemark, setAuditRemark] = useState("");

  const filteredApps = applications.filter((app) => {
    if (filter === "pending") return app.status === "Pending Review";
    if (filter === "approved") return app.status === "Approved";
    if (filter === "corrections") return app.status === "Corrections Needed";
    return true;
  });

  const handleAction = (newStatus: KycApplication["status"]) => {
    if (!selectedApp) return;
    setApplications((prev) =>
      prev.map((a) => (a.id === selectedApp.id ? { ...a, status: newStatus } : a))
    );
    Alert.alert("KYC Decision Logged", `Application ${selectedApp.id} has been marked as ${newStatus}.`);
    setSelectedApp(null);
    setAuditRemark("");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>KYC Verification & Onboarding Queue</Text>
      <Text style={styles.subtitle}>
        Review submitted dossiers, document proofs, 30s Video KYC, and issue decisions
      </Text>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {(["all", "pending", "approved", "corrections"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.activeFilterChip]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterChipText, filter === f && styles.activeFilterChipText]}>
              {f === "all"
                ? "All"
                : f === "pending"
                ? "Pending"
                : f === "approved"
                ? "Approved"
                : "Corrections"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Applications List */}
      <View style={styles.list}>
        {filteredApps.map((app) => (
          <Card key={app.id} style={styles.appCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.appName}>{app.applicantName}</Text>
                <Text style={styles.appBusiness}>{app.businessName}</Text>
                <Text style={styles.appSub}>
                  {app.id} · {app.role.toUpperCase()} · {app.territory}
                </Text>
              </View>
              <Badge
                label={app.status.toUpperCase()}
                variant={
                  app.status === "Approved"
                    ? "emerald"
                    : app.status === "Pending Review"
                    ? "amber"
                    : "rose"
                }
              />
            </View>

            <View style={styles.kycSummaryBox}>
              <Text style={styles.summaryText}>• PAN: {app.panNumber}</Text>
              <Text style={styles.summaryText}>• Aadhaar: {app.aadhaarMasked}</Text>
              <Text style={styles.summaryText}>• Bank: {app.bankAccountMasked} (Penny Drop OK)</Text>
              <Text style={styles.summaryText}>
                • Video KYC: {app.vkycStatus} (Recited: {app.vkycCode})
              </Text>
              <Text style={styles.summaryText}>• Kit Assigned: {app.kitSerial}</Text>
            </View>

            <Button
              title="Review Dossier & Decide"
              size="sm"
              onPress={() => setSelectedApp(app)}
            />
          </Card>
        ))}
      </View>

      {/* Review Dossier Modal */}
      <Modal visible={!!selectedApp} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            {selectedApp && (
              <>
                <Text style={styles.modalTitle}>KYC Dossier Review</Text>
                <Text style={styles.modalSub}>
                  {selectedApp.applicantName} ({selectedApp.id})
                </Text>

                <View style={styles.dossierSection}>
                  <Text style={styles.dossierSectionTitle}>Document Verification Proofs</Text>
                  <Text style={styles.dossierItem}>✓ PAN Verified via NSDL: {selectedApp.panNumber}</Text>
                  <Text style={styles.dossierItem}>✓ Aadhaar Masked: {selectedApp.aadhaarMasked}</Text>
                  <Text style={styles.dossierItem}>✓ Bank Account: {selectedApp.bankAccountMasked}</Text>
                  <Text style={styles.dossierItem}>✓ Penny Drop: ₹1.00 Credit Verified</Text>
                  <Text style={styles.dossierItem}>
                    ✓ 30s Video KYC: Recitation Code {selectedApp.vkycCode} Confirmed
                  </Text>
                  <Text style={styles.dossierItem}>✓ Assigned Kit: {selectedApp.kitSerial}</Text>
                </View>

                <Text style={styles.remarkLabel}>Audit Justification / Remarks:</Text>
                <TextInput
                  style={styles.remarkInput}
                  placeholder="Enter audit review comments..."
                  value={auditRemark}
                  onChangeText={setAuditRemark}
                  multiline
                />

                <View style={styles.modalActions}>
                  <Button
                    title="✓ Approve Application"
                    onPress={() => handleAction("Approved")}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Request Corrections"
                    variant="outline"
                    onPress={() => handleAction("Corrections Needed")}
                    style={{ flex: 1 }}
                  />
                </View>

                <Button
                  title="Close Without Decision"
                  variant="ghost"
                  size="sm"
                  onPress={() => setSelectedApp(null)}
                  style={{ marginTop: 8 }}
                />
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
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
  filterRow: {
    flexDirection: "row",
    gap: 8,
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
    gap: 12,
  },
  appCard: {
    padding: 14,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  appName: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  appBusiness: {
    fontSize: 12,
    color: theme.colors.tealDark,
    fontWeight: "700",
  },
  appSub: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  kycSummaryBox: {
    backgroundColor: theme.colors.surfaceSubtle,
    padding: 10,
    borderRadius: theme.borderRadius.md,
    gap: 4,
  },
  summaryText: {
    fontSize: 11,
    color: theme.colors.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(16, 28, 50, 0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: theme.borderRadius.xl,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: theme.colors.primary,
  },
  modalSub: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: 14,
  },
  dossierSection: {
    backgroundColor: theme.colors.surfaceSubtle,
    padding: 14,
    borderRadius: theme.borderRadius.md,
    gap: 6,
    marginBottom: 14,
  },
  dossierSectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.primary,
    marginBottom: 4,
  },
  dossierItem: {
    fontSize: 11,
    color: theme.colors.textPrimary,
  },
  remarkLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.primary,
    marginBottom: 6,
  },
  remarkInput: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.borderRadius.md,
    padding: 10,
    fontSize: 12,
    minHeight: 60,
    marginBottom: 14,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    gap: 8,
  },
});
