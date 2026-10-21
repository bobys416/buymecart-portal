import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { theme } from "../theme";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";

interface KycCorrectionItem {
  id: string;
  retailerName: string;
  applicant: string;
  phone: string;
  correctionReason: string;
  status: "Action Required" | "Re-submitted" | "Verified";
  kitSerial: string;
}

const mockCorrectionItems: KycCorrectionItem[] = [
  {
    id: "APP-2026-8511",
    retailerName: "Sharma Kirana Store",
    applicant: "Deepak Sharma",
    phone: "9666666666",
    correctionReason: "Shop front photograph blurry. Geotag coordinates not visible.",
    status: "Action Required",
    kitSerial: "KIT-2026-6632",
  },
  {
    id: "APP-2026-8490",
    retailerName: "Verma Electronics & Mini Bank",
    applicant: "Sanjay Verma",
    phone: "9812998877",
    correctionReason: "Bank statement name mismatch with PAN card.",
    status: "Action Required",
    kitSerial: "KIT-2026-4411",
  },
  {
    id: "APP-2026-8422",
    retailerName: "Kailash Telecom",
    applicant: "Kailash Mehra",
    phone: "9833445566",
    correctionReason: "30-second Video KYC recited code was incomplete.",
    status: "Re-submitted",
    kitSerial: "KIT-2026-2291",
  },
];

export const AreaDistributorKycQueueScreen: React.FC = () => {
  const [items, setItems] = useState<KycCorrectionItem[]>(mockCorrectionItems);

  const handleResubmit = (appId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === appId ? { ...item, status: "Re-submitted" } : item
      )
    );
    Alert.alert("Documents Re-submitted", `Corrected dossier for ${appId} has been queued for Admin verification.`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>KYC Status & Corrections Queue</Text>
      <Text style={styles.subtitle}>
        Track applications requiring document corrections or photo re-uploads
      </Text>

      <View style={styles.list}>
        {items.map((item) => (
          <Card key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.retailerName}>{item.retailerName}</Text>
                <Text style={styles.applicantText}>
                  {item.applicant} · {item.id}
                </Text>
              </View>
              <Badge
                label={item.status.toUpperCase()}
                variant={
                  item.status === "Verified"
                    ? "emerald"
                    : item.status === "Re-submitted"
                    ? "teal"
                    : "rose"
                }
              />
            </View>

            <View style={styles.reasonBox}>
              <Text style={styles.reasonLabel}>Correction Requirement:</Text>
              <Text style={styles.reasonText}>{item.correctionReason}</Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>Contact: +91 {item.phone}</Text>
              <Text style={styles.metaText}>Kit: {item.kitSerial}</Text>
            </View>

            {item.status === "Action Required" && (
              <View style={styles.actions}>
                <Button
                  title="📷 Re-capture & Submit to Admin"
                  size="sm"
                  onPress={() => handleResubmit(item.id)}
                />
              </View>
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
  list: {
    gap: 12,
  },
  card: {
    padding: 14,
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  retailerName: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  applicantText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  reasonBox: {
    backgroundColor: "#FFF1F2",
    padding: 10,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: "#FECDD3",
  },
  reasonLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#9F1239",
    marginBottom: 2,
  },
  reasonText: {
    fontSize: 11,
    color: "#BE123C",
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  actions: {
    marginTop: 4,
  },
});
