import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { theme } from "../theme";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { MobileKycScreen } from "./MobileKycScreen";

interface AdOnboardingRequest {
  id: string;
  applicantName: string;
  proposedTerritory: string;
  phone: string;
  status: "Pending Admin Signoff" | "Approved" | "Docs Correction Required";
  submittedDate: string;
  vkycStatus: "Recorded" | "Verified" | "Pending";
}

const mockAdRequests: AdOnboardingRequest[] = [
  {
    id: "AD-REQ-2026-081",
    applicantName: "Vikram Malhotra",
    proposedTerritory: "Zone-02 Division",
    phone: "9823456789",
    status: "Pending Admin Signoff",
    submittedDate: "Today, 11:45",
    vkycStatus: "Recorded",
  },
  {
    id: "AD-REQ-2026-079",
    applicantName: "Pooja Sharma",
    proposedTerritory: "Zone-02 Division",
    phone: "9834567890",
    status: "Approved",
    submittedDate: "Oct 18, 14:10",
    vkycStatus: "Verified",
  },
  {
    id: "AD-REQ-2026-074",
    applicantName: "Gopal Krishna",
    proposedTerritory: "Zone-03 Highway Hub",
    phone: "9811223344",
    status: "Docs Correction Required",
    submittedDate: "Oct 16, 09:30",
    vkycStatus: "Pending",
  },
];

export const SuperDistributorOnboardingScreen: React.FC = () => {
  const [showWizard, setShowWizard] = useState(false);
  const [requests, setRequests] = useState<AdOnboardingRequest[]>(mockAdRequests);

  const handleEscalateToAdmin = (reqId: string) => {
    Alert.alert(
      "Escalation Dispatched",
      `Urgent review request for ${reqId} has been sent directly to the Admin Compliance Desk.`
    );
  };

  if (showWizard) {
    return (
      <MobileKycScreen
        initiatorRole="super_distributor"
        targetRole="area_distributor"
        onComplete={() => setShowWizard(false)}
        onCancel={() => setShowWizard(false)}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Area Distributor Onboarding</Text>
      <Text style={styles.subtitle}>
        Track subordinate AD applications, submit new AD dossiers, and escalate to Admin
      </Text>

      {/* Action Banner */}
      <Card style={styles.launchCard}>
        <Text style={styles.launchTitle}>Expand Your Distribution Territory</Text>
        <Text style={styles.launchDesc}>
          Launch a 7-step onboarding dossier for an authorized Area Distributor in Central India Division.
        </Text>
        <Button
          title="+ Onboard New Area Distributor"
          onPress={() => setShowWizard(true)}
          size="md"
        />
      </Card>

      <Text style={styles.sectionHeading}>AD Application Queue</Text>
      <View style={styles.list}>
        {requests.map((req) => (
          <Card key={req.id} style={styles.reqCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.reqName}>{req.applicantName}</Text>
                <Text style={styles.reqTerritory}>
                  {req.id} · {req.proposedTerritory}
                </Text>
              </View>
              <Badge
                label={req.status.toUpperCase()}
                variant={
                  req.status === "Approved"
                    ? "emerald"
                    : req.status === "Pending Admin Signoff"
                    ? "amber"
                    : "rose"
                }
              />
            </View>

            <View style={styles.detailsBox}>
              <Text style={styles.detailText}>• Contact: +91 {req.phone}</Text>
              <Text style={styles.detailText}>• Video KYC: {req.vkycStatus}</Text>
              <Text style={styles.detailText}>• Submitted: {req.submittedDate}</Text>
            </View>

            {req.status === "Pending Admin Signoff" && (
              <Button
                title="⚡ Escalate to Admin Review"
                variant="outline"
                size="sm"
                onPress={() => handleEscalateToAdmin(req.id)}
              />
            )}
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
  launchCard: {
    padding: 16,
    backgroundColor: theme.colors.primary,
    marginBottom: 20,
  },
  launchTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  launchDesc: {
    fontSize: 11,
    color: "#CBD5E1",
    marginBottom: 14,
    lineHeight: 16,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.primary,
    marginBottom: 10,
  },
  list: {
    gap: 12,
  },
  reqCard: {
    padding: 14,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  reqName: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  reqTerritory: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  detailsBox: {
    backgroundColor: theme.colors.surfaceSubtle,
    padding: 10,
    borderRadius: theme.borderRadius.md,
    gap: 4,
  },
  detailText: {
    fontSize: 11,
    color: theme.colors.textPrimary,
  },
});
