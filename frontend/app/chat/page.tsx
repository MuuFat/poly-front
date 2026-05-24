"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Languages,
  History,
  User,
  LogOut,
  Loader2,
  Sparkles,
} from "lucide-react";
import { chatService, Message } from "@/services/chatService";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Japanese",
  "Korean",
  "Chinese",
  "Russian",
  "Portuguese",
];

export default function ChatPage() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState(() => user?.targetLanguage || "English");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Clear messages when the language changes to prevent cross-language leakage
  useEffect(() => {
    setMessages([]);
  }, [language]);

  const handleSend = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage(input, language);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.reply,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen bg-[#050505] text-zinc-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="w-72 bg-zinc-900/50 border-r border-white/10 flex flex-col backdrop-blur-xl"
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                  <Sparkles className="text-white w-6 h-6" />
                </div>
                <h1 className="text-xl font-bold tracking-tight">PolyLingo</h1>
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => router.push("/conversations")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-zinc-400 hover:text-white"
                >
                  <History className="w-5 h-5" />
                  <span>History</span>
                </button>
                <div className="pt-4 pb-2">
                  <span className="px-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Target Language
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1 px-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm",
                        language === lang
                          ? "bg-primary/10 text-primary font-medium border border-primary/20"
                          : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300",
                      )}
                    >
                      <Languages className="w-4 h-4" />
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-auto p-4 border-t border-white/10">
              <div className="flex items-center gap-3 px-3 py-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user?.username}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  logout();
                  router.push("/auth");
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative min-w-0">
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/20 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                aria-label="Toggle sidebar"
                title="Toggle sidebar"
              className="p-2 hover:bg-white/5 rounded-lg transition-colors lg:hidden"
            >
              <History className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h2 className="font-semibold">{language} AI Assistant</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-400">
              <Sparkles className="w-3 h-3 text-primary" />
              GPT-4o Powered
            </div>
          </div>
        </header>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center border border-primary/30">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">
                  Start learning {language}
                </h3>
                <p className="text-zinc-500 leading-relaxed">
                  Every message you send helps you practice and improve. Our AI
                  is tuned to help you master {language} through natural
                  conversation.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 w-full">
                <button
                  onClick={() =>
                    setInput(`How do I say "Hello" in ${language}?`)
                  }
                  className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm text-left"
                >
                  How do I say "Hello" in {language}?
                </button>
                <button
                  onClick={() =>
                    setInput(`Tell me a fun fact about ${language} culture.`)
                  }
                  className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm text-left"
                >
                  Tell me a fun fact about {language} culture.
                </button>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={cn(
                "flex items-start gap-4 max-w-3xl",
                msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto",
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border",
                  msg.role === "user"
                    ? "bg-primary border-primary shadow-lg shadow-primary/20"
                    : "bg-zinc-900 border-white/10",
                )}
              >
                {msg.role === "user" ? (
                  <User className="w-5 h-5 text-white" />
                ) : (
                  <Sparkles className="w-5 h-5 text-primary" />
                )}
              </div>
              <div
                className={cn(
                  "px-5 py-3.5 rounded-2xl text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-zinc-800 text-white rounded-tr-none"
                    : "bg-white/5 text-zinc-200 border border-white/10 rounded-tl-none backdrop-blur-sm",
                )}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start gap-4 mr-auto"
            >
              <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center bg-zinc-900 border border-white/10">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="px-5 py-3.5 rounded-2xl bg-white/5 text-zinc-400 border border-white/10 rounded-tl-none flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Thinking...
              </div>
            </motion.div>
          )}
        </div>

        <div className="p-6 bg-linear-to-t from-black via-black to-transparent">
          <form
            onSubmit={handleSend}
            className="max-w-4xl mx-auto relative group"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Message PolyLingo in ${language}...`}
              className="w-full bg-zinc-900/80 border border-white/10 rounded-2xl py-4 pl-6 pr-16 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all backdrop-blur-xl group-hover:border-white/20"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
              title="Send message"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <p className="text-center text-[10px] text-zinc-600 mt-4 uppercase tracking-[0.2em]">
            PolyLingo can make mistakes. Check important info.
          </p>
        </div>
      </main>
    </div>
  );
}
