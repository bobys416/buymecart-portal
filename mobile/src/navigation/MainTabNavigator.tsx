import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import {
  UserProfile,
  FinancialTransaction,
} from "@buymecart/shared-types";
import { theme } from "../theme";
import { OfflineBanner } from "../components/OfflineBanner";
import { MobileFloatingAiChatbot } from "../components/MobileFloatingAiChatbot";
import { ProfileScreen } from "../screens/ProfileScreen";

// Admin Screens
import { AdminOverviewScreen } from "../screens/AdminOverviewScreen";
import { AdminNetworkManagementScreen } from "../screens/AdminNetworkManagementScreen";
import { AdminKycReviewScreen } from "../screens/AdminKycReviewScreen";
import { AdminAuditHistoryScreen } from "../screens/AdminAuditHistoryScreen";

// Super Distributor Screens
import { SuperDistributorOverviewScreen } from "../screens/SuperDistributorOverviewScreen";
import { SuperDistributorAdNetworkScreen } from "../screens/SuperDistributorAdNetworkScreen";
import { SuperDistributorOnboardingScreen } from "../screens/SuperDistributorOnboardingScreen";
import { SuperDistributorReportsScreen } from "../screens/SuperDistributorReportsScreen";

// Area Distributor Screens
import { AreaDistributorOverviewScreen } from "../screens/AreaDistributorOverviewScreen";
import { AreaDistributorRetailersScreen } from "../screens/AreaDistributorRetailersScreen";
import { AreaDistributorKycQueueScreen } from "../screens/AreaDistributorKycQueueScreen";
import { AreaDistributorReportsScreen } from "../screens/AreaDistributorReportsScreen";

// Retailer Screens
import { RetailerDashboardScreen } from "../screens/RetailerDashboardScreen";
import { TransactionsScreen } from "../screens/TransactionsScreen";
import { TransactionDetailScreen } from "../screens/TransactionDetailScreen";
import { RetailerKycStatusScreen } from "../screens/RetailerKycStatusScreen";
import { MobileSupportScreen } from "../screens/MobileSupportScreen";

export interface MainTabNavigatorProps {
  currentUser: UserProfile;
  onLogout: () => void;
}

