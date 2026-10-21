import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { CartItem, Order, PaymentMethodType, ShippingAddress } from "@buymecart/shared-types";
import { calculateCartTotals, formatINR } from "@buymecart/business-logic";
import { shippingAddressSchema } from "@buymecart/validation";
import { theme } from "../theme";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { InputField } from "../components/InputField";
import { EmptyState } from "../components/EmptyState";
import { Badge } from "../components/Badge";

export interface CartCheckoutScreenProps {
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onOrderPlaced: (order: Order) => void;
  onContinueShopping: () => void;
}

export const CartCheckoutScreen: React.FC<CartCheckoutScreenProps> = ({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onOrderPlaced,
  onContinueShopping,
}) => {
  const [step, setStep] = useState<"cart" | "checkout">("cart");

  // Shipping Address Form
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [locality, setLocality] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [pincode, setPincode] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethodType>("upi");
  const [addressError, setAddressError] = useState<string | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);

  const totals = calculateCartTotals(cartItems, true);

  const handleProceedToCheckout = () => {
    setStep("checkout");
  };

  const handlePlaceOrder = () => {
    setAddressError(null);
    const addressData = {
      fullName,
      phone,
      streetAddress,
      locality,
      city,
      state: stateName,
      pincode,
    };

    const parsed = shippingAddressSchema.safeParse(addressData);
    if (!parsed.success) {
      setAddressError(parsed.error.errors[0]?.message || "Invalid address details");
      return;
    }

    setPlacingOrder(true);
    setTimeout(() => {
      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        orderNumber: `BMC-ORD-${Date.now().toString().slice(-6)}`,
        customerId: "cust-current-01",
        items: [...cartItems],
        subtotal: totals.subtotal,
        temperedMarginFee: totals.temperedMarginFee,
        taxAmount: totals.taxAmount,
        shippingFee: totals.shippingFee,
        totalAmount: totals.grandTotal,
        paymentMethod: selectedPayment,
        paymentStatus: "paid",
        orderStatus: "placed",
        shippingAddress: {
          ...addressData,
          country: "India",
        },
        trackingNumber: `TRK-IN-${Date.now().toString().slice(-8)}`,
        estimatedDelivery: new Date(Date.now() + 3 * 86400000).toLocaleDateString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setPlacingOrder(false);
      onOrderPlaced(newOrder);
    }, 800);
  };

  if (cartItems.length === 0) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <EmptyState
          title="Your shopping cart is empty"
          description="Browse the BuyMeCart catalog to procure POS terminals, financial kits, and digital hardware."
          actionLabel="Explore Catalog"
          onAction={onContinueShopping}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Step Indicator */}
      <View style={styles.stepIndicator}>
        <TouchableOpacity
          onPress={() => setStep("cart")}
          style={[styles.stepItem, step === "cart" && styles.activeStepItem]}
        >
          <Text style={[styles.stepText, step === "cart" && styles.activeStepText]}>
            1. Cart Items ({totals.itemCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setStep("checkout")}
          style={[styles.stepItem, step === "checkout" && styles.activeStepItem]}
        >
          <Text style={[styles.stepText, step === "checkout" && styles.activeStepText]}>
            2. Shipping & Payment
          </Text>
        </TouchableOpacity>
      </View>

      {step === "cart" ? (
        /* STEP 1: CART ITEMS */
        <View style={styles.section}>
          <View style={styles.itemsList}>
            {cartItems.map((item) => (
              <Card key={item.product.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.product.name}</Text>
                    <Text style={styles.itemSku}>SKU: {item.product.sku}</Text>
                    <Text style={styles.itemPrice}>
                      {formatINR(item.product.price)} each
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => onRemoveItem(item.product.id)}
                    style={styles.deleteBtn}
                  >
                    <Text style={styles.deleteText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.itemFooter}>
                  <View style={styles.qtyControls}>
                    <TouchableOpacity
                      onPress={() =>
                        onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))
                      }
                      style={styles.qtyBtn}
                    >
                      <Text style={styles.qtyBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity
                      onPress={() =>
                        onUpdateQuantity(item.product.id, item.quantity + 1)
                      }
                      style={styles.qtyBtn}
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.itemLineTotal}>
                    {formatINR(item.product.price * item.quantity)}
                  </Text>
                </View>
              </Card>
            ))}
          </View>

          {/* Pricing Summary Card */}
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Order Price Breakdown</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal ({totals.itemCount} items):</Text>
              <Text style={styles.summaryValue}>{formatINR(totals.subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tempered Margin Statutory Fee:</Text>
              <Text style={styles.summaryValue}>{formatINR(totals.temperedMarginFee)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Estimated GST (5%):</Text>
              <Text style={styles.summaryValue}>{formatINR(totals.taxAmount)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Standard Shipping:</Text>
              <Text style={styles.summaryValue}>
                {totals.shippingFee === 0 ? "FREE" : formatINR(totals.shippingFee)}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.grandTotalLabel}>Grand Total:</Text>
              <Text style={styles.grandTotalValue}>{formatINR(totals.grandTotal)}</Text>
            </View>

            <Button
              title="Proceed to Shipping & Payment →"
              onPress={handleProceedToCheckout}
              size="lg"
              style={styles.checkoutBtn}
            />
          </Card>
        </View>
      ) : (
        /* STEP 2: CHECKOUT & MULTI-RAIL PAYMENT */
        <View style={styles.section}>
          {addressError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {addressError}</Text>
            </View>
          )}

          <Card style={styles.formCard}>
            <Text style={styles.formTitle}>Shipping Address (India Delivery)</Text>

            <InputField
              label="Recipient Full Name"
              placeholder="e.g. Ramesh Patel"
              value={fullName}
              onChangeText={setFullName}
            />
            <InputField
              label="10-Digit Mobile Number"
              placeholder="9876543210"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <InputField
              label="Street Address / Building"
              placeholder="Shop No. 4, Main Market Road"
              value={streetAddress}
              onChangeText={setStreetAddress}
            />
            <InputField
              label="Locality / Landmark"
              placeholder="Near Central Bank Branch"
              value={locality}
              onChangeText={setLocality}
            />

            <View style={styles.inlineInputs}>
              <InputField
                label="City"
                placeholder="Enter City"
                value={city}
                onChangeText={setCity}
                containerStyle={styles.halfInput}
              />
              <InputField
                label="State"
                placeholder="Madhya Pradesh"
                value={stateName}
                onChangeText={setStateName}
                containerStyle={styles.halfInput}
              />
            </View>

            <InputField
              label="6-Digit Pincode"
              placeholder="462001"
              value={pincode}
              onChangeText={setPincode}
              keyboardType="number-pad"
            />
          </Card>

          {/* Payment Method Selector */}
          <Card style={styles.formCard}>
            <Text style={styles.formTitle}>Select Payment Rail</Text>
            <View style={styles.paymentMethodsList}>
              {[
                { id: "upi", title: "UPI (Google Pay, PhonePe, Paytm, BHIM)", tag: "Instant" },
                { id: "card", title: "Credit / Debit Card (RuPay, Visa, MC)", tag: "Secured" },
                { id: "ibnk_escrow", title: "IBNK Retailer Escrow Balance", tag: "Zero Surcharge" },
                { id: "netbanking", title: "NetBanking Direct Gateway", tag: "All Banks" },
                { id: "cash_on_delivery", title: "Cash On Delivery (COD)", tag: "Verified" },
              ].map((m) => (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => setSelectedPayment(m.id as PaymentMethodType)}
                  style={[
                    styles.paymentMethodItem,
                    selectedPayment === m.id && styles.activePaymentMethodItem,
                  ]}
                >
                  <View style={styles.paymentRadio}>
                    {selectedPayment === m.id && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.paymentTextWrapper}>
                    <Text style={styles.paymentTitle}>{m.title}</Text>
                    <Badge label={m.tag} variant="neutral" size="sm" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Final Payable */}
          <Card style={styles.finalPayCard}>
            <View style={styles.finalPayRow}>
              <View>
                <Text style={styles.finalPayLabel}>Amount Payable:</Text>
                <Text style={styles.finalPayValue}>{formatINR(totals.grandTotal)}</Text>
              </View>
              <Button
                title={placingOrder ? "Placing Order..." : "Confirm & Pay Now"}
                onPress={handlePlaceOrder}
                loading={placingOrder}
                size="lg"
                style={styles.payNowBtn}
              />
            </View>
          </Card>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  stepIndicator: {
    flexDirection: "row",
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.borderRadius.md,
    padding: 4,
    marginBottom: 16,
  },
  stepItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: theme.borderRadius.sm,
  },
  activeStepItem: {
    backgroundColor: "#FFFFFF",
    ...theme.elevation.card,
  },
  stepText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  activeStepText: {
    color: theme.colors.primary,
    fontWeight: "800",
  },
  section: {
    gap: 16,
  },
  itemsList: {
    gap: 10,
  },
  itemCard: {
    padding: 14,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  itemSku: {
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.mono,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.primary,
    marginTop: 4,
  },
  deleteBtn: {
    padding: 4,
  },
  deleteText: {
    fontSize: 16,
    color: theme.colors.textMuted,
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 8,
  },
  qtyControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.borderRadius.sm,
  },
  qtyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  qtyBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  qtyText: {
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 8,
    color: theme.colors.textPrimary,
  },
  itemLineTotal: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.textPrimary,
  },
  summaryCard: {
    padding: 16,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.primary,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: "900",
    color: theme.colors.primary,
  },
  checkoutBtn: {
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: theme.colors.dangerSubtle,
    borderWidth: 1,
    borderColor: theme.colors.danger,
    borderRadius: theme.borderRadius.md,
    padding: 10,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.danger,
    fontWeight: "600",
  },
  formCard: {
    padding: 16,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.primary,
    marginBottom: 14,
  },
  inlineInputs: {
    flexDirection: "row",
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  paymentMethodsList: {
    gap: 10,
  },
  paymentMethodItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "#FFFFFF",
    gap: 12,
  },
  activePaymentMethodItem: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surfaceSubtle,
  },
  paymentRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  paymentTextWrapper: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  finalPayCard: {
    padding: 16,
    backgroundColor: theme.colors.primary,
  },
  finalPayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  finalPayLabel: {
    fontSize: 11,
    color: "#94A3B8",
  },
  finalPayValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  payNowBtn: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: 20,
  },
});
