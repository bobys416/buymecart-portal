import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Product, ProductCategory } from "@buymecart/shared-types";
import { formatINR } from "@buymecart/business-logic";
import { theme } from "../theme";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { InputField } from "../components/InputField";

export interface HomeScreenProps {
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onNavigateToCart: () => void;
  cartItemCount: number;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectProduct,
  onAddToCart,
  onNavigateToCart,
  cartItemCount,
}) => {
  // Zero dummy data initial state per user requirement
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const categories: { label: string; value: ProductCategory | "all" }[] = [
    { label: "All Products", value: "all" },
    { label: "POS Hardware", value: "pos_hardware" },
    { label: "Financial Kits", value: "financial_kits" },
    { label: "Electronics", value: "electronics" },
    { label: "Stationery", value: "stationery" },
  ];

  const handleAddSampleCatalog = () => {
    // Interactive action to provision inventory items
    const sampleItems: Product[] = [
      {
        id: "prod-pos-01",
        sku: "BMC-POS-M2",
        name: "Micro-ATM & Biometric POS Terminal M2",
        description: "PCI-PTS certified dual-slot smart card and biometric fingerprint reader.",
        category: "pos_hardware",
        price: 2499,
        currency: "INR",
        stock: 35,
        images: [],
        ratings: 4.8,
        ratingCount: 42,
        isAvailable: true,
        temperedMarginEligible: true,
      },
      {
        id: "prod-kit-02",
        sku: "BMC-KIT-RETAIL",
        name: "IBNK Retailer Starter QR & Branding Kit",
        description: "Includes acrylic counter QR standee, thermal receipt rolls, and service banners.",
        category: "financial_kits",
        price: 499,
        currency: "INR",
        stock: 120,
        images: [],
        ratings: 4.9,
        ratingCount: 19,
        isAvailable: true,
        temperedMarginEligible: true,
      },
      {
        id: "prod-elec-03",
        sku: "BMC-PRN-BLU",
        name: "Bluetooth 58mm Thermal Receipt Printer",
        description: "High-speed 90mm/s mobile receipt printer compatible with Android & iOS.",
        category: "electronics",
        price: 1850,
        currency: "INR",
        stock: 15,
        images: [],
        ratings: 4.7,
        ratingCount: 28,
        isAvailable: true,
        temperedMarginEligible: false,
      },
    ];
    setProducts(sampleItems);
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== "all" && p.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Header with Cart Button */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>BuyMeCart Store</Text>
          <Text style={styles.subGreeting}>Omnichannel Hardware & Digital Supplies</Text>
        </View>
        <TouchableOpacity onPress={onNavigateToCart} style={styles.cartBtn}>
          <Text style={styles.cartIcon}>🛒</Text>
          {cartItemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrapper}>
        <InputField
          placeholder="Search POS terminals, kits, accessories..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchInputContainer}
        />
      </View>

      {/* Category Filter Chips */}
      <View style={styles.categoryScrollWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
          {categories.map((c) => (
            <TouchableOpacity
              key={c.value}
              onPress={() => setSelectedCategory(c.value)}
              style={[
                styles.categoryChip,
                selectedCategory === c.value && styles.activeCategoryChip,
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === c.value && styles.activeCategoryText,
                ]}
              >
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Products List or Zero Dummy Data Empty State */}
      {filteredProducts.length === 0 ? (
        <ScrollView contentContainerStyle={styles.emptyContainer}>
          <EmptyState
            title="Catalog is currently empty"
            description="No inventory items loaded yet. You can provision items dynamically to test the catalog and checkout flow."
            actionLabel="+ Provision Sample Products"
            onAction={handleAddSampleCatalog}
          />
        </ScrollView>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Card style={styles.productCard}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onSelectProduct(item)}
                style={styles.cardHeader}
              >
                <View style={styles.cardTitleRow}>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Badge label={item.category.replace("_", " ").toUpperCase()} variant="sky" size="sm" />
                </View>
                <Text style={styles.productSku}>SKU: {item.sku}</Text>
                <Text style={styles.productDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              </TouchableOpacity>

              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.productPrice}>{formatINR(item.price)}</Text>
                  {item.temperedMarginEligible && (
                    <Text style={styles.marginTag}>Tempered Margin Eligible</Text>
                  )}
                </View>

                <Button
                  title="+ Add to Cart"
                  onPress={() => onAddToCart(item)}
                  size="sm"
                />
              </View>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  subGreeting: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  cartBtn: {
    padding: 8,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    position: "relative",
  },
  cartIcon: {
    fontSize: 18,
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: theme.colors.danger,
    borderRadius: theme.borderRadius.full,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  searchWrapper: {
    paddingHorizontal: 20,
    marginTop: 4,
  },
  searchInputContainer: {
    marginBottom: 8,
  },
  categoryScrollWrapper: {
    marginBottom: 8,
  },
  categoriesRow: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeCategoryChip: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  activeCategoryText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  emptyContainer: {
    paddingHorizontal: 20,
  },
  productCard: {
    padding: 14,
  },
  cardHeader: {
    marginBottom: 10,
  },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  productName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  productSku: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.mono,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  productDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 16,
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 10,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  marginTag: {
    fontSize: 10,
    color: theme.colors.accent,
    fontWeight: "600",
  },
});
