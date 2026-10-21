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

interface AssignedAd {
  id: string;
  name: string;
  territory: string;
  phone: string;
  currentBalance: number;
  allocatedLimit: number;
  activeRetailers: number;
  status: "Active" | "Pending Limit Review";
}

const mockAssignedAds: AssignedAd[] = [
  {
    id: "AD-ZONE-01",
    name: "Sunil Verma",
    territory: "Zone-01 Division",
    phone: "9812345678",
    currentBalance: 185000,
    allocatedLimit: 500000,
    activeRetailers: 24,
    status: "Active",
  },
  {
    id: "AD-ZONE-02",
    name: "Pooja Sharma",
    territory: "Zone-02 Division",
    phone: "9834567890",
    currentBalance: 92000,
    allocatedLimit: 600000,
    activeRetailers: 19,
    status: "Active",
  },
  {
    id: "AD-ZONE-03",
    name: "Mukesh Yadav",
    territory: "Zone-03 Industrial Belt",
    phone: "9845678901",
    currentBalance: 45000,
    allocatedLimit: 400000,
    activeRetailers: 14,
    status: "Pending Limit Review",
  },
  {
    id: "AD-ZONE-04",
    name: "Kavita Singh",
    territory: "Zone-04 Agricultural Mandi",
    phone: "9856789012",
    currentBalance: 310000,
    allocatedLimit: 750000,
    activeRetailers: 32,
    status: "Active",
  },
];

export const SuperDistributorAdNetworkScreen: React.FC = () => {
  const [adList, setAdList] = useState<AssignedAd[]>(mockAssignedAds);
  const [selectedAd, setSelectedAd] = useState<AssignedAd | null>(null);
  const [transferAmount, setTransferAmount] = useState("");

  const handleAllocateLimit = () => {
    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid transfer amount in INR.");
      return;
    }

    if (!selectedAd) return;

    setAdList((prev) =>
      prev.map((ad) =>
        ad.id === selectedAd.id
          ? { ...ad, currentBalance: ad.currentBalance + amt }
          : ad
      )
    );

    Alert.alert(
      "Limit Transfer Successful",
      `₹${amt.toLocaleString("en-IN")} allocated to ${selectedAd.name} (${selectedAd.id}).`
    );
    setSelectedAd(null);
    setTransferAmount("");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Assigned Area Distributors</Text>
      <Text style={styles.subtitle}>
        Manage your subordinate Area Distributors, credit limits, and retailer networks
      </Text>

      <View style={styles.list}>
        {adList.map((ad) => (
          <Card key={ad.id} style={styles.adCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.adName}>{ad.name}</Text>
                <Text style={styles.adSub}>
                  {ad.id} · {ad.territory}
                </Text>
              </View>
              <Badge
                label={ad.status.toUpperCase()}
                variant={ad.status === "Active" ? "emerald" : "amber"}
              />
            </View>

            <View style={styles.metricsBox}>
              <View style={styles.metricCol}>
                <Text style={styles.metricLabel}>Balance</Text>
                <Text style={styles.metricVal}>₹{ad.currentBalance.toLocaleString("en-IN")}</Text>
              </View>
              <View style={styles.metricCol}>
                <Text style={styles.metricLabel}>Limit Allocated</Text>
                <Text style={styles.metricVal}>₹{ad.allocatedLimit.toLocaleString("en-IN")}</Text>
              </View>
              <View style={styles.metricCol}>
                <Text style={styles.metricLabel}>Active Stores</Text>
                <Text style={styles.metricVal}>{ad.activeRetailers}</Text>
              </View>
            </View>

            <View style={styles.cardActions}>
              <Button
                title="⚡ Allocate Limit / Transfer"
                size="sm"
                onPress={() => setSelectedAd(ad)}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        ))}
      </View>

      {/* Allocate Limit Modal */}
      <Modal visible={!!selectedAd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedAd && (
              <>
                <Text style={styles.modalTitle}>Allocate Liquidity Limit</Text>
                <Text style={styles.modalSub}>
                  Target AD: {selectedAd.name} ({selectedAd.id})
                </Text>

                <View style={styles.currentInfoBox}>
                  <Text style={styles.infoRow}>Current Balance: ₹{selectedAd.currentBalance.toLocaleString("en-IN")}</Text>
                  <Text style={styles.infoRow}>Approved Credit Limit: ₹{selectedAd.allocatedLimit.toLocaleString("en-IN")}</Text>
                </View>

                <Text style={styles.inputLabel}>Enter Transfer Amount (INR):</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="e.g. 50000"
                  keyboardType="numeric"
                  value={transferAmount}
                  onChangeText={setTransferAmount}
                />

                <View style={styles.modalActions}>
                  <Button
                    title="Confirm Limit Transfer"
                    onPress={handleAllocateLimit}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Cancel"
                    variant="outline"
                    onPress={() => setSelectedAd(null)}
                    style={{ flex: 1 }}
                  />
                </View>
              </>
            )}
          </View>
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
  list: {
    gap: 12,
  },
  adCard: {
    padding: 14,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  adName: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  adSub: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  metricsBox: {
    flexDirection: "row",
    backgroundColor: theme.colors.surfaceSubtle,
    padding: 10,
    borderRadius: theme.borderRadius.md,
  },
  metricCol: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 9,
    color: theme.colors.textSecondary,
    fontWeight: "600",
  },
  metricVal: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.primary,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: "row",
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
  currentInfoBox: {
    backgroundColor: theme.colors.surfaceSubtle,
    padding: 12,
    borderRadius: theme.borderRadius.md,
    gap: 4,
    marginBottom: 14,
  },
  infoRow: {
    fontSize: 12,
    color: theme.colors.textPrimary,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.primary,
    marginBottom: 6,
  },
  amountInput: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.primary,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    gap: 8,
  },
});
