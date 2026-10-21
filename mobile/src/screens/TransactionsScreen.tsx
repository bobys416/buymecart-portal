import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { FinancialTransaction, IbnkServiceType } from "@buymecart/shared-types";
import { formatINR } from "@buymecart/business-logic";
import { theme } from "../theme";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { EmptyState } from "../components/EmptyState";
import { InputField } from "../components/InputField";

export interface TransactionsScreenProps {
  transactions: FinancialTransaction[];
  onSelectTransaction: (tx: FinancialTransaction) => void;
  onInitiateTransaction: () => void;
}

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({
  transactions,
  onSelectTransaction,
  onInitiateTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceFilter, setServiceFilter] = useState<IbnkServiceType | "all">("all");

  const filtered = transactions.filter((tx) => {
    if (serviceFilter !== "all" && tx.serviceType !== serviceFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        tx.transactionRef.toLowerCase().includes(q) ||
        tx.rrn.toLowerCase().includes(q) ||
        tx.customerIdentifier.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Financial Transaction Ledger</Text>
        <Text style={styles.subtitle}>
          Real-time record of all AEPS, DMT, and UPI transactions with neutral receipts.
        </Text>
      </View>

      {/* Filter and Search Bar */}
      <View style={styles.filtersWrapper}>
        <InputField
          placeholder="Search by Tx Ref, Bank RRN, or Phone..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchInput}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
          {[
            { label: "All Rails", value: "all" },
            { label: "DMT", value: "dmt" },
            { label: "AEPS", value: "aeps" },
            { label: "BBPS", value: "bbps" },
            { label: "UPI", value: "upi_switch" },
          ].map((f) => (
            <TouchableOpacity
              key={f.value}
              onPress={() => setServiceFilter(f.value as IbnkServiceType | "all")}
              style={[
                styles.chip,
                serviceFilter === f.value && styles.activeChip,
              ]}
            >
              <Text style={[styles.chipText, serviceFilter === f.value && styles.activeChipText]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Transaction List or Zero Dummy Data Empty State */}
      {filtered.length === 0 ? (
        <ScrollView contentContainerStyle={styles.emptyContainer}>
          <EmptyState
            title="No transactions found"
            description="The transaction ledger is clean with zero records. Initiate a financial payment from the IBNK Overview screen."
            actionLabel="+ Initiate Transaction"
            onAction={onInitiateTransaction}
          />
        </ScrollView>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Card style={styles.txCard}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onSelectTransaction(item)}
              >
                <View style={styles.txHeader}>
                  <View>
                    <Text style={styles.txRef}>{item.transactionRef}</Text>
                    <Text style={styles.txRrn}>Bank RRN: {item.rrn}</Text>
                  </View>
                  <Badge
                    label={item.status.toUpperCase()}
                    variant={item.status === "success" ? "emerald" : "amber"}
                    size="sm"
                  />
                </View>

                <View style={styles.divider} />

                <View style={styles.txBody}>
                  <View>
                    <Text style={styles.txService}>
                      {item.serviceType.toUpperCase()} · {item.retailerName}
                    </Text>
                    <Text style={styles.txCustomer}>Cust: {item.customerIdentifier}</Text>
                    <Text style={styles.txDate}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>

                  <View style={styles.amountCol}>
                    <Text style={styles.txAmount}>{formatINR(item.amount)}</Text>
                    <Text style={styles.txFee}>
                      Margin: {formatINR(item.temperedMarginFee)}
                    </Text>
                  </View>
                </View>

                <View style={styles.txFooter}>
                  <Text style={styles.receiptLink}>📄 View Neutral Receipt (Note 1) →</Text>
                </View>
              </TouchableOpacity>
            </Card>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
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
  filtersWrapper: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  searchInput: {
    marginBottom: 8,
  },
  filterChipsRow: {
    gap: 8,
  },
  chip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeChip: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  activeChipText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  emptyContainer: {
    paddingHorizontal: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  txCard: {
    padding: 14,
  },
  txHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  txRef: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.mono,
  },
  txRrn: {
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.mono,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 10,
  },
  txBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  txService: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  txCustomer: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  txDate: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  amountCol: {
    alignItems: "flex-end",
  },
  txAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  txFee: {
    fontSize: 10,
    color: theme.colors.accent,
    fontWeight: "600",
    marginTop: 2,
  },
  txFooter: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 8,
  },
  receiptLink: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.accent,
  },
});
