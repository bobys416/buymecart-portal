import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Product } from "@buymecart/shared-types";
import { formatINR } from "@buymecart/business-logic";
import { theme } from "../theme";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";

export interface ProductDetailScreenProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
  onBack: () => void;
}

export const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({
  product,
  onAddToCart,
  onBack,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // Statutory convenience escrow preview (0.5% or min ₹5)
  const estimatedTemperedMarginFee = product.temperedMarginEligible
    ? Math.max(5, product.price * 0.005)
    : 0;

  const handleAdd = () => {
    onAddToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>← Back to Store</Text>
      </TouchableOpacity>

      <Card style={styles.mainCard}>
        <View style={styles.badgeRow}>
          <Badge
            label={product.category.replace("_", " ").toUpperCase()}
            variant="sky"
          />
          <Badge
            label={product.isAvailable ? "IN STOCK" : "OUT OF STOCK"}
            variant={product.isAvailable ? "emerald" : "rose"}
          />
        </View>

        <Text style={styles.title}>{product.name}</Text>
        <Text style={styles.sku}>SKU: {product.sku}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatINR(product.price)}</Text>
          <Text style={styles.gstNotice}>(Inclusive of all applicable taxes)</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionHeading}>Product Specifications & Description</Text>
        <Text style={styles.description}>{product.description}</Text>

        {product.temperedMarginEligible && (
          <View style={styles.marginBox}>
            <Text style={styles.marginTitle}>🛡️ Statutory Tempered Margin Guarantee</Text>
            <Text style={styles.marginText}>
              This item is protected under BuyMeCart's digital escrow framework. Estimated statutory
              convenience escrow fee is {formatINR(estimatedTemperedMarginFee)} per unit.
            </Text>
          </View>
        )}

        <View style={styles.divider} />

        {/* Quantity Selector */}
        <View style={styles.quantitySection}>
          <Text style={styles.qtyLabel}>Quantity:</Text>
          <View style={styles.qtyControls}>
            <TouchableOpacity
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
              style={styles.qtyBtn}
            >
              <Text style={styles.qtyBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.qtyText}>{quantity}</Text>
            <TouchableOpacity
              onPress={() => setQuantity(quantity + 1)}
              style={styles.qtyBtn}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Total & Action */}
        <View style={styles.footerSection}>
          <View>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatINR(product.price * quantity)}</Text>
          </View>

          <Button
            title={added ? "✓ Added to Cart" : "+ Add to Cart"}
            onPress={handleAdd}
            disabled={!product.isAvailable}
            size="lg"
            variant={added ? "secondary" : "primary"}
            style={styles.addBtn}
          />
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  backBtn: {
    marginBottom: 14,
  },
  backText: {
    fontSize: 13,
    color: theme.colors.accent,
    fontWeight: "700",
  },
  mainCard: {
    padding: 20,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    lineHeight: 26,
  },
  sku: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.mono,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginTop: 12,
  },
  price: {
    fontSize: 24,
    fontWeight: "900",
    color: theme.colors.primary,
  },
  gstNotice: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 16,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  marginBox: {
    marginTop: 14,
    backgroundColor: theme.colors.accentSubtle,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
    padding: 12,
  },
  marginTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.primary,
    marginBottom: 4,
  },
  marginText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  quantitySection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  qtyLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  qtyControls: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceSubtle,
  },
  qtyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  qtyText: {
    fontSize: 14,
    fontWeight: "700",
    paddingHorizontal: 12,
    color: theme.colors.textPrimary,
  },
  footerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  totalLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  addBtn: {
    flex: 1,
  },
});
