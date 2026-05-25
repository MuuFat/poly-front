"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function ResetPage({ searchParams }: { readonly searchParams?: { readonly token?: string } }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams?.token) setToken(searchParams.token);
    else setToken(globalThis.location.search ? new URLSearchParams(globalThis.location.search).get('token') : null);
  }, [searchParams]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setStatus(null);
    try {
      const res = await api.post('/api/auth/reset', { token, password });
      setStatus('Password reset successful — signing you in');
      // set auth in client and redirect
      const { user, token: accessToken, refreshToken } = res.data;
      // use local storage setter
      (await import('@/store/authStore')).useAuthStore.getState().setAuth(user, accessToken, refreshToken);
      router.replace('/chat');
    } catch (err: any) {
      setStatus(err.response?.data?.message || 'Failed to reset password');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold">Reset password</h1>
        <p className="text-sm text-muted-foreground">Choose a new password for your account.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            required
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border rounded-xl"
          />
          <button className="w-full py-2 bg-primary text-white rounded-xl">Reset password</button>
        </form>

        {status && <div className="mt-4 p-3 bg-background/60 rounded">{status}</div>}
      </div>
    </main>
  );
}
