import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { theme } from "../theme";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";

interface SupportTicket {
  id: string;
  category: "Transaction Dispute" | "KYC Update" | "POS Hardware" | "Settlement Delay";
  subject: string;
  status: "Open" | "In Review" | "Resolved";
  createdAt: string;
  lastUpdate: string;
}

const mockTickets: SupportTicket[] = [
  {
    id: "TKT-2026-102",
    category: "Transaction Dispute",
    subject: "AEPS customer debit completed but terminal showed timeout",
    status: "In Review",
    createdAt: "Today, 11:20",
    lastUpdate: "Under review with NPCI switch desk",
  },
  {
    id: "TKT-2026-088",
    category: "POS Hardware",
    subject: "Bluetooth thermal printer pairing key error",
    status: "Resolved",
    createdAt: "Oct 17, 15:00",
    lastUpdate: "Firmware re-flashed successfully",
  },
];

export const MobileSupportScreen: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>(mockTickets);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<SupportTicket["category"]>("Transaction Dispute");
  const [details, setDetails] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const handleCreateTicket = () => {
    if (!subject.trim() || !details.trim()) {
      Alert.alert("Incomplete Details", "Please provide a subject and issue description.");
      return;
    }

    const newTicket: SupportTicket = {
      id: `TKT-2026-${Math.floor(100 + Math.random() * 900)}`,
      category,
      subject,
      status: "Open",
      createdAt: "Just now",
      lastUpdate: "Dispatched to Help Desk queue",
    };

    setTickets([newTicket, ...tickets]);
    Alert.alert("Ticket Dispatched", `Your query #${newTicket.id} has been registered.`);
    setSubject("");
    setDetails("");
    setShowCreate(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Merchant Support & Help Desk</Text>
      <Text style={styles.subtitle}>
        24/7 technical ticketing, switch dispute filing, and compliance support
      </Text>

      {/* Emergency Contact Banner */}
      <Card style={styles.contactCard}>
        <Text style={styles.contactTitle}>Emergency Banking Switch Helpline</Text>
        <Text style={styles.contactPhone}>📞 1800 200 4265 (Toll Free)</Text>
        <Text style={styles.contactEmail}>✉️ compliance@buymecart.org</Text>
        <Text style={styles.contactHours}>Available 24x7 for AEPS & DMT Switch Support</Text>
      </Card>

      {/* Create Ticket Toggle Button */}
      {!showCreate ? (
        <Button
          title="+ Raise New Support / Dispute Ticket"
          onPress={() => setShowCreate(true)}
          style={{ marginBottom: 16 }}
        />
      ) : (
        /* Ticket Creation Form */
        <Card style={styles.createCard}>
          <Text style={styles.createTitle}>Raise Support / Dispute Ticket</Text>

          <Text style={styles.inputLabel}>Select Category:</Text>
          <View style={styles.categoryRow}>
            {(["Transaction Dispute", "KYC Update", "POS Hardware", "Settlement Delay"] as const).map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, category === cat && styles.activeCatChip]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.catChipText, category === cat && styles.activeCatChipText]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>Subject / Transaction Ref:</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. BMC-DMT-100200 timeout debit"
            value={subject}
            onChangeText={setSubject}
          />

          <Text style={styles.inputLabel}>Issue Details:</Text>
          <TextInput
            style={[styles.input, { minHeight: 60, textAlignVertical: "top" }]}
            placeholder="Describe the issue, customer phone, or error code..."
            value={details}
            onChangeText={setDetails}
            multiline
          />

          <View style={styles.formActions}>
            <Button
              title="Submit Ticket"
              onPress={handleCreateTicket}
              style={{ flex: 1 }}
            />
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => setShowCreate(false)}
              style={{ flex: 1 }}
            />
          </View>
        </Card>
      )}

      {/* Tickets List */}
      <Text style={styles.sectionHeading}>Your Support Tickets</Text>
      <View style={styles.list}>
        {tickets.map((t) => (
          <Card key={t.id} style={styles.ticketCard}>
            <View style={styles.ticketHeader}>
              <View>
                <Text style={styles.ticketId}>{t.id}</Text>
                <Text style={styles.ticketCat}>{t.category}</Text>
              </View>
              <Badge
                label={t.status.toUpperCase()}
                variant={
                  t.status === "Resolved"
                    ? "emerald"
                    : t.status === "In Review"
                    ? "teal"
                    : "amber"
                }
              />
            </View>

            <Text style={styles.ticketSubject}>{t.subject}</Text>
            <Text style={styles.ticketUpdate}>Status Update: {t.lastUpdate}</Text>
            <Text style={styles.ticketMeta}>Created: {t.createdAt}</Text>
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
  contactCard: {
    padding: 16,
    backgroundColor: theme.colors.primary,
    marginBottom: 16,
    gap: 4,
  },
  contactTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.tealLight,
  },
  contactPhone: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: 2,
  },
  contactEmail: {
    fontSize: 12,
    color: "#CBD5E1",
  },
  contactHours: {
    fontSize: 10,
    color: theme.colors.tealLight,
    marginTop: 4,
  },
  createCard: {
    padding: 16,
    gap: 10,
    marginBottom: 16,
  },
  createTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeCatChip: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  catChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.textSecondary,
  },
  activeCatChipText: {
    color: "#FFFFFF",
  },
  input: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: theme.colors.textPrimary,
  },
  formActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.primary,
    marginBottom: 10,
  },
  list: {
    gap: 10,
  },
  ticketCard: {
    padding: 14,
    gap: 6,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  ticketId: {
    fontSize: 13,
    fontWeight: "900",
    color: theme.colors.primary,
  },
  ticketCat: {
    fontSize: 10,
    color: theme.colors.tealDark,
    fontWeight: "700",
  },
  ticketSubject: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  ticketUpdate: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  ticketMeta: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
});
