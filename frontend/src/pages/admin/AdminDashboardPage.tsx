import { useMemo, useState } from 'react';
import type { ComplaintStatus, IComplaint } from '@shared-types/index';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { useAuth } from '../../state/auth/AuthContext';
import { updateComplaintStatus } from '../../state/complaints/complaintsApi';
import { useAdminComplaints } from '../../state/complaints/useAdminComplaints';
import { LocationMapModal } from '../../components/map/LocationMapModal';
import { ComplaintDetailModal } from '../../components/ComplaintDetailModal';

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function nextStatus(current: ComplaintStatus): ComplaintStatus {
  if (current === 'Pending') return 'In-Progress';
  if (current === 'In-Progress') return 'Resolved';
  return 'Resolved';
}

function avgResolutionMs(complaints: IComplaint[]) {
  const resolved = complaints.filter((c) => c.status === 'Resolved' && c.updatedAt);
  if (!resolved.length) return 0;
  const total = resolved.reduce((sum, c) => {
    const start = new Date(c.createdAt).getTime();
    const end = new Date(c.updatedAt!).getTime();
    return sum + Math.max(0, end - start);
  }, 0);
  return total / resolved.length;
}

function humanDuration(ms: number) {
  if (!ms || ms < 0) return '—';
  const hours = ms / (1000 * 60 * 60);
  if (hours < 24) return `${hours.toFixed(1)}h`;
  const days = hours / 24;
  return `${days.toFixed(1)}d`;
}

export function AdminDashboardPage() {
  const { token } = useAuth();
  const { complaints, setComplaints, isLoading, error } = useAdminComplaints(token);
  const [q, setQ] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [locId, setLocId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return complaints;
    return complaints.filter((c) =>
      [c.title, c.description, c.category, c.status].some((v) => v.toLowerCase().includes(query))
    );
  }, [complaints, q]);

  const locComplaint = useMemo(
    () => (locId ? complaints.find((c) => c._id === locId) : null),
    [complaints, locId]
  );

  const selectedComplaint = useMemo(
    () => (selectedId ? complaints.find((c) => c._id === selectedId) : null),
    [complaints, selectedId]
  );

  const total = complaints.length;
  const resolved = complaints.filter((c) => c.status === 'Resolved').length;
  const avgMs = avgResolutionMs(complaints);

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">Review and update complaint statuses.</p>
        </div>
        <Link to="/admin/map">
          <Button variant="secondary">Open Admin Map</Button>
        </Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Total Issues" value={String(total)} />
        <StatCard label="Issues Resolved" value={String(resolved)} />
        <StatCard label="Avg. Resolution Time" value={humanDuration(avgMs)} />
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4">
          <div className="text-sm font-semibold text-slate-900">All complaints</div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="w-full max-w-xs rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        {isLoading && <div className="p-4 text-sm text-slate-600">Loading…</div>}
        {error && <div className="p-4 text-sm text-rose-600">{error}</div>}

        <div className="overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Upvotes</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr 
                  key={c._id} 
                  className="hover:bg-slate-50 cursor-pointer"
                  onClick={() => setSelectedId(c._id)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{c.title}</div>
                    <div className="truncate text-xs text-slate-500">{c.description}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{c.category}</td>
                  <td className="px-4 py-3 text-slate-700">{c.status}</td>
                  <td className="px-4 py-3 text-slate-700">{c.upvotes.length}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocId(c._id);
                        }}
                      >
                        Location
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={!token || busyId === c._id || c.status === 'Resolved'}
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!token) return;
                          setBusyId(c._id);
                          const next = nextStatus(c.status);
                          try {
                            const res = await updateComplaintStatus(c._id, next, token);
                            setComplaints((prev) =>
                              prev.map((x) =>
                                x._id === res._id
                                  ? { ...x, status: res.status, updatedAt: new Date().toISOString() }
                                  : x
                              )
                            );
                          } finally {
                            setBusyId(null);
                          }
                        }}
                      >
                        Set → {nextStatus(c.status)}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-600">
                    No matches.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {locComplaint && <LocationMapModal complaint={locComplaint} onClose={() => setLocId(null)} />}

      {selectedComplaint && (
        <ComplaintDetailModal
          complaint={selectedComplaint}
          onClose={() => setSelectedId(null)}
          onUpvotesChange={(id, upvotes) => {
            setComplaints((prev) => prev.map((c) => (c._id === id ? { ...c, upvotes } : c)));
          }}
        />
      )}
    </div>
  );
}

