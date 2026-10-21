import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { offlineManager } from "../services/offline-manager";
import { theme } from "../theme";

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(offlineManager.isOnline());

  useEffect(() => {
    const unsubscribe = offlineManager.subscribe((online) => {
      setIsOnline(online);
    });
    return () => unsubscribe();
  }, []);

  if (isOnline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>
        ⚠️ Offline Mode: Changes will be queued and synced automatically.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: theme.colors.warning,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#FFFFFF",
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "700",
  },
});
