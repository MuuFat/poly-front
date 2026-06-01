"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Languages,
  Zap,
  Globe,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function Home() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [hasHydrated, setHasHydrated] = useState(() => useAuthStore.persist?.hasHydrated?.() ?? false);

  useEffect(() => {
    const unsubscribe = useAuthStore.persist?.onFinishHydration?.(() => {
      setHasHydrated(true);
    });

    if (useAuthStore.persist?.hasHydrated?.()) {
      setHasHydrated(true);
    }

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      router.push("/chat");
    }
  }, [hasHydrated, isAuthenticated, router]);

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] text-zinc-100">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-500">Loading app...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 overflow-x-hidden font-sans">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-linear-to-b from-primary/20 via-transparent to-transparent opacity-50 blur-3xl -z-10" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10" />
        <div className="absolute top-1/2 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10" />

        <div className="max-w-6xl mx-auto text-center space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-primary backdrop-blur-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Language Tutor</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black tracking-tighter leading-[1.1]"
          >
            Learn any language <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary via-purple-500 to-blue-500">
              with PolyLingo AI
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto text-xl text-zinc-400 leading-relaxed"
          >
            Practice speaking, writing and understanding any
            language with your personal AI tutor. Natural conversations,
            instant feedback and personalized progress.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <button
              onClick={() => router.push("/auth?view=register")}
              className="group relative px-8 py-4 bg-primary text-white rounded-2xl font-bold text-lg shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 overflow-hidden"
            >
              <span className="relative z-10">Start Learning Free</span>
              <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </button>
            <button
              onClick={() => router.push("/auth")}
              className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all"
            >
              Log In
            </button>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Languages,
              title: "Language Practice",
              description:
                "Learn English or switch to Polish, Spanish, French, Japanese and more with native level tutoring.",
            },
            {
              icon: Zap,
              title: "Instant Corrections",
              description:
                "Get real time corrections and suggestions to improve your grammar, vocabulary and sentence structure.",
            },
            {
              icon: Globe,
              title: "Tutor Guidance",
              description:
                "Understand nuances, examples and learning hints as you practice through natural conversation.",
            },
          ].map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="p-8 rounded-3xl bg-zinc-900/30 border border-white/5 hover:border-white/10 transition-colors backdrop-blur-sm group"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <feature.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
              <p className="text-zinc-500 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 border-t border-white/5 bg-zinc-900/20">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {[
            { label: "Mode", value: "Tutor first" },
            { label: "Feedback", value: "Real time" },
            { label: "Scope", value: "Any language" },
            { label: "Focus", value: "Learning only" },
          ].map((stat) => (
            <div key={stat.label} className="space-y-2">
              <div className="text-4xl font-black text-white tracking-tighter">
                {stat.value}
              </div>
              <div className="text-zinc-500 text-sm font-bold uppercase tracking-[0.2em]">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">PolyLingo</span>
        </div>
        <p className="text-zinc-600 text-sm">
          &copy; 2026 PolyLingo AI. Built as a language tutor.
        </p>
        <div className="mt-3 space-x-4">
          <a href="/terms" className="text-zinc-400 hover:text-white underline">Terms</a>
          <a href="/privacy" className="text-zinc-400 hover:text-white underline">Privacy</a>
        </div>
      </footer>
    </div>
  );
}
