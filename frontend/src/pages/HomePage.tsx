import { useMemo, useState } from 'react';
import type { IComplaint } from '@shared-types/index';
import { ComplaintMap } from '../components/map/ComplaintMap';
import { ComplaintDetailModal } from '../components/ComplaintDetailModal';
import { useComplaints } from '../state/complaints/useComplaints';

function StatusDot({ status }: { status: IComplaint['status'] }) {
  const cls =
    status === 'Pending'
      ? 'bg-red-500'
      : status === 'In-Progress'
        ? 'bg-yellow-500'
        : 'bg-green-500';
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${cls}`} />;
}

export function HomePage() {
  const { complaints, setComplaints, isLoading, error } = useComplaints();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => (selectedId ? complaints.find((c) => c._id === selectedId) : null),
    [complaints, selectedId]
  );

  return (
    <div className="h-[calc(100vh-3.5rem)]">
      <div className="grid h-full grid-cols-1 md:grid-cols-[360px_1fr]">
        <aside className="border-r border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-4">
            <div className="text-sm font-semibold text-slate-900">Recent Issues</div>
            <div className="text-xs text-slate-500">Click an item to zoom to it</div>
          </div>

          <div className="h-[calc(100%-64px)] overflow-auto">
            {isLoading && <div className="p-4 text-sm text-slate-600">Loading complaints…</div>}
            {error && <div className="p-4 text-sm text-rose-600">{error}</div>}
            {!isLoading && !error && complaints.length === 0 && (
              <div className="p-4 text-sm text-slate-600">No issues yet. Be the first to report one.</div>
            )}
            <ul className="divide-y divide-slate-100">
              {complaints.map((c) => (
                <li key={c._id}>
                  <button
                    className={`w-full px-4 py-3 text-left hover:bg-slate-50 ${
                      selectedId === c._id ? 'bg-slate-50' : ''
                    }`}
                    onClick={() => setSelectedId(c._id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-slate-900">{c.title}</div>
                        <div className="truncate text-xs text-slate-500">{c.category}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusDot status={c.status} />
                        <span className="text-xs text-slate-600">{c.upvotes.length}</span>
                      </div>
                    </div>
                  </button>
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
        <ComplaintDetailModal
          complaint={selected}
          onClose={() => setSelectedId(null)}
          onUpvotesChange={(id, upvotes) => {
            setComplaints((prev) => prev.map((c) => (c._id === id ? { ...c, upvotes } : c)));
          }}
        />
      )}
    </div>
  );
}

