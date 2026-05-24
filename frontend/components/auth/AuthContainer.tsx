'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

interface AuthContainerProps {
  initialView?: 'login' | 'register';
}

export const AuthContainer: React.FC<AuthContainerProps> = ({ initialView = 'login' }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<'login' | 'register'>(initialView);

  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam === 'register' || viewParam === 'login') {
      setView(viewParam as 'login' | 'register');
    }
  }, [searchParams]);

  const toggleView = (newView: 'login' | 'register') => {
    setView(newView);
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', newView);
    router.replace(`/auth?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background selection:bg-primary/20">
      {/* Background blobs for premium feel */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-8">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-primary/30">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">PolyLingo</h1>
        </div>

        <div className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl p-8 space-y-6">
          {view === 'login' ? <LoginForm /> : <RegisterForm />}
        </div>

        <div className="text-center">
          {view === 'login' ? (
            <p className="text-muted-foreground">
              Don&apos;t have an account?{' '}
              <button
                onClick={() => toggleView('register')}
                className="font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <button
                onClick={() => toggleView('login')}
                className="font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Log in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
