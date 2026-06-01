"use client";

import React from "react";
import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-zinc-100 p-12 font-sans">
      <div className="max-w-3xl mx-auto bg-zinc-900/40 border border-white/5 rounded-3xl p-8">
        <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
        <p className="text-zinc-400 mb-4">
          These Terms of Service govern your use of PolyLingo. This is a
          placeholder document. Replace with your full legal terms before
          launching the site publicly.
        </p>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Acceptance</h2>
          <p className="text-zinc-400">By using our service you agree to these terms.</p>
          <h2 className="text-xl font-semibold">2. Use</h2>
          <p className="text-zinc-400">You may use the service for lawful purposes only.</p>
          <h2 className="text-xl font-semibold">3. Liability</h2>
          <p className="text-zinc-400">We are not liable for indirect damages. See full terms.</p>
        </section>

        <div className="pt-6">
          <Link href="/privacy" className="text-primary hover:underline">Read our Privacy Policy</Link>
        </div>
      </div>
    </main>
  );
}
