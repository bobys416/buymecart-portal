import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from "react-native";
import { UserProfile } from "@buymecart/shared-types";
import { theme } from "../theme";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { offlineManager } from "../services/offline-manager";
import { mobileApiClient } from "../services/api-client";

export interface ProfileScreenProps {
  user: UserProfile;
  onLogout: () => void;
  onNavigateToSupport: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  onLogout,
  onNavigateToSupport,
}) => {
  const [biometricsEnabled, setBiometricsEnabled] = useState(user.biometricsEnabled || false);
  const [offlineCount, setOfflineCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    offlineManager.queue.getQueue().then((q) => setOfflineCount(q.length));
  }, []);

  const handleSyncQueue = async () => {
    setSyncing(true);
    await mobileApiClient.syncOfflineQueue();
    const updated = await offlineManager.queue.getQueue();
    setOfflineCount(updated.length);
    setSyncing(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.screenTitle}>My Profile & Account</Text>

      {/* User Information Card */}
      <Card style={styles.profileCard}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {user.name.slice(0, 2).toUpperCase()}
          </Text>
        </View>

        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userRole}>
          {user.role.toUpperCase()} · Scope: {user.orgScope}
        </Text>

        <View style={styles.badgeRow}>
          <Badge
            label={user.kycVerified ? "KYC VERIFIED" : "KYC PENDING"}
            variant={user.kycVerified ? "emerald" : "amber"}
          />
          <Badge label={`PORTAL: ${user.portal.toUpperCase()}`} variant="navy" />
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoVal}>{user.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone:</Text>
          <Text style={styles.infoVal}>{user.phone}</Text>
        </View>
      </Card>

      {/* Security & Device Settings */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Security & Biometrics</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingTextWrapper}>
            <Text style={styles.settingTitle}>Face ID / Biometric Quick Unlock</Text>
            <Text style={styles.settingDesc}>
              Require biometric authentication when launching mobile banking rails.
            </Text>
          </View>
          <Switch
            value={biometricsEnabled}
            onValueChange={setBiometricsEnabled}
            trackColor={{ false: "#CBD5E1", true: theme.colors.primary }}
          />
        </View>
      </Card>

      {/* Offline Storage Status */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Offline Network Resilience</Text>
        <Text style={styles.settingDesc}>
          Pending offline mutation queue: {offlineCount} transactions/actions queued.
        </Text>
        <View style={styles.syncBtnWrapper}>
          <Button
            title={syncing ? "Synchronizing..." : "Sync Offline Queue Now"}
            onPress={handleSyncQueue}
            loading={syncing}
            variant="outline"
            size="sm"
          />
        </View>
      </Card>

      {/* Support & Legal */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Support & Compliance</Text>
        <TouchableOpacity onPress={onNavigateToSupport} style={styles.supportLink}>
          <Text style={styles.supportLinkText}>🎧 Contact BuyMeCart Merchant Desk →</Text>
        </TouchableOpacity>
        <Text style={styles.complianceNote}>
          Platform strictly complies with Note 1 neutral voucher mandates and self-hosted AI governance.
        </Text>
      </Card>

      {/* Logout */}
      <Button
        title="Sign Out of Account"
        onPress={onLogout}
        variant="danger"
        size="lg"
        style={styles.logoutBtn}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: theme.colors.background,
    gap: 14,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.primary,
    marginBottom: 4,
  },
  profileCard: {
    padding: 20,
    alignItems: "center",
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },
  userName: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.textPrimary,
  },
  userRole: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: "600",
    marginTop: 2,
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 14,
    width: "100%",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  infoVal: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  sectionCard: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.primary,
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingTextWrapper: {
    flex: 1,
    paddingRight: 12,
  },
  settingTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  settingDesc: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  syncBtnWrapper: {
    marginTop: 10,
  },
  supportLink: {
    paddingVertical: 6,
  },
  supportLinkText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.accent,
  },
  complianceNote: {
    fontSize: 10,
    color: theme.colors.textMuted,
    lineHeight: 14,
    marginTop: 6,
  },
  logoutBtn: {
    marginTop: 6,
    marginBottom: 20,
  },
});
