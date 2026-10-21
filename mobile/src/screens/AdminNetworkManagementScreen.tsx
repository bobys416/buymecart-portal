import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
} from "react-native";
import { theme } from "../theme";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";

interface ChannelMember {
  id: string;
  name: string;
  role: "super_distributor" | "area_distributor" | "retailer";
  territory: string;
  limitAllocated: number;
  balance: number;
  subordinateCount: number;
  status: "Active" | "Suspended" | "Pending KYC";
  phone: string;
}

const mockNetworkMembers: ChannelMember[] = [
  {
    id: "SD-CENTRAL-01",
    name: "Central Spark FinTech Pvt Ltd",
    role: "super_distributor",
    territory: "Central India Division",
    limitAllocated: 2500000,
    balance: 845000,
    subordinateCount: 8,
    status: "Active",
    phone: "9876543210",
  },
  {
    id: "SD-WEST-02",
    name: "Western Commercial Distributors",
    role: "super_distributor",
    territory: "Western Region",
    limitAllocated: 3000000,
    balance: 1420000,
    subordinateCount: 12,
    status: "Active",
    phone: "9823456789",
  },
  {
    id: "AD-ZONE-01",
    name: "Sunil Verma",
    role: "area_distributor",
    territory: "Zone-01 Division",
    limitAllocated: 500000,
    balance: 185000,
    subordinateCount: 24,
    status: "Active",
    phone: "9812345678",
  },
  {
    id: "AD-ZONE-02",
    name: "Pooja Sharma",
    role: "area_distributor",
    territory: "Zone-02 Division",
    limitAllocated: 600000,
    balance: 92000,
    subordinateCount: 19,
    status: "Active",
    phone: "9834567890",
  },
  {
    id: "RET-ZONE-01-401",
    name: "Patel Digital Kendra (Rajesh Patel)",
    role: "retailer",
    territory: "Zone-01 Main Market",
    limitAllocated: 50000,
    balance: 34200,
    subordinateCount: 0,
    status: "Active",
    phone: "9898989898",
  },
  {
    id: "RET-ZONE-01-402",
    name: "Gupta Mini Banking (Anil Gupta)",
    role: "retailer",
    territory: "Zone-01 Station Road",
    limitAllocated: 50000,
    balance: 12400,
    subordinateCount: 0,
    status: "Pending KYC",
    phone: "9777777777",
  },
];

export const AdminNetworkManagementScreen: React.FC = () => {
  const [filterRole, setFilterRole] = useState<"all" | "super_distributor" | "area_distributor" | "retailer">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<ChannelMember | null>(null);
  const [members, setMembers] = useState<ChannelMember[]>(mockNetworkMembers);

  const filteredMembers = members.filter((m) => {
    const matchesRole = filterRole === "all" || m.role === filterRole;
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.territory.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const toggleStatus = (id: string) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const nextStatus = m.status === "Active" ? "Suspended" : "Active";
          return { ...m, status: nextStatus };
        }
        return m;
      })
    );
    if (selectedMember && selectedMember.id === id) {
      setSelectedMember((prev) =>
        prev ? { ...prev, status: prev.status === "Active" ? "Suspended" : "Active" } : null
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Channel & Network Management</Text>
      <Text style={styles.subtitle}>
        Manage Super Distributors, Area Distributors, Retailer limits and statuses
      </Text>

      {/* Role Tabs */}
      <View style={styles.roleTabs}>
        {(["all", "super_distributor", "area_distributor", "retailer"] as const).map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.roleTab, filterRole === r && styles.activeRoleTab]}
            onPress={() => setFilterRole(r)}
          >
            <Text style={[styles.roleTabText, filterRole === r && styles.activeRoleTabText]}>
              {r === "all"
                ? "All"
                : r === "super_distributor"
                ? "SDs"
                : r === "area_distributor"
                ? "ADs"
                : "Retailers"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search Bar */}
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, ID, or territory..."
          placeholderTextColor={theme.colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Members List */}
      <View style={styles.list}>
        {filteredMembers.map((member) => (
          <Card key={member.id} style={styles.memberCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberId}>
                  {member.id} · {member.territory}
                </Text>
              </View>
              <Badge
                label={member.status.toUpperCase()}
                variant={
                  member.status === "Active"
                    ? "emerald"
                    : member.status === "Suspended"
                    ? "rose"
                    : "amber"
                }
              />
            </View>

            <View style={styles.cardDetails}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Pool Balance</Text>
                <Text style={styles.detailVal}>₹{member.balance.toLocaleString("en-IN")}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Allocated Limit</Text>
                <Text style={styles.detailVal}>₹{member.limitAllocated.toLocaleString("en-IN")}</Text>
              </View>
              {member.subordinateCount > 0 && (
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Downlines</Text>
                  <Text style={styles.detailVal}>{member.subordinateCount}</Text>
                </View>
              )}
            </View>

            <View style={styles.cardActions}>
              <Button
                title="Manage Details"
                variant="outline"
                size="sm"
                onPress={() => setSelectedMember(member)}
                style={{ flex: 1 }}
              />
              <Button
                title={member.status === "Active" ? "Suspend" : "Activate"}
                variant={member.status === "Active" ? "danger" : "primary"}
                size="sm"
                onPress={() => toggleStatus(member.id)}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        ))}
      </View>

      {/* Details Modal */}
      <Modal visible={!!selectedMember} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedMember && (
              <>
                <Text style={styles.modalTitle}>{selectedMember.name}</Text>
                <Text style={styles.modalSubtitle}>ID: {selectedMember.id} · {selectedMember.role.toUpperCase()}</Text>

                <View style={styles.modalDataBox}>
                  <Text style={styles.modalRow}>• Territory: {selectedMember.territory}</Text>
                  <Text style={styles.modalRow}>• Contact Phone: +91 {selectedMember.phone}</Text>
                  <Text style={styles.modalRow}>• Current Balance: ₹{selectedMember.balance.toLocaleString("en-IN")}</Text>
                  <Text style={styles.modalRow}>• Authorized Credit Limit: ₹{selectedMember.limitAllocated.toLocaleString("en-IN")}</Text>
                  <Text style={styles.modalRow}>• Downline Subordinates: {selectedMember.subordinateCount}</Text>
                  <Text style={styles.modalRow}>• Network Status: {selectedMember.status}</Text>
                </View>

                <Button
                  title="Close Details"
                  onPress={() => setSelectedMember(null)}
                  style={{ marginTop: 16 }}
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
  roleTabs: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
  },
  roleTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeRoleTab: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  roleTabText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.textSecondary,
  },
  activeRoleTabText: {
    color: "#FFFFFF",
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
  memberCard: {
    padding: 14,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  memberName: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  memberId: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  cardDetails: {
    flexDirection: "row",
    backgroundColor: theme.colors.surfaceSubtle,
    padding: 10,
    borderRadius: theme.borderRadius.md,
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 9,
    color: theme.colors.textSecondary,
    fontWeight: "600",
  },
  detailVal: {
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
  modalSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
    marginBottom: 14,
  },
  modalDataBox: {
    backgroundColor: theme.colors.surfaceSubtle,
    padding: 14,
    borderRadius: theme.borderRadius.md,
    gap: 6,
  },
  modalRow: {
    fontSize: 12,
    color: theme.colors.textPrimary,
  },
});
