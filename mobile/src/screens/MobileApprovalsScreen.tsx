import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from "react-native";
import { MakerCheckerApproval } from "@buymecart/shared-types";
import { makerCheckerSignoffSchema } from "@buymecart/validation";
import { theme } from "../theme";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { InputField } from "../components/InputField";

export interface MobileApprovalsScreenProps {
  onBack: () => void;
}

export const MobileApprovalsScreen: React.FC<MobileApprovalsScreenProps> = ({ onBack }) => {
  // Zero dummy data initial state
  const [approvals, setApprovals] = useState<MakerCheckerApproval[]>([]);
  const [activeModal, setActiveModal] = useState<{
    approval: MakerCheckerApproval;
    action: "APPROVE" | "REJECT";
  } | null>(null);

  const [auditJustification, setAuditJustification] = useState("");
  const [otpCode, setOtpCode] = useState("123456");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSimulateApprovalRequest = () => {
    const demoReq: MakerCheckerApproval = {
      id: `appr-${Date.now()}`,
      actionCode: "SETTLEMENT_RELEASE",
      title: "Batch Settlement Release Override (₹4,50,000)",
      requesterName: "Devendra Verma",
      requesterRole: "Operations Lead (Maker)",
      targetTenant: "TENANT-CENTRAL-SETTLE",
      proposedChanges: "Manual release of withheld high-velocity settlement batch after KYC audit.",
      riskSeverity: "High",
      status: "PENDING_DUAL_AUTH",
      makerTimestamp: new Date().toISOString(),
    };
    setApprovals([demoReq, ...approvals]);
  };

  const handleConfirmDecision = () => {
    if (!activeModal) return;
    setErrorMsg(null);

    const parsed = makerCheckerSignoffSchema.safeParse({
      approvalId: activeModal.approval.id,
      action: activeModal.action,
      auditJustification,
      otpConfirmation: otpCode,
    });

    if (!parsed.success) {
      setErrorMsg(parsed.error.errors[0]?.message || "Validation failed");
      return;
    }

    const updated = approvals.map((a) => {
      if (a.id === activeModal.approval.id) {
        return {
          ...a,
          status: (activeModal.action === "APPROVE" ? "APPROVED" : "REJECTED") as MakerCheckerApproval["status"],
          checkerSignoff: {
            checkerName: "Senior Admin Checker",
            checkerTimestamp: new Date().toISOString(),
            auditJustification,
          },
        };
      }
      return a;
    });

    setApprovals(updated);
    setActiveModal(null);
    setAuditJustification("");
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>← Back to AI Dashboard</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Maker-Checker Privileged Approvals</Text>
        <Text style={styles.subtitle}>
          Two-man governance rule: Sensitive actions require secondary authorized signoff.
        </Text>
      </View>

      {/* Approvals List or Zero Dummy Data Empty State */}
      {approvals.length === 0 ? (
        <ScrollView contentContainerStyle={styles.emptyContainer}>
          <EmptyState
            title="No pending privileged actions"
            description="The Maker-Checker approval queue is clear. High-impact operations requiring dual-signoff will appear here."
            actionLabel="+ Simulate High-Impact Request"
            onAction={handleSimulateApprovalRequest}
          />
        </ScrollView>
      ) : (
        <FlatList
          data={approvals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.titleWrapper}>
                  <Text style={styles.actionCode}>{item.actionCode}</Text>
                  <Text style={styles.requestTitle}>{item.title}</Text>
                </View>
                <Badge
                  label={item.status.replace("_", " ")}
                  variant={
                    item.status === "APPROVED"
                      ? "emerald"
                      : item.status === "REJECTED"
                      ? "rose"
                      : "amber"
                  }
                  size="sm"
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Maker Requester:</Text>
                <Text style={styles.detailVal}>
                  {item.requesterName} ({item.requesterRole})
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Target Scope:</Text>
                <Text style={styles.detailVal}>{item.targetTenant}</Text>
              </View>

              <Text style={styles.changesLabel}>Proposed Changes:</Text>
              <Text style={styles.changesDesc}>{item.proposedChanges}</Text>

              {item.status === "PENDING_DUAL_AUTH" && (
                <View style={styles.actionBtnsRow}>
                  <Button
                    title="✓ Approve Action"
                    onPress={() => setActiveModal({ approval: item, action: "APPROVE" })}
                    size="sm"
                    style={styles.approveBtn}
                  />
                  <Button
                    title="✕ Reject"
                    onPress={() => setActiveModal({ approval: item, action: "REJECT" })}
                    variant="danger"
                    size="sm"
                  />
                </View>
              )}

              {item.checkerSignoff && (
                <View style={styles.signoffBox}>
                  <Text style={styles.signoffTitle}>
                    Checker Decision Logged ({item.status}):
                  </Text>
                  <Text style={styles.signoffNotes}>
                    "{item.checkerSignoff.auditJustification}"
                  </Text>
                  <Text style={styles.signoffTime}>
                    By {item.checkerSignoff.checkerName} at{" "}
                    {new Date(item.checkerSignoff.checkerTimestamp).toLocaleTimeString()}
                  </Text>
                </View>
              )}
            </Card>
          )}
        />
      )}

      {/* Decision Modal */}
      {activeModal && (
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Confirm Maker-Checker Decision ({activeModal.action})
            </Text>
            <Text style={styles.modalSub}>
              Target: {activeModal.approval.title}
            </Text>

            {errorMsg && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
              </View>
            )}

            <InputField
              label="Mandatory Audit Justification (Min 10 chars)"
              placeholder="Provide technical or regulatory reason for signoff decision..."
              value={auditJustification}
              onChangeText={setAuditJustification}
              multiline
              numberOfLines={3}
            />

            <InputField
              label="6-Digit 2FA OTP Code"
              placeholder="123456"
              value={otpCode}
              onChangeText={setOtpCode}
              keyboardType="number-pad"
            />

            <View style={styles.modalBtnRow}>
              <Button
                title={`Execute ${activeModal.action}`}
                onPress={handleConfirmDecision}
                variant={activeModal.action === "APPROVE" ? "primary" : "danger"}
                size="md"
                style={styles.confirmBtn}
              />
              <Button
                title="Cancel"
                onPress={() => setActiveModal(null)}
                variant="ghost"
                size="md"
              />
            </View>
          </Card>
        </View>
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
  emptyContainer: {
    paddingHorizontal: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleWrapper: {
    flex: 1,
    paddingRight: 8,
  },
  actionCode: {
    fontSize: 10,
    fontWeight: "800",
    color: theme.colors.aiPurple,
    fontFamily: theme.typography.fontFamily.mono,
  },
  requestTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 10,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  detailVal: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  changesLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginTop: 6,
  },
  changesDesc: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  actionBtnsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 10,
  },
  approveBtn: {
    backgroundColor: theme.colors.success,
  },
  signoffBox: {
    marginTop: 10,
    backgroundColor: theme.colors.surfaceSubtle,
    padding: 10,
    borderRadius: theme.borderRadius.md,
  },
  signoffTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  signoffNotes: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontStyle: "italic",
    marginTop: 2,
  },
  signoffTime: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  modalOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  modalSub: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginBottom: 14,
    marginTop: 2,
  },
  errorBox: {
    backgroundColor: theme.colors.dangerSubtle,
    padding: 8,
    borderRadius: theme.borderRadius.sm,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 11,
    color: theme.colors.danger,
    fontWeight: "600",
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  confirmBtn: {
    flex: 1,
  },
});
