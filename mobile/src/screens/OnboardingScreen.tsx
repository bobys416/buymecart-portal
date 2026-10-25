import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { theme } from "../theme";
import { Button } from "../components/Button";

export interface OnboardingScreenProps {
  onComplete: () => void;
  onSkipToLogin: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onComplete,
  onSkipToLogin,
}) => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroSection}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>IBNK BANKING ECOSYSTEM</Text>
        </View>
        <Text style={styles.title}>Unified IBNK Banking & Financial Platform</Text>
        <Text style={styles.subtitle}>
          Authoritative banking switch for Admins, Super Distributors, Area Distributors, and Retailers.
        </Text>
      </View>

      <View style={styles.featuresList}>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>🏛️</Text>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Four Role-Based Portals</Text>
            <Text style={styles.featureDesc}>
              Segregated experiences for Admin, Super Distributor, Area Distributor, and Retailer Desks.
            </Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>💳</Text>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>IBNK Financial Switching</Text>
            <Text style={styles.featureDesc}>
              Real-time AEPS, DMT, and BBPS with Note 1 compliant neutral vouchers.
            </Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>🛡️</Text>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Self-Hosted AI & Maker-Checker Risk</Text>
            <Text style={styles.featureDesc}>
              Double-entry financial ledger integrity, automated commissions, and zero open critical defects.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <Button title="Get Started" onPress={onComplete} size="lg" />
        <Button
          title="Sign In to Existing Account"
          onPress={onSkipToLogin}
          variant="outline"
          size="lg"
          style={styles.signInButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: theme.colors.background,
    justifyContent: "space-between",
  },
  heroSection: {
    marginTop: 40,
    alignItems: "center",
  },
  badge: {
    backgroundColor: theme.colors.accentSubtle,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: theme.colors.accent,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: theme.colors.primary,
    textAlign: "center",
    lineHeight: 34,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 320,
  },
  featuresList: {
    marginVertical: 32,
    gap: 20,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 14,
  },
  featureIcon: {
    fontSize: 26,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.primary,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 17,
  },
  actions: {
    gap: 12,
    marginBottom: 20,
  },
  signInButton: {
    borderColor: theme.colors.primary,
  },
});
