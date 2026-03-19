import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { useAuth } from '../state/auth/AuthContext';

export function RegisterPage() {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'citizen' | 'admin'>('citizen');
  const [department, setDepartment] = useState<'Road' | 'Lighting' | 'Drainage' | 'Garbage'>('Road');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const needsDepartment = useMemo(() => role === 'admin', [role]);

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-xl font-semibold text-slate-900">Create account</h1>
      <p className="mt-1 text-sm text-slate-600">Report and track civic issues.</p>

      <form
        className="mt-6 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            await register({
              name,
              email,
              password,
              role,
              department: needsDepartment ? department : undefined,
            });
            const r = user?.role ?? (JSON.parse(localStorage.getItem('civictrack.user') || 'null')?.role as
              | 'citizen'
              | 'admin'
              | undefined);
            navigate(r === 'admin' ? '/admin' : '/user');
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
          } finally {
            setBusy(false);
          }
        }}
      >
        <div>
          <label className="block text-sm font-medium text-slate-700">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            required
          />
        </div>
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
            minLength={6}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'citizen' | 'admin')}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="citizen">Citizen</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value as any)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              disabled={!needsDepartment}
              required={needsDepartment}
            >
              <option value="Road">Road</option>
              <option value="Lighting">Lighting</option>
              <option value="Drainage">Drainage</option>
              <option value="Garbage">Garbage</option>
            </select>
          </div>
        </div>

        {error && <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? 'Creating…' : 'Create account'}
        </Button>
      </form>

      <div className="mt-4 text-sm text-slate-600">
        Already have an account? <Link className="text-slate-900 underline" to="/login">Login</Link>
      </div>
    </div>
  );
}

