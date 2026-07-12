'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Truck, ArrowRight, AlertCircle, Check } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', roleId: 3 });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const pw = form.password;
  const checks = [
    { label: 'At least 8 characters', met: pw.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(pw) },
    { label: 'Lowercase letter', met: /[a-z]/.test(pw) },
    { label: 'Number', met: /\d/.test(pw) },
    { label: 'Special character', met: /[!@#$%^&*()_+\-=[\]{};':"|,.<>/?\\]/.test(pw) },
  ];

  const passwordsMatch = form.password === form.confirmPassword;

  const submit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          roleId: form.roleId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setError(data.error || 'Registration failed.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
            <Truck size={22} />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">TransitOps</span>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Create account</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Fill in your details to get started.</p>

        {error && <div className="flex items-center gap-2 p-3 mb-6 text-sm text-red-600 bg-red-50 dark:bg-red-900/30 rounded-lg"><AlertCircle size={16} /> {error}</div>}

        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
            <input className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all" required placeholder="Full name" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <input className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all" type="email" required placeholder="you@company.com" value={form.email} onChange={e => set('email', e.target.value)} />
            <div className="text-xs text-slate-500 mt-1">Disposable emails will be rejected.</div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
            <input className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all" type="password" required placeholder="Create a strong password" value={pw} onChange={e => set('password', e.target.value)} />
            {pw.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {checks.map((c, i) => (
                  <span key={i} className={`flex items-center gap-1.5 text-xs ${c.met ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                    <Check size={11} className={c.met ? 'opacity-100' : 'opacity-50'} /> {c.label}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirm Password</label>
            <input
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
              type="password"
              required
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={e => set('confirmPassword', e.target.value)}
            />
            {form.confirmPassword.length > 0 && (
              <div className={`text-xs mt-1 ${passwordsMatch ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
            <select className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all" value={form.roleId} onChange={e => set('roleId', parseInt(e.target.value))}>
              <option value={3}>Driver</option>
              <option value={2}>Fleet Manager</option>
              <option value={4}>Safety Officer</option>
              <option value={5}>Finance</option>
            </select>
          </div>
          <button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors mt-2 disabled:opacity-70 disabled:cursor-not-allowed" type="submit" disabled={loading || (form.confirmPassword.length > 0 && !passwordsMatch)}>
            {loading ? 'Creating account...' : 'Create account'} <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account? <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium ml-1">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
