"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Bot,
  Brain,
  ChevronDown,
  ExternalLink,
  Info,
  Maximize2,
  MessageSquare,
  Minimize2,
  RefreshCw,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { UserSession } from "@/lib/auth";
import { ChatMessage, sendChatMessage } from "@/lib/ai/chatbot-service";

interface FloatingAiChatbotProps {
  session: UserSession | null;
  portal: string;
}

const rolePrompts: Record<string, string[]> = {
  admin: [
    "Explain failed transaction settlement",
    "How to allocate limit to SD?",
    "Show Tempered Margin fee structure",
    "View pending compliance KYC count",
  ],
  sd: [
    "How do I onboard an Area Distributor?",
    "Check pending balance queries",
    "View regional commission slabs",
    "Explain transaction status codes",
  ],
  "super-distributor": [
    "How do I onboard an Area Distributor?",
    "Check pending balance queries",
    "View regional commission slabs",
    "Explain transaction status codes",
  ],
  ad: [
    "Steps for retailer vKYC",
    "How to issue Biometric Scanner kit",
    "Check retailer onboarding queue",
    "Payment query escalation policy",
  ],
  "area-distributor": [
    "Steps for retailer vKYC",
    "How to issue Biometric Scanner kit",
    "Check retailer onboarding queue",
    "Payment query escalation policy",
  ],
  retailer: [
    "What does Pending Settlement mean?",
    "How to raise a dispute ticket?",
    "Transaction receipt guidelines",
    "How are transaction fees calculated?",
  ],
};

