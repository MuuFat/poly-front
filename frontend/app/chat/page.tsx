"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  History,
  User,
  LogOut,
  Loader2,
  Sparkles,
  BookOpen,
  Languages,
} from "lucide-react";
import { chatService, Message } from "@/services/chatService";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const languageOptions = [
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
  "Turkish",
];

export default function ChatPage() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [hasHydrated, setHasHydrated] = useState(() => useAuthStore.persist?.hasHydrated?.() ?? false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState(() => user?.targetLanguage || "Polish");
  const [nativeLanguage, setNativeLanguage] = useState(() => user?.nativeLanguage || "English");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [convId, setConvId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = useAuthStore.persist?.onFinishHydration?.(() => {
      setHasHydrated(true);
    });

    if (useAuthStore.persist?.hasHydrated?.()) {
      setHasHydrated(true);
    }

    return unsubscribe;
  }, []);

  const startNewConversation = () => {
    setConvId(null);
    setMessages([]);
    setInput("");
    setLanguage(user?.targetLanguage || "Polish");
    setNativeLanguage(user?.nativeLanguage || "English");
    router.replace("/chat");
  };

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.replace("/auth");
    }
  }, [hasHydrated, isAuthenticated, router]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Clear messages when the language changes to prevent cross-language leakage
  useEffect(() => {
    // Only clear messages when not viewing a saved conversation.
    if (!convId) setMessages([]);
  }, [language, convId]);

  // Load conversation messages when an `id` query param is present
  useEffect(() => {
    // read convId from the URL on mount if not already set
    if (!convId) {
      try {
        const params = new URLSearchParams(globalThis.location?.search || "");
        const id = params.get('id');
        if (id) setConvId(id);
      } catch (error) {
        console.error('Failed to read conversation id from URL:', error);
      }
    }
    if (!convId) return;
    let cancelled = false;
    const fetchConversation = async () => {
      try {
        const data = await chatService.getConversation(convId, { page: 1, limit: 500 });
        const conv = data.conversation;
        if (!conv || cancelled) return;

        // Map backend messages to frontend Message shape
        const mapped = (conv.messages || []).map((m: any, i: number) => ({
          id: `${new Date(m.createdAt).getTime()}-${i}`,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
        }));

        setLanguage(conv.language || language);
        setMessages(mapped);
      } catch (err) {
        console.error('Failed to load conversation:', err);
      }
    };

    fetchConversation();
    return () => { cancelled = true; };
  }, [convId]);

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
      const response = await chatService.sendMessage(input, language, convId, nativeLanguage);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.reply,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      if (response.conversationId && response.conversationId !== convId) {
        setConvId(response.conversationId);
        router.replace(`/chat?id=${response.conversationId}`);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050505] text-zinc-100">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-500">Loading chat...</p>
        </div>
      </div>
    );
  }

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
                  onClick={startNewConversation}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/15 transition-colors"
                >
                  <Send className="w-5 h-5" />
                  <span>New Conversation</span>
                </button>
                <button
                  onClick={() => router.push("/conversations")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-zinc-400 hover:text-white"
                >
                  <History className="w-5 h-5" />
                  <span>History</span>
                </button>
                <div className="pt-4 pb-2">
                  <span className="px-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Language settings
                  </span>
                </div>
                <label htmlFor="learning-language" className="block px-4 pb-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Learning language
                </label>
                <select
                  id="learning-language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900/95 border border-white/10 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {languageOptions.map((option) => (
                    <option key={option} value={option} className="bg-zinc-900 text-zinc-100">
                      {option}
                    </option>
                  ))}
                </select>
                <label htmlFor="native-language" className="block px-4 pt-4 pb-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Your native language
                </label>
                <select
                  id="native-language"
                  value={nativeLanguage}
                  onChange={(e) => setNativeLanguage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900/95 border border-white/10 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {languageOptions.map((option) => (
                    <option key={option} value={option} className="bg-zinc-900 text-zinc-100">
                      {option}
                    </option>
                  ))}
                </select>
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
                  router.replace("/auth");
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
              <h2 className="font-semibold">{language} Language Tutor</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-400">
              <Sparkles className="w-3 h-3 text-primary" />
              OpenAI Powered
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
                  Practice {language} with a tutor
                </h3>
                <p className="text-zinc-500 leading-relaxed">
                  Ask for corrections, examples, translations, vocabulary,
                  grammar help, or short practice tasks. This space is for
                  language learning only.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 w-full text-left">
                <button
                  onClick={() =>
                    setInput(`Please correct my sentence and explain the mistake: I am student.`)
                  }
                  className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm flex items-start gap-3"
                >
                  <BookOpen className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  Correct my sentence
                </button>
                <button
                  onClick={() =>
                    setInput(`Give me 5 beginner phrases in ${language} with short ${nativeLanguage} meanings.`)
                  }
                  className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm flex items-start gap-3"
                >
                  <Languages className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  Give me beginner phrases
                </button>
                <button
                  onClick={() =>
                    setInput(`Ask me a short practice question in ${language}.`)
                  }
                  className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm flex items-start gap-3"
                >
                  <Sparkles className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  Quiz me
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
            PolyLingo is a language tutor only. It can still make mistakes.
          </p>
        </div>
      </main>
    </div>
  );
}
