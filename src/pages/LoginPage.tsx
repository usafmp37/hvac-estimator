import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Wind } from 'lucide-react';

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (mode === 'signup' && password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const err = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password);

    if (err) {
      setError(err);
    } else if (mode === 'signup') {
      setSuccess('Account created! You can now sign in.');
      setMode('signin');
      setPassword('');
      setConfirm('');
    }
    setLoading(false);
  };

  const switchMode = () => {
    setMode((m) => m === 'signin' ? 'signup' : 'signin');
    setError(null);
    setSuccess(null);
    setPassword('');
    setConfirm('');
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f1f5f9',
    }}>
      <div style={{ width: '100%', maxWidth: 380, padding: '0 16px' }}>
        {/* Logo / header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: '#3b82f6', borderRadius: 14, padding: 12, marginBottom: 12,
          }}>
            <Wind size={28} color="white" />
          </div>
          <div style={{ fontWeight: 700, fontSize: 20, color: '#1e293b' }}>HVAC Estimator</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>E.D. Miller Service Company</div>
        </div>

        {/* Card */}
        <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', padding: 28 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 700, color: '#1e293b' }}>
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </h2>

          {success && (
            <div style={{
              marginBottom: 16, padding: '9px 12px', background: '#f0fdf4',
              border: '1px solid #bbf7d0', borderRadius: 7, fontSize: 13, color: '#15803d',
            }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="you@example.com"
                style={{
                  width: '100%', padding: '9px 12px', border: '1px solid #d1d5db',
                  borderRadius: 7, fontSize: 14, boxSizing: 'border-box', outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: mode === 'signup' ? 14 : 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '9px 12px', border: '1px solid #d1d5db',
                  borderRadius: 7, fontSize: 14, boxSizing: 'border-box', outline: 'none',
                }}
              />
            </div>

            {mode === 'signup' && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '9px 12px', border: '1px solid #d1d5db',
                    borderRadius: 7, fontSize: 14, boxSizing: 'border-box', outline: 'none',
                  }}
                />
              </div>
            )}

            {error && (
              <div style={{
                marginBottom: 16, padding: '9px 12px', background: '#fef2f2',
                border: '1px solid #fecaca', borderRadius: 7, fontSize: 13, color: '#b91c1c',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '10px', background: loading ? '#93c5fd' : '#3b82f6',
                color: 'white', border: 'none', borderRadius: 7, fontWeight: 600,
                fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading
                ? (mode === 'signin' ? 'Signing in…' : 'Creating account…')
                : (mode === 'signin' ? 'Sign in' : 'Create account')}
            </button>
          </form>

          <div style={{ marginTop: 18, textAlign: 'center', fontSize: 13, color: '#64748b' }}>
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={switchMode}
              style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 600, cursor: 'pointer', fontSize: 13, padding: 0 }}
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
