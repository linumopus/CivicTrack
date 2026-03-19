import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { useAuth } from '../state/auth/AuthContext';

function AuthModal({
  mode,
  onClose,
}: {
  mode: 'login' | 'signup';
  onClose: () => void;
}) {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'citizen' | 'admin'>('citizen');
  const [department, setDepartment] = useState<'Road' | 'Lighting' | 'Drainage' | 'Garbage'>('Road');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsDept = useMemo(() => mode === 'signup' && role === 'admin', [mode, role]);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="text-sm font-semibold text-slate-900">
            {mode === 'login' ? 'Login' : 'Create account'}
          </div>
          <button onClick={onClose} className="rounded p-2 text-slate-500 hover:bg-slate-100">
            ✕
          </button>
        </div>
        <form
          className="space-y-4 p-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            try {
              if (mode === 'login') {
                await login(email, password);
              } else {
                await register({
                  name,
                  email,
                  password,
                  role,
                  department: needsDept ? department : undefined,
                });
              }
              // Redirect based on role after session is set
              const stored = localStorage.getItem('civictrack.user');
              const u = stored ? (JSON.parse(stored) as { role: 'citizen' | 'admin' }) : null;
              navigate(u?.role === 'admin' ? '/admin' : '/user', { replace: true });
              onClose();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Auth failed');
            } finally {
              setBusy(false);
            }
          }}
        >
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-slate-700">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                required
              />
            </div>
          )}
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

          {mode === 'signup' && (
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
                  disabled={!needsDept}
                  required={needsDept}
                >
                  <option value="Road">Road</option>
                  <option value="Lighting">Lighting</option>
                  <option value="Drainage">Drainage</option>
                  <option value="Garbage">Garbage</option>
                </select>
              </div>
            </div>
          )}

          {error && <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create account'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [modal, setModal] = useState<'login' | 'signup' | null>(null);

  if (user) {
    // If already logged in, send to the right dashboard
    navigate(user.role === 'admin' ? '/admin' : '/user', { replace: true });
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-14">
      <div className="grid gap-10 md:grid-cols-2 md:items-center">
        <div>
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
            Track • Report • Resolve
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">
            CivicTrack helps communities report issues and track resolution in real time.
          </h1>
          <p className="mt-4 text-slate-600">
            Citizens can report problems with a location and photo, upvote issues that matter, and follow status updates.
            Officials can triage, update, and resolve complaints with accountability.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => setModal('signup')}>Get started</Button>
            <Button variant="secondary" onClick={() => setModal('login')}>
              Login
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6">
          <div className="grid gap-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Map-centric tracking</div>
              <div className="mt-1 text-sm text-slate-600">
                See complaints on an OpenStreetMap-powered map with clear status colors.
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Community upvotes</div>
              <div className="mt-1 text-sm text-slate-600">
                Rally support for important issues and prioritize what needs action.
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Admin workflow</div>
              <div className="mt-1 text-sm text-slate-600">
                Update status from Pending → In-Progress → Resolved and moderate reports.
              </div>
            </div>
          </div>
        </div>
      </div>

      {modal && <AuthModal mode={modal} onClose={() => setModal(null)} />}
    </div>
  );
}

