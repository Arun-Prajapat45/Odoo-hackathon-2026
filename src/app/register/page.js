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

        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Fill in your details to get started.</p>

        {error && <div className="alert alert-error"><AlertCircle size={14} /> {error}</div>}

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" required placeholder="Full name" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" required placeholder="you@company.com" value={form.email} onChange={e => set('email', e.target.value)} />
            <div className="form-hint">Disposable emails will be rejected.</div>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" required placeholder="Create a strong password" value={pw} onChange={e => set('password', e.target.value)} />
            {pw.length > 0 && (
              <div className="pw-checks">
                {checks.map((c, i) => (
                  <span key={i} className={`pw-check ${c.met ? 'met' : ''}`}>
                    <Check size={11} /> {c.label}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              className="form-input"
              type="password"
              required
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={e => set('confirmPassword', e.target.value)}
            />
            {form.confirmPassword.length > 0 && (
              <div className="form-hint" style={{ color: passwordsMatch ? 'var(--green)' : 'var(--red)' }}>
                {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" value={form.roleId} onChange={e => set('roleId', parseInt(e.target.value))}>
              <option value={3}>Driver</option>
              <option value={2}>Fleet Manager</option>
              <option value={4}>Safety Officer</option>
              <option value={5}>Finance</option>
            </select>
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading || (form.confirmPassword.length > 0 && !passwordsMatch)} style={{ width: '100%', marginTop: 4, justifyContent: 'center' }}>
            {loading ? 'Creating account...' : 'Create account'} <ArrowRight size={14} />
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link href="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