export const MainTabNavigator: React.FC<MainTabNavigatorProps> = ({
  currentUser,
  onLogout,
}) => {
  // Compute default active tab per role
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Retailer transaction detail sub-stack
  const [selectedTx, setSelectedTx] = useState<FinancialTransaction | null>(null);

  // Tab configurations per role
  const getTabsForRole = () => {
    switch (currentUser.role) {
      case "admin":
        return [
          { key: "overview", label: "Overview", icon: "📊" },
          { key: "network", label: "Network", icon: "👥" },
          { key: "kyc_queue", label: "KYC Review", icon: "📋" },
          { key: "audit", label: "Audit Stream", icon: "🛡️" },
          { key: "profile", label: "Profile", icon: "👤" },
        ];
      case "super_distributor":
        return [
          { key: "overview", label: "SD Float", icon: "🏢" },
          { key: "ad_network", label: "Area Dists", icon: "📍" },
          { key: "onboarding", label: "AD Onboard", icon: "📝" },
          { key: "reports", label: "Commercials", icon: "📈" },
          { key: "profile", label: "Profile", icon: "👤" },
        ];
      case "area_distributor":
        return [
          { key: "overview", label: "AD Desk", icon: "🏪" },
          { key: "retailers", label: "Retailers", icon: "🏬" },
          { key: "kyc_corrections", label: "KYC Queue", icon: "📋" },
          { key: "reports", label: "Ledger", icon: "📊" },
          { key: "profile", label: "Profile", icon: "👤" },
        ];
      case "retailer":
      default:
        return [
          { key: "overview", label: "Retail Desk", icon: "💳" },
          { key: "transactions", label: "Receipts", icon: "🧾" },
          { key: "kyc_bank", label: "KYC & Bank", icon: "🛡️" },
          { key: "support", label: "Help", icon: "🎧" },
          { key: "profile", label: "Profile", icon: "👤" },
        ];
    }
  };

  const tabs = getTabsForRole();

  return (
    <View style={styles.container}>
      {/* Offline Status Warning Banner */}
      <OfflineBanner />

      {/* Main Screen Host */}
      <View style={styles.screenContainer}>
        {/* ========================================================= */}
        {/* 1. ADMIN SCREENS                                          */}
        {/* ========================================================= */}
        {currentUser.role === "admin" && (
          <>
            {activeTab === "overview" && (
              <AdminOverviewScreen
                onNavigateToNetwork={() => setActiveTab("network")}
                onNavigateToKyc={() => setActiveTab("kyc_queue")}
                onNavigateToAudit={() => setActiveTab("audit")}
              />
            )}
            {activeTab === "network" && <AdminNetworkManagementScreen />}
            {activeTab === "kyc_queue" && <AdminKycReviewScreen />}
            {activeTab === "audit" && <AdminAuditHistoryScreen />}
            {activeTab === "profile" && (
              <ProfileScreen
                user={currentUser}
                onLogout={onLogout}
                onNavigateToSupport={() => setActiveTab("audit")}
              />
            )}
          </>
        )}

        {/* ========================================================= */}
        {/* 2. SUPER DISTRIBUTOR SCREENS                              */}
        {/* ========================================================= */}
        {currentUser.role === "super_distributor" && (
          <>
            {activeTab === "overview" && (
              <SuperDistributorOverviewScreen
                onNavigateToAds={() => setActiveTab("ad_network")}
                onNavigateToOnboarding={() => setActiveTab("onboarding")}
                onNavigateToReports={() => setActiveTab("reports")}
              />
            )}
            {activeTab === "ad_network" && <SuperDistributorAdNetworkScreen />}
            {activeTab === "onboarding" && <SuperDistributorOnboardingScreen />}
            {activeTab === "reports" && <SuperDistributorReportsScreen />}
            {activeTab === "profile" && (
              <ProfileScreen
                user={currentUser}
                onLogout={onLogout}
                onNavigateToSupport={() => setActiveTab("reports")}
              />
            )}
          </>
        )}

        {/* ========================================================= */}
        {/* 3. AREA DISTRIBUTOR SCREENS                               */}
        {/* ========================================================= */}
        {currentUser.role === "area_distributor" && (
          <>
            {activeTab === "overview" && (
              <AreaDistributorOverviewScreen
                onNavigateToRetailers={() => setActiveTab("retailers")}
                onNavigateToKycQueue={() => setActiveTab("kyc_corrections")}
                onNavigateToReports={() => setActiveTab("reports")}
              />
            )}
            {activeTab === "retailers" && <AreaDistributorRetailersScreen />}
            {activeTab === "kyc_corrections" && <AreaDistributorKycQueueScreen />}
            {activeTab === "reports" && <AreaDistributorReportsScreen />}
            {activeTab === "profile" && (
              <ProfileScreen
                user={currentUser}
                onLogout={onLogout}
                onNavigateToSupport={() => setActiveTab("reports")}
              />
            )}
          </>
        )}

        {/* ========================================================= */}
        {/* 4. RETAILER SCREENS                                       */}
        {/* ========================================================= */}
        {currentUser.role === "retailer" && (
          <>
            {activeTab === "overview" && (
              <RetailerDashboardScreen
                onNavigateToTransactions={() => setActiveTab("transactions")}
                onNavigateToKyc={() => setActiveTab("kyc_bank")}
                onNavigateToSupport={() => setActiveTab("support")}
              />
            )}
            {activeTab === "transactions" && (
              selectedTx ? (
                <TransactionDetailScreen
                  transaction={selectedTx}
                  onBack={() => setSelectedTx(null)}
                  onFileDispute={() => setActiveTab("support")}
                />
              ) : (
                <TransactionsScreen
                  transactions={[]}
                  onSelectTransaction={(tx) => setSelectedTx(tx)}
                  onInitiateTransaction={() => setActiveTab("overview")}
                />
              )
            )}
            {activeTab === "kyc_bank" && <RetailerKycStatusScreen />}
            {activeTab === "support" && <MobileSupportScreen />}
            {activeTab === "profile" && (
              <ProfileScreen
                user={currentUser}
                onLogout={onLogout}
                onNavigateToSupport={() => setActiveTab("support")}
              />
            )}
          </>
        )}
      </View>

      {/* Role-Aware Floating AI Assistant Chatbot */}
      <MobileFloatingAiChatbot
        currentUser={currentUser}
        onNavigateTab={(tabKey) => setActiveTab(tabKey)}
      />

      {/* Role-Specific Bottom Navigation Bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => {
                setActiveTab(tab.key);
                setSelectedTx(null);
              }}
              style={styles.tabItem}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingVertical: 8,
    paddingBottom: 14,
    ...theme.elevation.panel,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  tabIcon: {
    fontSize: 18,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.textSecondary,
  },
  activeTabLabel: {
    color: theme.colors.tealDark,
    fontWeight: "900",
  },
});
