import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { IComplaint } from '@shared-types/index';
import { useAuth } from '../../state/auth/AuthContext';
import { fetchMyComplaints } from '../../state/complaints/complaintsApi';
import { ComplaintMap } from '../../components/map/ComplaintMap';

function StatusDot({ status }: { status: IComplaint['status'] }) {
  const cls =
    status === 'Pending'
      ? 'bg-red-500'
      : status === 'In-Progress'
        ? 'bg-yellow-500'
        : 'bg-green-500';
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${cls}`} />;
}

export function UserDashboardPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [complaints, setComplaints] = useState<IComplaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    fetchMyComplaints(token)
      .then(setComplaints)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setIsLoading(false));
  }, [token]);

  useEffect(() => {
    const sel = searchParams.get('selected');
    if (!sel) return;
    setSelectedId(sel);
    // keep URL clean after applying once
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('selected');
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = useMemo(
    () => (selectedId ? complaints.find((c) => c._id === selectedId) : null),
    [complaints, selectedId]
  );

  return (
    <div className="h-[calc(100vh-3.5rem)]">
      <div className="grid h-full grid-cols-1 md:grid-cols-[360px_1fr]">
        <aside className="border-r border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-4">
            <div className="text-sm font-semibold text-slate-900">Your Issues</div>
            <div className="text-xs text-slate-500">Only issues you reported appear here.</div>
          </div>

          <div className="h-[calc(100%-64px)] overflow-auto">
            {isLoading && <div className="p-4 text-sm text-slate-600">Loading…</div>}
            {error && <div className="p-4 text-sm text-rose-600">{error}</div>}
            {!isLoading && !error && complaints.length === 0 && (
              <div className="p-4 text-sm text-slate-600">No issues yet. Report one to get started.</div>
            )}
            <ul className="divide-y divide-slate-100">
              {complaints.map((c) => (
                <li key={c._id}>
                  <div
                    className={`flex items-start justify-between gap-3 px-4 py-3 hover:bg-slate-50 ${
                      selectedId === c._id ? 'bg-slate-50' : ''
                    }`}
                  >
                    <button className="min-w-0 text-left" onClick={() => setSelectedId(c._id)}>
                      <div className="truncate text-sm font-medium text-slate-900">{c.title}</div>
                      <div className="truncate text-xs text-slate-500">{c.category}</div>
                    </button>
                    <div className="flex items-center gap-2">
                      <StatusDot status={c.status} />
                      <button
                        className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                        onClick={() => navigate(`/user/issues/${c._id}`)}
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="relative">
          <ComplaintMap complaints={complaints} selectedId={selectedId} onSelect={(id) => setSelectedId(id)} />
        </main>
      </div>

      {selected && (
        <button
          className="fixed bottom-4 right-4 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:brightness-95"
          onClick={() => navigate(`/user/issues/${selected._id}`)}
        >
          Open details
        </button>
      )}
    </div>
  );
}
