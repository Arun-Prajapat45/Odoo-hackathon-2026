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
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'var(--accent)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Truck size={20} />
          </div>
          <span style={{ fontSize: 18, fontWeight: 700 }}>TransitOps</span>
        </div>

        <h1 className="auth-title">Sign in</h1>
        <p className="auth-subtitle">Enter your credentials to continue.</p>

        <div className="quick-fill">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => fill('admin@transitops.com', 'Transit@1234')}>Admin</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => fill('manager@transitops.com', 'Transit@1234')}>Manager</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => fill('charlie@transitops.com', 'Transit@1234')}>Driver</button>
        </div>

        {error && <div className="alert alert-error"><AlertCircle size={14} /> {error}</div>}

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" required placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" required placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: 4, justifyContent: 'center' }}>
            {loading ? 'Signing in...' : 'Sign in'} <ArrowRight size={14} />
          </button>
        </form>

        <div className="auth-footer">
          Don&apos;t have an account? <Link href="/register">Register</Link>
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
