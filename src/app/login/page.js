'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Truck, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(redirect);
        router.refresh();
      } else {
        setError(data.error || 'Login failed.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fill = (e, p) => { setEmail(e); setPassword(p); setError(null); };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
            <Truck size={22} />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">TransitOps</span>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Sign in</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Enter your credentials to continue.</p>

        <div className="flex gap-2 mb-6 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-lg">
          <button type="button" className="flex-1 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded shadow-sm hover:text-blue-600 transition-colors" onClick={() => fill('admin@transitops.com', 'Transit@1234')}>Admin</button>
          <button type="button" className="flex-1 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" onClick={() => fill('manager@transitops.com', 'Transit@1234')}>Manager</button>
          <button type="button" className="flex-1 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" onClick={() => fill('charlie@transitops.com', 'Transit@1234')}>Driver</button>
        </div>

        {error && <div className="flex items-center gap-2 p-3 mb-6 text-sm text-red-600 bg-red-50 dark:bg-red-900/30 rounded-lg"><AlertCircle size={16} /> {error}</div>}

        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <input className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all" type="email" required placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
            <input className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all" type="password" required placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors mt-2 disabled:opacity-70 disabled:cursor-not-allowed" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'} <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Don&apos;t have an account? <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium ml-1">Register</Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="auth-page"><div className="loading-center"><div className="spinner" /></div></div>}>
      <LoginForm />
    </Suspense>
  );
}
