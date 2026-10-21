import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Order } from "@buymecart/shared-types";
import { formatINR } from "@buymecart/business-logic";
import { theme } from "../theme";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { EmptyState } from "../components/EmptyState";

export interface OrderTrackingScreenProps {
  orders: Order[];
  onExploreCatalog: () => void;
}

export const OrderTrackingScreen: React.FC<OrderTrackingScreenProps> = ({
  orders,
  onExploreCatalog,
}) => {
  if (orders.length === 0) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <EmptyState
          title="No orders placed yet"
          description="Your order history is clean. Complete a purchase from the BuyMeCart catalog to track real-time delivery timelines."
          actionLabel="Browse Products"
          onAction={onExploreCatalog}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.screenTitle}>My Orders & Dispatches</Text>
      <Text style={styles.screenSubtitle}>
        Track real-time delivery status for POS terminals and hardware shipments.
      </Text>

      <View style={styles.ordersList}>
        {orders.map((ord) => (
          <Card key={ord.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View>
                <Text style={styles.orderNumber}>{ord.orderNumber}</Text>
                <Text style={styles.orderDate}>
                  Placed on {new Date(ord.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Badge
                label={ord.orderStatus.replace("_", " ").toUpperCase()}
                variant={ord.orderStatus === "delivered" ? "emerald" : "sky"}
              />
            </View>

            <View style={styles.divider} />

            {/* Tracking Number */}
            {ord.trackingNumber && (
              <View style={styles.trackingRow}>
                <Text style={styles.trackingLabel}>AWB Tracking:</Text>
                <Text style={styles.trackingVal}>{ord.trackingNumber}</Text>
              </View>
            )}

            {/* Items summary */}
            <View style={styles.itemsSummary}>
              {ord.items.map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={styles.itemName}>
                    {item.quantity}x {item.product.name}
                  </Text>
                  <Text style={styles.itemPrice}>
                    {formatINR(item.product.price * item.quantity)}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.divider} />

            <View style={styles.footerRow}>
              <View>
                <Text style={styles.feeBreakdown}>
                  Inc. Tempered Margin: {formatINR(ord.temperedMarginFee)}
                </Text>
                <Text style={styles.orderTotal}>{formatINR(ord.totalAmount)}</Text>
              </View>
              <Text style={styles.payMethod}>
                Paid via {ord.paymentMethod.toUpperCase()}
              </Text>
            </View>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.primary,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 16,
  },
  ordersList: {
    gap: 14,
  },
  orderCard: {
    padding: 16,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.mono,
  },
  orderDate: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 10,
  },
  trackingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  trackingLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  trackingVal: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.accent,
    fontFamily: theme.typography.fontFamily.mono,
  },
  itemsSummary: {
    gap: 4,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  itemName: {
    fontSize: 12,
    color: theme.colors.textPrimary,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  feeBreakdown: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: "900",
    color: theme.colors.primary,
    marginTop: 2,
  },
  payMethod: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
});
