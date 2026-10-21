import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { theme } from "../theme";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";

export const RetailerKycStatusScreen: React.FC = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Merchant Profile & KYC Verification</Text>
      <Text style={styles.subtitle}>
        Statutory KYC compliance records, verified settlement bank, and territorial hierarchy
      </Text>

      {/* KYC Verification Badge Card */}
      <Card style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View>
            <Text style={styles.statusLabel}>Current Verification Level</Text>
            <Text style={styles.statusTitle}>Level-3 Fully Authorized</Text>
          </View>
          <Badge label="RBI MASTER KYC OK" variant="emerald" />
        </View>

        <Text style={styles.statusDesc}>
          Your merchant profile has successfully passed PAN NSDL verification, Aadhaar OTP authentication, Penny Drop bank proof, and mandatory 30-second Video KYC recitation.
        </Text>
      </Card>

      {/* Merchant Business Details */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Merchant Business Details</Text>
        <View style={styles.dataRow}>
          <Text style={styles.label}>Shop Name:</Text>
          <Text style={styles.val}>Patel Digital Kendra</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.label}>Merchant Name:</Text>
          <Text style={styles.val}>Rajesh Patel</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.label}>Registered Mobile:</Text>
          <Text style={styles.val}>+91 98989 89898 (Verified)</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.label}>Registered Email:</Text>
          <Text style={styles.val}>rajesh.patel@buymecart.org (Verified)</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.label}>Shop Address:</Text>
          <Text style={styles.val}>Shop 12, Main Market, Zone-01 Division</Text>
        </View>
      </Card>

      {/* Bank Account Details */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Settlement Bank Account</Text>
          <Badge label="PENNY DROP VERIFIED" variant="emerald" />
        </View>

        <View style={styles.dataRow}>
          <Text style={styles.label}>Bank Name:</Text>
          <Text style={styles.val}>State Bank of India</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.label}>Account Holder:</Text>
          <Text style={styles.val}>Rajesh Patel</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.label}>Account Number:</Text>
          <Text style={styles.val}>•••• •••• 4291</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.label}>IFSC Code:</Text>
          <Text style={styles.val}>SBIN0001234</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.label}>Account Type:</Text>
          <Text style={styles.val}>Current Account</Text>
        </View>
      </Card>

      {/* Channel Hierarchy Assignment */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Authorized Channel Hierarchy</Text>
        <View style={styles.dataRow}>
          <Text style={styles.label}>Parent Area Distributor:</Text>
          <Text style={styles.val}>Sunil Verma (AD-ZONE-01)</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.label}>Super Distributor:</Text>
          <Text style={styles.val}>Central Spark FinTech (SD-CENTRAL-01)</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.label}>Assigned Territory:</Text>
          <Text style={styles.val}>Zone-01 Division</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.label}>Logistics Kit Serial:</Text>
          <Text style={styles.val}>KIT-2026-8812 (Handover Confirmed)</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.label}>Video KYC Status:</Text>
          <Text style={styles.val}>Recorded & Verified (Code 729-418)</Text>
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
  statusCard: {
    padding: 16,
    backgroundColor: theme.colors.primary,
    marginBottom: 14,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 11,
    color: theme.colors.tealLight,
    fontWeight: "700",
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: 2,
  },
  statusDesc: {
    fontSize: 11,
    color: "#CBD5E1",
    lineHeight: 16,
  },
  sectionCard: {
    padding: 14,
    gap: 8,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.primary,
    marginBottom: 4,
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    paddingVertical: 6,
  },
  label: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  val: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
});
