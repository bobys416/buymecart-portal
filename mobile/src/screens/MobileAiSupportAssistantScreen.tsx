import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { theme } from "../theme";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { InputField } from "../components/InputField";
import { Button } from "../components/Button";

export interface MobileAiSupportAssistantScreenProps {
  onBack: () => void;
}

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  toolInvoked?: string;
}

export const MobileAiSupportAssistantScreen: React.FC<MobileAiSupportAssistantScreenProps> = ({
  onBack,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-init",
      sender: "ai",
      text: "Hello! I am your BuyMeCart + IBNK Local Assistant, powered by self-hosted Llama-3-8B over private inference. How can I assist you with banking rails, Tempered Margin statutory rules, or dispute resolution?",
      timestamp: "Just now",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    "Explain DMT statutory fee breakdown",
    "Check UIDAI AEPS switch latency",
    "How does Note 1 neutral receipt work?",
  ];

  const handleSend = (textToSend?: string) => {
    const prompt = (textToSend || inputText).trim();
    if (!prompt) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    setTimeout(() => {
      let reply = "I have checked the system telemetry.";
      let toolInvoked: string | undefined = undefined;

      if (prompt.toLowerCase().includes("dmt") || prompt.toLowerCase().includes("margin")) {
        toolInvoked = "mcp_tempered_margin_calculator";
        reply =
          "According to statutory schedules (Page 3), DMT carries a fixed base fee (₹5 to ₹25) plus 0.45% and 18% GST. The retailer receives 60% of the commission, the distributor receives 25%, and 15% is retained for platform risk reserve.";
      } else if (prompt.toLowerCase().includes("switch") || prompt.toLowerCase().includes("latency")) {
        toolInvoked = "mcp_switch_telemetry_probe";
        reply =
          "All upstream switches are fully operational. NPCI IMPS latency is 94ms, UIDAI AEPS is 112ms, and BBPS is 88ms. No packet loss or degradation detected.";
      } else if (prompt.toLowerCase().includes("note 1") || prompt.toLowerCase().includes("receipt")) {
        reply =
          "Under PDF Page 1 Note 1 compliance, transaction receipts issued to consumers must remain strictly neutral. They display BuyMeCart + IBNK digital voucher credentials, transaction ref, and RRN, but omit third-party banking sponsor logos.";
      } else {
        reply =
          "Query processed by local model. All financial transactions on BuyMeCart are protected by local encryption, offline queue resiliency, and dual-admin Maker-Checker rules.";
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        toolInvoked,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setLoading(false);
    }, 700);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>← Back to AI Dashboard</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.badgeRow}>
          <Badge label="LOCAL LLAMA-3 RUNTIME" variant="purple" />
          <Badge label="MCP ENABLED" variant="emerald" />
        </View>
        <Text style={styles.title}>IBNK AI Copilot & Support</Text>
      </View>

      {/* Messages ScrollView */}
      <ScrollView contentContainerStyle={styles.messagesContainer}>
        {messages.map((m) => (
          <View
            key={m.id}
            style={[
              styles.messageRow,
              m.sender === "user" ? styles.userRow : styles.aiRow,
            ]}
          >
            <View
              style={[
                styles.messageBubble,
                m.sender === "user" ? styles.userBubble : styles.aiBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  m.sender === "user" ? styles.userText : styles.aiText,
                ]}
              >
                {m.text}
              </Text>

              {m.toolInvoked && (
                <View style={styles.toolPill}>
                  <Text style={styles.toolText}>🔧 Tool: {m.toolInvoked}</Text>
                </View>
              )}

              <Text
                style={[
                  styles.timestamp,
                  m.sender === "user" ? styles.userTimestamp : styles.aiTimestamp,
                ]}
              >
                {m.timestamp}
              </Text>
            </View>
          </View>
        ))}

        {loading && (
          <View style={styles.loadingRow}>
            <Text style={styles.loadingText}>
              🤖 Reasoning & querying local MCP tool mesh...
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Quick Prompts */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickPromptsRow}
      >
        {quickPrompts.map((p, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => handleSend(p)}
            style={styles.quickPromptChip}
          >
            <Text style={styles.quickPromptText}>{p}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Input Field */}
      <View style={styles.inputBar}>
        <InputField
          placeholder="Ask local AI about fees, switch status, orders..."
          value={inputText}
          onChangeText={setInputText}
          containerStyle={styles.inputContainer}
        />
        <Button
          title="Send"
          onPress={() => handleSend()}
          disabled={!inputText.trim() || loading}
          size="md"
          style={styles.sendBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  backText: {
    fontSize: 13,
    color: theme.colors.accent,
    fontWeight: "700",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 4,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  messagesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 12,
  },
  messageRow: {
    flexDirection: "row",
  },
  userRow: {
    justifyContent: "flex-end",
  },
  aiRow: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "85%",
    borderRadius: theme.borderRadius.lg,
    padding: 12,
  },
  userBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 2,
  },
  aiBubble: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderBottomLeftRadius: 2,
    ...theme.elevation.card,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 19,
  },
  userText: {
    color: "#FFFFFF",
  },
  aiText: {
    color: theme.colors.textPrimary,
  },
  toolPill: {
    marginTop: 6,
    backgroundColor: theme.colors.aiPurpleSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  toolText: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.aiPurple,
    fontFamily: theme.typography.fontFamily.mono,
  },
  timestamp: {
    fontSize: 9,
    marginTop: 4,
  },
  userTimestamp: {
    color: "#94A3B8",
    textAlign: "right",
  },
  aiTimestamp: {
    color: theme.colors.textMuted,
  },
  loadingRow: {
    padding: 8,
  },
  loadingText: {
    fontSize: 11,
    color: theme.colors.aiPurple,
    fontStyle: "italic",
  },
  quickPromptsRow: {
    paddingHorizontal: 20,
    gap: 8,
    paddingVertical: 6,
  },
  quickPromptChip: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  quickPromptText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: "600",
  },
  inputBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    alignItems: "center",
    gap: 10,
  },
  inputContainer: {
    flex: 1,
    marginBottom: 0,
  },
  sendBtn: {
    paddingHorizontal: 18,
  },
});
