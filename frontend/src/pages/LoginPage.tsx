import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { useAuth } from '../state/auth/AuthContext';

export function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-xl font-semibold text-slate-900">Login</h1>
      <p className="mt-1 text-sm text-slate-600">Access CivicTrack as a citizen or admin.</p>

      <form
        className="mt-6 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            await login(email, password);
            const role = user?.role ?? (JSON.parse(localStorage.getItem('civictrack.user') || 'null')?.role as
              | 'citizen'
              | 'admin'
              | undefined);
            navigate(role === 'admin' ? '/admin' : '/user');
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
          } finally {
            setBusy(false);
          }
        }}
      >
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            required
          />
        </div>
        {error && <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? 'Logging in…' : 'Login'}
        </Button>
      </form>

      <div className="mt-4 text-sm text-slate-600">
        New here? <Link className="text-slate-900 underline" to="/register">Create an account</Link>
      </div>
    </div>
  );
}

