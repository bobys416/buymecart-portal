import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { UserProfile } from "@buymecart/shared-types";
import { theme } from "../theme";

export interface MobileFloatingAiChatbotProps {
  currentUser: UserProfile;
  onNavigateTab?: (tabKey: string) => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  isWarning?: boolean;
}

export const MobileFloatingAiChatbot: React.FC<MobileFloatingAiChatbotProps> = ({
  currentUser,
  onNavigateTab,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      text: `Hello ${currentUser.name}! I am your BuyMeCart + IBNK AI Assistant for ${currentUser.role.replace("_", " ").toUpperCase()}. How can I assist you today?`,
      timestamp: "Just now",
    },
  ]);

  // Role-specific suggested prompts
  const getSuggestedPrompts = () => {
    switch (currentUser.role) {
      case "admin":
        return [
          "Check pending KYC review count",
          "Explain Tempered Margin fee calculation",
          "What is the current NPCI switch status?",
          "How to approve high-value transactions?",
        ];
      case "super_distributor":
        return [
          "How to onboard a new Area Distributor?",
          "What is my current pool balance?",
          "How do I allocate credit limits to ADs?",
          "Explain my commercial commission split",
        ];
      case "area_distributor":
        return [
          "Step-by-step 12-point KYC instructions",
          "How to record 30-second Video KYC?",
          "How do I assign a logistics kit serial number?",
          "Check commission statement for this week",
        ];
      case "retailer":
      default:
        return [
          "How to initiate an AEPS Cash Withdrawal?",
          "Why was my DMT transfer pending?",
          "How do I generate a Note 1 Neutral Receipt?",
          "Check my verified bank account details",
        ];
    }
  };

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText("");

    // Secret Guard check (reject OTP, PIN, Password disclosures)
    const lower = query.toLowerCase();
    const sensitiveWords = ["otp", "pin", "password", "secret", "cvv", "private key"];
    const containsSensitive = sensitiveWords.some((w) => lower.includes(w));

    setTimeout(() => {
      let reply = "";
      let isWarning = false;

      if (containsSensitive) {
        isWarning = true;
        reply =
          "🛡️ SECURITY RESTRICTION: For your safety and regulatory compliance, the BuyMeCart AI Assistant never requests, reveals, or stores OTPs, PINs, passwords, or payment credentials. Never share these with anyone.";
      } else if (lower.includes("kyc") || lower.includes("onboard")) {
        reply =
          "📋 KYC & Onboarding Guide:\n\n1. Ensure PAN and Aadhaar are valid.\n2. Complete Penny Drop verification for bank proof.\n3. Capture geotagged shop photo and applicant selfie.\n4. Record a 30-second Video KYC with randomized code recitation.";
      } else if (lower.includes("tempered margin") || lower.includes("fee") || lower.includes("commission")) {
        reply =
          "⚖️ Tempered Margin System:\n\nTempered Margin standardizes consumer convenience fees and automatically apportions statutory commissions between Retailers, Area Distributors, Super Distributors, and the Platform.";
      } else if (lower.includes("switch") || lower.includes("npci") || lower.includes("aeps")) {
        reply =
          "⚡ IBNK Switch Telemetry:\n\nActive Upstream Switches (NPCI IMPS, AEPS, BBPS Bharat BillPay) are operating normally with an average latency of 88ms and 99.98% success rate.";
      } else if (lower.includes("receipt") || lower.includes("neutral")) {
        reply =
          "🧾 Note 1 Neutral Receipt Policy:\n\nAll customer transaction slips are rendered strictly in a neutral format without third-party bank or sponsor logos, protected with a unique neutral watermark.";
      } else {
        reply = `I have received your request regarding "${query}". For specific operational tasks, you can use the role-authorized tabs or contact the compliance helpline at 1800-200-4265.`;
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isWarning,
      };

      setMessages((prev) => [...prev, aiMsg]);
    }, 400);
  };

  return (
    <>
      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.floatingIcon}>🤖</Text>
        <View style={styles.pulseDot} />
      </TouchableOpacity>

      {/* Chatbot Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.botAvatar}>
                  <Text style={styles.botAvatarText}>AI</Text>
                </View>
                <View>
                  <Text style={styles.headerTitle}>IBNK Assistant</Text>
                  <Text style={styles.headerSubtitle}>
                    Role: {currentUser.role.replace("_", " ").toUpperCase()}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Suggested Prompts */}
            <View style={styles.promptsContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promptsList}>
                {getSuggestedPrompts().map((prompt, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.promptChip}
                    onPress={() => handleSendMessage(prompt)}
                  >
                    <Text style={styles.promptChipText}>{prompt}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Messages Scroll Area */}
            <ScrollView
              style={styles.messagesList}
              contentContainerStyle={styles.messagesContent}
            >
              {messages.map((m) => (
                <View
                  key={m.id}
                  style={[
                    styles.messageBubble,
                    m.sender === "user" ? styles.userBubble : styles.aiBubble,
                    m.isWarning && styles.warningBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      m.sender === "user" ? styles.userText : styles.aiText,
                      m.isWarning && styles.warningText,
                    ]}
                  >
                    {m.text}
                  </Text>
                  <Text style={styles.messageTime}>{m.timestamp}</Text>
                </View>
              ))}
            </ScrollView>

            {/* Input Bar */}
            <View style={styles.inputBar}>
              <TextInput
                style={styles.input}
                placeholder="Ask about KYC, transactions, limits..."
                placeholderTextColor={theme.colors.textMuted}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => handleSendMessage()}
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={() => handleSendMessage()}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: "absolute",
    right: 18,
    bottom: 84,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.teal,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 999,
  },
  floatingIcon: {
    fontSize: 24,
  },
  pulseDot: {
    position: "absolute",
    top: 3,
    right: 3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.teal,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(16, 28, 50, 0.65)",
    justifyContent: "flex-end",
  },
  modalContent: {
    height: "75%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.colors.primary,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  botAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  botAvatarText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 12,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },
  headerSubtitle: {
    color: theme.colors.tealLight,
    fontSize: 10,
    fontWeight: "600",
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  promptsContainer: {
    backgroundColor: theme.colors.surfaceSubtle,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  promptsList: {
    paddingHorizontal: 12,
    gap: 8,
  },
  promptChip: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  promptChipText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: "600",
  },
  messagesList: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: "82%",
    padding: 12,
    borderRadius: 12,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 2,
  },
  aiBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderBottomLeftRadius: 2,
  },
  warningBubble: {
    backgroundColor: "#FFF1F2",
    borderColor: "#FB7185",
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  userText: {
    color: "#FFFFFF",
  },
  aiText: {
    color: theme.colors.textPrimary,
  },
  warningText: {
    color: "#9F1239",
    fontWeight: "500",
  },
  messageTime: {
    fontSize: 9,
    color: theme.colors.textMuted,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 13,
    color: theme.colors.textPrimary,
  },
  sendButton: {
    backgroundColor: theme.colors.teal,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 12,
  },
});
