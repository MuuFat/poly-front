"use client";

import React from "react";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-zinc-100 p-12 font-sans">
      <div className="max-w-3xl mx-auto bg-zinc-900/40 border border-white/5 rounded-3xl p-8">
        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-zinc-400 mb-4">
          This Privacy Policy explains how PolyLingo collects and uses personal
          data. This is a placeholder — replace with your full policy before
          publishing.
        </p>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Information We Collect</h2>
          <p className="text-zinc-400">We collect account and usage information.</p>
          <h2 className="text-xl font-semibold">2. How We Use Data</h2>
          <p className="text-zinc-400">We use data to provide and improve our services.</p>
          <h2 className="text-xl font-semibold">3. Third Parties</h2>
          <p className="text-zinc-400">We may share data with service providers under contract.</p>
        </section>

        <div className="pt-6">
          <Link href="/terms" className="text-primary hover:underline">Read our Terms of Service</Link>
        </div>
      </div>
    </main>
  );
}
