import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import { theme } from "../theme";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";

interface AssignedRetailer {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  balance: number;
  kycStatus: "Verified" | "Pending Review" | "Corrections Needed";
  kitStatus: "Handover Complete" | "Pending Handover" | "In Transit";
  kitSerial: string;
  dailyVolume: number;
  location: string;
}

const mockRetailers: AssignedRetailer[] = [
  {
    id: "RET-ZONE-01-401",
    name: "Patel Digital Kendra",
    ownerName: "Rajesh Patel",
    phone: "9898989898",
    balance: 34200.0,
    kycStatus: "Verified",
    kitStatus: "Handover Complete",
    kitSerial: "KIT-2026-8812",
    dailyVolume: 48200,
    location: "Main Market, Zone-01",
  },
  {
    id: "RET-ZONE-01-402",
    name: "Gupta Mini Banking",
    ownerName: "Anil Gupta",
    phone: "9777777777",
    balance: 12400.0,
    kycStatus: "Pending Review",
    kitStatus: "In Transit",
    kitSerial: "KIT-2026-7741",
    dailyVolume: 18500,
    location: "Station Road, Zone-01",
  },
  {
    id: "RET-ZONE-01-403",
    name: "Deepak Communications",
    ownerName: "Deepak Sharma",
    phone: "9666666666",
    balance: 5100.0,
    kycStatus: "Corrections Needed",
    kitStatus: "Pending Handover",
    kitSerial: "KIT-2026-6632",
    dailyVolume: 6400,
    location: "Rural Outpost, Zone-01",
  },
  {
    id: "RET-ZONE-01-404",
    name: "Mahaveer Kirana & Pay",
    ownerName: "Mahaveer Jain",
    phone: "9555555555",
    balance: 58900.0,
    kycStatus: "Verified",
    kitStatus: "Handover Complete",
    kitSerial: "KIT-2026-5510",
    dailyVolume: 82400,
    location: "Grain Market, Zone-01",
  },
];

export const AreaDistributorRetailersScreen: React.FC = () => {
  const [retailers, setRetailers] = useState<AssignedRetailer[]>(mockRetailers);
  const [search, setSearch] = useState("");
  const [selectedRetailer, setSelectedRetailer] = useState<AssignedRetailer | null>(null);

  const filtered = retailers.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleConfirmKitHandover = (retId: string) => {
    setRetailers((prev) =>
      prev.map((r) =>
        r.id === retId ? { ...r, kitStatus: "Handover Complete" } : r
      )
    );
    if (selectedRetailer && selectedRetailer.id === retId) {
      setSelectedRetailer((prev) =>
        prev ? { ...prev, kitStatus: "Handover Complete" } : null
      );
    }
    Alert.alert("Kit Handover Confirmed", `Physical POS logistics kit registered to retailer ${retId}.`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Assigned Retailer Directory</Text>
      <Text style={styles.subtitle}>
        Manage merchants in Zone-01, monitor operating balances, and track kit handovers
      </Text>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by store name, merchant, or ID..."
          placeholderTextColor={theme.colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Retailers List */}
      <View style={styles.list}>
        {filtered.map((ret) => (
          <Card key={ret.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.storeName}>{ret.name}</Text>
                <Text style={styles.ownerText}>
                  {ret.ownerName} · +91 {ret.phone}
                </Text>
                <Text style={styles.locationText}>{ret.location}</Text>
              </View>
              <Badge
                label={ret.kycStatus.toUpperCase()}
                variant={
                  ret.kycStatus === "Verified"
                    ? "emerald"
                    : ret.kycStatus === "Pending Review"
                    ? "amber"
                    : "rose"
                }
              />
            </View>

            <View style={styles.metricRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Wallet Balance</Text>
                <Text style={styles.metricVal}>₹{ret.balance.toLocaleString("en-IN")}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Today's Turnout</Text>
                <Text style={styles.metricVal}>₹{ret.dailyVolume.toLocaleString("en-IN")}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Logistics Kit</Text>
                <Text style={styles.metricVal}>{ret.kitSerial}</Text>
              </View>
            </View>

            <View style={styles.cardActions}>
              <Button
                title="View Dossier"
                variant="outline"
                size="sm"
                onPress={() => setSelectedRetailer(ret)}
                style={{ flex: 1 }}
              />
              {ret.kitStatus !== "Handover Complete" && (
                <Button
                  title="✓ Confirm Handover"
                  size="sm"
                  onPress={() => handleConfirmKitHandover(ret.id)}
                  style={{ flex: 1 }}
                />
              )}
            </View>
          </Card>
        ))}
      </View>

      {/* Retailer Detail Modal */}
      <Modal visible={!!selectedRetailer} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedRetailer && (
              <>
                <Text style={styles.modalTitle}>{selectedRetailer.name}</Text>
                <Text style={styles.modalSub}>
                  {selectedRetailer.id} · {selectedRetailer.ownerName}
                </Text>

                <View style={styles.dataSection}>
                  <Text style={styles.dataRow}>• Location: {selectedRetailer.location}</Text>
                  <Text style={styles.dataRow}>• Phone: +91 {selectedRetailer.phone}</Text>
                  <Text style={styles.dataRow}>• Wallet Balance: ₹{selectedRetailer.balance.toLocaleString("en-IN")}</Text>
                  <Text style={styles.dataRow}>• KYC Status: {selectedRetailer.kycStatus}</Text>
                  <Text style={styles.dataRow}>• Logistics Kit: {selectedRetailer.kitSerial} ({selectedRetailer.kitStatus})</Text>
                  <Text style={styles.dataRow}>• Today's Gross Volume: ₹{selectedRetailer.dailyVolume.toLocaleString("en-IN")}</Text>
                </View>

                {selectedRetailer.kitStatus !== "Handover Complete" && (
                  <Button
                    title="Confirm Logistics Kit Handover"
                    onPress={() => handleConfirmKitHandover(selectedRetailer.id)}
                    style={{ marginBottom: 10 }}
                  />
                )}

                <Button
                  title="Close"
                  variant="ghost"
                  onPress={() => setSelectedRetailer(null)}
                />
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
  searchBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  searchInput: {
    height: 40,
    fontSize: 13,
    color: theme.colors.textPrimary,
  },
  list: {
    gap: 12,
  },
  card: {
    padding: 14,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  storeName: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  ownerText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  locationText: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  metricRow: {
    flexDirection: "row",
    backgroundColor: theme.colors.surfaceSubtle,
    padding: 10,
    borderRadius: theme.borderRadius.md,
  },
  metricItem: {
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
    gap: 8,
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
  dataSection: {
    backgroundColor: theme.colors.surfaceSubtle,
    padding: 12,
    borderRadius: theme.borderRadius.md,
    gap: 4,
    marginBottom: 16,
  },
  dataRow: {
    fontSize: 12,
    color: theme.colors.textPrimary,
  },
});
