import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { LocalAiTelemetry } from "@buymecart/shared-types";
import { theme } from "../theme";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";

export interface MobileAiDashboardScreenProps {
  onNavigateToAlerts: () => void;
  onNavigateToApprovals: () => void;
  onNavigateToCopilot: () => void;
}

export const MobileAiDashboardScreen: React.FC<MobileAiDashboardScreenProps> = ({
  onNavigateToAlerts,
  onNavigateToApprovals,
  onNavigateToCopilot,
}) => {
  const [telemetry, setTelemetry] = useState<LocalAiTelemetry>({
    runtimeEngine: "Ollama",
    activeModel: "Llama-3-8B-Instruct-Q4_K_M.gguf",
    inferenceDevice: "NVIDIA RTX / CUDA",
    hostCpuUsagePct: 18.5,
    systemRamGb: 32.0,
    gpuVramUsageGb: 5.8,
    gpuVramTotalGb: 12.0,
    contextWindowUsedTokens: 1420,
    contextWindowMaxTokens: 8192,
    averageInferenceTokensPerSec: 48.2,
    uptimeSeconds: 86400,
  });

  const availableModels = [
    "Llama-3-8B-Instruct-Q4_K_M.gguf",
    "Mistral-7B-Instruct-v0.3.Q5_K_M.gguf",
    "Qwen-2.5-7B-Banking.gguf",
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.badgeRow}>
          <Badge label="LOCAL OPEN-WEIGHT AI RUNTIME" variant="purple" />
          <Badge label="ZERO PAID APIS" variant="emerald" />
        </View>
        <Text style={styles.title}>AI Control & Banking Radar</Text>
        <Text style={styles.subtitle}>
          Autonomous local intelligence running over private on-premise inference nodes.
        </Text>
      </View>

      {/* Navigation Quick Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          onPress={onNavigateToAlerts}
          style={[styles.actionTile, { borderColor: theme.colors.danger }]}
        >
          <Text style={styles.actionIcon}>🚨</Text>
          <Text style={styles.actionTitle}>Risk Radar</Text>
          <Text style={styles.actionSub}>Velocity & Fraud</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onNavigateToApprovals}
          style={[styles.actionTile, { borderColor: theme.colors.warning }]}
        >
          <Text style={styles.actionIcon}>⚖️</Text>
          <Text style={styles.actionTitle}>Approvals</Text>
          <Text style={styles.actionSub}>Maker-Checker</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onNavigateToCopilot}
          style={[styles.actionTile, { borderColor: theme.colors.aiPurple }]}
        >
          <Text style={styles.actionIcon}>🤖</Text>
          <Text style={styles.actionTitle}>AI Support</Text>
          <Text style={styles.actionSub}>Local Copilot</Text>
        </TouchableOpacity>
      </View>

      {/* Hardware Telemetry Card */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Inference Accelerator & Hardware VRAM</Text>
        <Text style={styles.engineText}>
          Engine: {telemetry.runtimeEngine} · Device: {telemetry.inferenceDevice}
        </Text>

        <View style={styles.gaugeContainer}>
          <View style={styles.gaugeHeader}>
            <Text style={styles.gaugeLabel}>GPU VRAM Utilization</Text>
            <Text style={styles.gaugeVal}>
              {telemetry.gpuVramUsageGb.toFixed(1)} / {telemetry.gpuVramTotalGb.toFixed(1)} GB (
              {Math.round((telemetry.gpuVramUsageGb / telemetry.gpuVramTotalGb) * 100)}%)
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${(telemetry.gpuVramUsageGb / telemetry.gpuVramTotalGb) * 100}%`,
                  backgroundColor: theme.colors.aiPurple,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.gaugeContainer}>
          <View style={styles.gaugeHeader}>
            <Text style={styles.gaugeLabel}>Active Context Window</Text>
            <Text style={styles.gaugeVal}>
              {telemetry.contextWindowUsedTokens} / {telemetry.contextWindowMaxTokens} tokens
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${(telemetry.contextWindowUsedTokens / telemetry.contextWindowMaxTokens) * 100}%`,
                  backgroundColor: theme.colors.accent,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Throughput</Text>
            <Text style={styles.statVal}>{telemetry.averageInferenceTokensPerSec} t/s</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Host CPU</Text>
            <Text style={styles.statVal}>{telemetry.hostCpuUsagePct}%</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Host RAM</Text>
            <Text style={styles.statVal}>{telemetry.systemRamGb} GB</Text>
          </View>
        </View>
      </Card>

      {/* Model Weight Switcher */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Self-Hosted Active Model Weight</Text>
        <Text style={styles.cardDesc}>
          Select open-weight weights loaded in RAM for on-device inference without cloud API dependencies.
        </Text>

        <View style={styles.modelsList}>
          {availableModels.map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setTelemetry({ ...telemetry, activeModel: m })}
              style={[
                styles.modelItem,
                telemetry.activeModel === m && styles.activeModelItem,
              ]}
            >
              <View style={styles.radio}>
                {telemetry.activeModel === m && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.modelName}>{m}</Text>
            </TouchableOpacity>
          ))}
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
    gap: 16,
  },
  header: {
    gap: 6,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 17,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionTile: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1.5,
    alignItems: "center",
    ...theme.elevation.card,
  },
  actionIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  actionSub: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
  card: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  cardDesc: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
    marginBottom: 12,
    lineHeight: 16,
  },
  engineText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
    marginBottom: 14,
  },
  gaugeContainer: {
    marginBottom: 12,
  },
  gaugeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  gaugeLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  gaugeVal: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.mono,
    color: theme.colors.textSecondary,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.surfaceSubtle,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
    marginTop: 6,
  },
  statBox: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  statVal: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.primary,
    marginTop: 2,
  },
  modelsList: {
    gap: 8,
  },
  modelItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: 10,
  },
  activeModelItem: {
    borderColor: theme.colors.aiPurple,
    backgroundColor: theme.colors.aiPurpleSubtle,
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.aiPurple,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.aiPurple,
  },
  modelName: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.mono,
    color: theme.colors.textPrimary,
    fontWeight: "600",
  },
});
