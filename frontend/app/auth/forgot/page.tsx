"use client";

import { useState } from 'react';
import api from '@/lib/api';

export default function ForgotPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [preview, setPreview] = useState<any>(null);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setStatus(null);
    setPreview(null);
    try {
      const res = await api.post('/api/auth/forgot', { email });
      setStatus(res.data.message || 'If an account exists, a reset link will be sent');
      if (res.data.previewToken) setPreview(res.data);
    } catch (err: any) {
      setStatus(err.response?.data?.message || 'Failed to request reset');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold">Forgot your password?</h1>
        <p className="text-sm text-muted-foreground">Enter your email and we'll send a reset link.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border rounded-xl"
          />
          <button className="w-full py-2 bg-primary text-white rounded-xl">Send reset link</button>
        </form>

        {status && <div className="mt-4 p-3 bg-background/60 rounded">{status}</div>}
        {preview && (
          <div className="mt-2 p-3 bg-muted/10 rounded">
            <div className="text-sm font-medium">Dev preview token:</div>
            <pre className="text-xs break-words">{preview.previewToken}</pre>
            <div className="mt-2 text-sm">Reset URL: <a className="text-primary" href={preview.resetUrl}>{preview.resetUrl}</a></div>
          </div>
        )}
      </div>
    </main>
  );
}
