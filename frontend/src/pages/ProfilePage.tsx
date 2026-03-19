import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { useAuth } from '../state/auth/AuthContext';
import { apiFetch } from '../lib/api';

export function ProfilePage() {
  const { user, token, refreshMe, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name ?? '');
  const [role, setRole] = useState<'citizen' | 'admin'>(user?.role ?? 'citizen');
  const [department, setDepartment] = useState<'Road' | 'Lighting' | 'Drainage' | 'Garbage'>(
    (user?.department as any) ?? 'Road'
  );

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const needsDept = useMemo(() => role === 'admin', [role]);

  if (!user) return <div className="p-6 text-sm text-slate-600">Loading…</div>;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Profile</h1>
          <p className="mt-1 text-sm text-slate-600">Manage your account details and security.</p>
        </div>
        <Button variant="secondary" onClick={() => navigate(user.role === 'admin' ? '/admin' : '/user')}>
          Back
        </Button>
      </div>

      {error && <div className="mt-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      {ok && <div className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-700">{ok}</div>}

      <div className="mt-6 grid gap-6">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-sm font-semibold text-slate-900">Your details</div>
          <div className="mt-4 grid gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input
                value={user.email}
                disabled
                className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
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

            <Button
              disabled={!token || busy}
              onClick={async () => {
                if (!token) return;
                setBusy(true);
                setError(null);
                setOk(null);
                try {
                  await apiFetch<{ user: any }>('/api/auth/me', {
                    method: 'PATCH',
                    token,
                    body: {
                      name: name.trim() || undefined,
                      role,
                      department: role === 'admin' ? department : undefined,
                    },
                  });
                  await refreshMe();
                  setOk('Profile updated');
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Update failed');
                } finally {
                  setBusy(false);
                }
              }}
            >
              Save changes
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-sm font-semibold text-slate-900">Change password</div>
          <div className="mt-4 grid gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">Current password</label>
              <input
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                type="password"
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">New password</label>
              <input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                type="password"
                minLength={6}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <Button
              variant="secondary"
              disabled={!token || busy || !currentPassword || newPassword.length < 6}
              onClick={async () => {
                if (!token) return;
                setBusy(true);
                setError(null);
                setOk(null);
                try {
                  await apiFetch<{ ok: true }>('/api/auth/change-password', {
                    method: 'POST',
                    token,
                    body: { currentPassword, newPassword },
                  });
                  setCurrentPassword('');
                  setNewPassword('');
                  setOk('Password updated');
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Password change failed');
                } finally {
                  setBusy(false);
                }
              }}
            >
              Change password
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-rose-200 bg-white p-4">
          <div className="text-sm font-semibold text-rose-700">Danger zone</div>
          <div className="mt-2 text-sm text-slate-600">
            Deleting your account removes your profile and your reported complaints.
          </div>
          <div className="mt-4">
            <Button
              variant="danger"
              disabled={!token || busy}
              onClick={async () => {
                if (!token) return;
                const ok = window.confirm('Delete your account permanently?');
                if (!ok) return;
                setBusy(true);
                setError(null);
                try {
                  await apiFetch<null>('/api/auth/me', { method: 'DELETE', token });
                  logout();
                  navigate('/', { replace: true });
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Delete failed');
                } finally {
                  setBusy(false);
                }
              }}
            >
              Delete account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

