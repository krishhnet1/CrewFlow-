'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push('/');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-lg">
      <div className="w-full max-w-md">
        <div className="mb-2xl text-center">
          <h1 className="text-5xl font-black tracking-tight">
            Crew<span className="text-accent">Flow</span>
          </h1>
          <p className="mt-md text-text-secondary">Sign in to your dashboard.</p>
        </div>
        <form onSubmit={onSubmit} className="card space-y-lg">
          <div>
            <label className="mb-sm block text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label className="mb-sm block text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Password
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <div className="rounded-btn border-l-[3px] border-status-danger bg-status-danger-soft px-lg py-md text-sm">
              {error}
            </div>
          )}
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