export function FloatingAiChatbot({ session, portal }: FloatingAiChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentRole = session?.role || "retailer";
  const suggestedPrompts =
    rolePrompts[portal] || rolePrompts[currentRole] || rolePrompts.retailer;

  // Initialize welcome message once session is resolved
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome-01",
          role: "assistant",
          content: `👋 Hello **${session?.name || "Partner"}**! I am your Buymecart Fintech Assistant.\n\nAsk me about transaction statuses, compliance protocols, fee schedules, or navigation within your **${
            portal.replace("-", " ").toUpperCase()
          }** portal.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isDevelopmentMock: true,
        },
      ]);
    }
  }, [session, portal]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isTyping) return;

    setSecurityWarning(null);
    setErrorMessage(null);

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isDevelopmentMock: false,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    try {
      const response = await sendChatMessage({
        message: text,
        history: messages,
        session,
        portal,
      });

      setMessages((prev) => [...prev, response]);
      setLastFailedPrompt(null);
    } catch {
      setErrorMessage("Unable to fetch response from assistant service. Please retry.");
      setLastFailedPrompt(text);
    } finally {
      setIsTyping(false);
    }
  };

  const handleRetry = () => {
    if (lastFailedPrompt) {
      handleSendMessage(lastFailedPrompt);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content: `Conversation reset. How can I assist you with your **${portal.replace(
          "-",
          " "
        )}** operations?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isDevelopmentMock: true,
      },
    ]);
  };

  return (
    <>
      {/* ============================================================ */}
      {/* FLOATING LAUNCHER BUTTON (Bottom-Right)                       */}
      {/* ============================================================ */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
          {/* Subtle Hover Callout Pill */}
          <div className="hidden md:flex items-center gap-1.5 rounded-full bg-[#101C32] px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg border border-[#16B8A6]/30">
            <Sparkles size={12} className="text-[#16B8A6]" />
            <span>AI Assistant</span>
          </div>

          <button
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
              setTimeout(() => inputRef.current?.focus(), 150);
            }}
            className="group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[#101C32] text-[#16B8A6] shadow-[0_8px_30px_rgb(16,28,50,0.35)] transition-all duration-300 hover:scale-105 hover:bg-[#15233e] focus:outline-hidden focus:ring-4 focus:ring-[#16B8A6]/30 border border-[#16B8A6]/40"
            aria-label="Open AI Assistant"
            title="Open Buymecart AI Assistant"
          >
            <div className="relative">
              <Bot size={26} className="transition-transform group-hover:rotate-6" />
              {/* Online Pulse Indicator */}
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16B8A6] opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#16B8A6]" />
              </span>
            </div>
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* EXPANDABLE / DISMISSIBLE CHAT WINDOW                          */}
      {/* ============================================================ */}
      {isOpen && (
        <div
          className={`fixed bottom-4 right-4 z-50 flex flex-col rounded-2xl border border-[#E2E8F0] bg-white shadow-2xl transition-all duration-200 overflow-hidden ${
            isMinimized
              ? "h-14 w-80 sm:w-96"
              : "h-[580px] w-[calc(100vw-2rem)] sm:w-[420px] max-h-[85vh]"
          }`}
        >
          {/* Chat Window Header */}
          <div className="flex h-14 items-center justify-between border-b border-[#E2E8F0] bg-[#101C32] px-4 text-white">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#16B8A6] text-[#101C32] shadow-sm font-bold">
                <Bot size={18} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-black tracking-tight">AI Assistant</h3>
                  <span className="rounded bg-[#16B8A6]/20 px-1.5 py-0.2 font-mono text-[9px] font-bold text-[#16B8A6] uppercase">
                    Dev Mode
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 font-medium capitalize">
                  {portal.replace("-", " ")} Portal Copilot
                </p>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={handleClearHistory}
                className="rounded-lg p-1.5 hover:bg-white/10 hover:text-white transition"
                title="Reset conversation"
                aria-label="Reset conversation"
              >
                <RefreshCw size={13} />
              </button>

              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="rounded-lg p-1.5 hover:bg-white/10 hover:text-white transition"
                title={isMinimized ? "Expand" : "Minimize"}
                aria-label={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 hover:bg-white/10 hover:text-white transition"
                title="Close Assistant"
                aria-label="Close Assistant"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Compliance & Security Sticky Banner */}
              <div className="border-b border-[#E2E8F0] bg-[#F5F7FA] px-3 py-1.5 text-[10px] text-[#64748B] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-[#16B8A6] shrink-0" />
                  <span>
                    <strong>Rule-Based Dev Mode:</strong> Never enter OTPs or passwords.
                  </span>
                </div>
                <span className="font-mono text-[9px] text-slate-400">No live financial debit</span>
              </div>

              {/* Scrollable Conversation History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gradient-to-b from-white via-white to-[#F5F7FA]/40">
                {messages.map((msg) => {
                  const isUser = msg.role === "user";
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      {!isUser && (
                        <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#101C32] text-[#16B8A6] text-xs shrink-0 mt-0.5">
                          <Bot size={15} />
                        </div>
                      )}

                      <div
                        className={`max-w-[82%] rounded-2xl p-3 text-xs leading-relaxed shadow-xs ${
                          isUser
                            ? "bg-[#101C32] text-white rounded-tr-xs"
                            : "bg-[#F5F7FA] text-[#101C32] border border-[#E2E8F0] rounded-tl-xs"
                        }`}
                      >
                        {/* Message Content formatted with bold and linebreaks */}
                        <div className="space-y-1.5 whitespace-pre-wrap">
                          {msg.content}
                        </div>

                        {/* Optional Action Deep-Link Button */}
                        {msg.actionLink && (
                          <div className="mt-2.5 pt-2 border-t border-[#E2E8F0]">
                            <Link
                              href={msg.actionLink.url}
                              onClick={() => setIsOpen(false)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#16B8A6] px-2.5 py-1 text-[11px] font-bold text-[#101C32] hover:bg-[#14a090] transition"
                            >
                              <span>{msg.actionLink.label}</span>
                              <ArrowRight size={12} />
                            </Link>
                          </div>
                        )}

                        <div
                          className={`mt-1.5 text-[9px] text-right font-medium ${
                            isUser ? "text-slate-300" : "text-[#64748B]"
                          }`}
                        >
                          {msg.timestamp}
                        </div>
                      </div>

                      {isUser && (
                        <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#16B8A6] text-[#101C32] text-xs shrink-0 mt-0.5 font-bold">
                          <User size={14} />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Animated Typing State */}
                {isTyping && (
                  <div className="flex gap-2.5 items-center text-xs text-[#64748B]">
                    <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#101C32] text-[#16B8A6] text-xs shrink-0">
                      <Bot size={15} />
                    </div>
                    <div className="rounded-2xl bg-[#F5F7FA] px-3 py-2 border border-[#E2E8F0] flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#16B8A6] animate-bounce" />
                      <span className="h-1.5 w-1.5 rounded-full bg-[#16B8A6] animate-bounce [animation-delay:0.2s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-[#16B8A6] animate-bounce [animation-delay:0.4s]" />
                      <span className="text-[10px] text-[#64748B] ml-1.5">Assistant thinking...</span>
                    </div>
                  </div>
                )}

                {/* Error State with Retry Button */}
                {errorMessage && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle size={15} className="text-rose-600 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                    <button
                      onClick={handleRetry}
                      className="rounded-md bg-rose-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-rose-500 transition"
                    >
                      Retry
                    </button>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Contextual Suggested Prompt Chips */}
              <div className="border-t border-[#E2E8F0] bg-white p-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] px-1 mb-1.5">
                  Suggested Questions ({portal.replace("-", " ")})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedPrompts.slice(0, 3).map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt)}
                      className="rounded-lg border border-[#E2E8F0] bg-[#F5F7FA] px-2.5 py-1 text-[11px] font-medium text-[#101C32] hover:border-[#16B8A6] hover:bg-[#16B8A6]/10 hover:text-[#101C32] transition text-left"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <div className="border-t border-[#E2E8F0] bg-white p-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Ask about transactions, routes, fees..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={isTyping}
                    className="flex-1 rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] px-3.5 py-2 text-xs text-[#101C32] placeholder-[#64748B] outline-none focus:border-[#16B8A6] focus:bg-white focus:ring-1 focus:ring-[#16B8A6] transition"
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isTyping}
                    className="grid h-8 w-8 place-items-center rounded-xl bg-[#101C32] text-[#16B8A6] shadow-sm hover:bg-[#15233e] disabled:opacity-40 transition"
                    aria-label="Send message"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
