import React, { useState, useEffect } from "react";
import { View, StyleSheet, SafeAreaView, StatusBar, BackHandler, ActivityIndicator, Text } from "react-native";
import { UserProfile } from "@buymecart/shared-types";
import { theme } from "../theme";
import { secureStorage } from "../services/secure-storage";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { AuthScreen } from "../screens/AuthScreen";
import { ForgotPasswordScreen } from "../screens/ForgotPasswordScreen";
import { MainTabNavigator } from "./MainTabNavigator";

export const RootNavigator: React.FC = () => {
  const [initializing, setInitializing] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authStep, setAuthStep] = useState<"auth" | "forgot_password">("auth");

  // App Initialization & Session Restoration
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await secureStorage.getAccessToken();
        if (token) {
          // Determine restored user from token
          let role: UserProfile["role"] = "retailer";
          let orgScope = "RET-ZONE-01-401";
          let name = "Patel Digital Kendra (Rajesh Patel)";

          if (token.includes("admin")) {
            role = "admin";
            orgScope = "SYSTEM-WIDE";
            name = "Admin Master User";
          } else if (token.includes("super_distributor") || token.includes("sd")) {
            role = "super_distributor";
            orgScope = "SD-CENTRAL-01";
            name = "Central Spark FinTech Pvt Ltd";
          } else if (token.includes("area_distributor") || token.includes("ad")) {
            role = "area_distributor";
            orgScope = "AD-ZONE-01";
            name = "Sunil Verma (AD)";
          }

          setCurrentUser({
            id: "usr-restored-01",
            name,
            email: `${role}@buymecart.org`,
            phone: "9876543210",
            role,
            portal: role === "admin" ? "admin" : role === "retailer" ? "retailer" : "distributor",
            orgScope,
            kycVerified: true,
            createdAt: new Date().toISOString(),
          });
          setHasOnboarded(true);
        }
      } catch {
        // Fallback to unauthenticated state
      } finally {
        setInitializing(false);
      }
    };

    restoreSession();
  }, []);

  // Android Hardware Back Handling
  useEffect(() => {
    const backAction = () => {
      if (authStep === "forgot_password") {
        setAuthStep("auth");
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, [authStep]);

  const handleLogout = async () => {
    await secureStorage.clearTokens();
    setCurrentUser(null);
    setAuthStep("auth");
  };

  if (initializing) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#101C32" />
        <View style={styles.splashBadge}>
          <Text style={styles.splashBadgeText}>BUYMECART · IBNK</Text>
        </View>
        <ActivityIndicator size="large" color={theme.colors.teal} />
        <Text style={styles.splashText}>Restoring Secure Hardware Session...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />
      <View style={styles.container}>
        {!hasOnboarded ? (
          <OnboardingScreen
            onComplete={() => setHasOnboarded(true)}
            onSkipToLogin={() => setHasOnboarded(true)}
          />
        ) : !currentUser ? (
          authStep === "auth" ? (
            <AuthScreen
              onSuccess={(user) => setCurrentUser(user)}
              onForgotPassword={() => setAuthStep("forgot_password")}
            />
          ) : (
            <ForgotPasswordScreen onBackToLogin={() => setAuthStep("auth")} />
          )
        ) : (
          <MainTabNavigator
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  splashContainer: {
    flex: 1,
    backgroundColor: "#101C32",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  splashBadge: {
    backgroundColor: theme.colors.teal,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  splashBadgeText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 1.5,
  },
  splashText: {
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "600",
  },
});
