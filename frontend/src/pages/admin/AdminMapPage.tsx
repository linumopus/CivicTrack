import { useEffect, useMemo, useState } from 'react';
import type { IComplaint } from '@shared-types/index';
import { ComplaintMap } from '../../components/map/ComplaintMap';
import { useAuth } from '../../state/auth/AuthContext';
import { ComplaintDetailModal } from '../../components/ComplaintDetailModal';
import { useAdminComplaints } from '../../state/complaints/useAdminComplaints';
import { useSearchParams } from 'react-router-dom';

function StatusDot({ status }: { status: IComplaint['status'] }) {
  const cls =
    status === 'Pending'
      ? 'bg-red-500'
      : status === 'In-Progress'
        ? 'bg-yellow-500'
        : 'bg-green-500';
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${cls}`} />;
}

function StarRating({ rating }: { rating?: number }) {
  if (!rating) return <span className="text-xs text-slate-400">No rating</span>;
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          className={`h-3.5 w-3.5 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

function ComplaintItem({
  c,
  selected,
  onSelect,
}: {
  c: IComplaint;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <li className={selected ? 'bg-slate-50' : ''}>
      <button className="w-full px-4 py-3 text-left" onClick={onSelect}>
        <div className="flex items-center gap-2">
          <StatusDot status={c.status} />
          <div className="truncate text-sm font-medium text-slate-900">{c.title}</div>
        </div>
        <div className="mt-0.5 truncate text-xs text-slate-500">{c.category}</div>
      </button>
    </li>
  );
}

function ResolvedItem({
  c,
  selected,
  onSelect,
}: {
  c: IComplaint;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <li className={selected ? 'bg-slate-50' : ''}>
      <button className="w-full px-4 py-3 text-left" onClick={onSelect}>
        <div className="flex items-center justify-between gap-2">
          <div className="truncate text-sm font-medium text-slate-900">{c.title}</div>
          <StarRating rating={c.feedback?.rating} />
        </div>
        <div className="mt-0.5 truncate text-xs text-slate-500">{c.category}</div>
      </button>
    </li>
  );
}

export function AdminMapPage() {
  const { token } = useAuth();
  const { complaints, setComplaints } = useAdminComplaints(token);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const sel = searchParams.get('selected');
    if (!sel) return;
    setSelectedId(sel);
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

  const unresolved = useMemo(
    () => complaints.filter((c) => c.status !== 'Resolved'),
    [complaints]
  );
  const resolved = useMemo(
    () => complaints.filter((c) => c.status === 'Resolved'),
    [complaints]
  );

  return (
    <div className="h-[calc(100vh-3.5rem)]">
      <div className="grid h-full grid-cols-1 md:grid-cols-[360px_1fr]">
        <aside className="flex flex-col border-r border-slate-200 bg-white overflow-hidden">
          {/* ── Open Reports ── */}
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="border-b border-slate-200 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Open Reports
                <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-red-600">
                  {unresolved.length}
                </span>
              </div>
            </div>
            <ul className="divide-y divide-slate-100 overflow-auto">
              {unresolved.length === 0 && (
                <li className="px-4 py-6 text-center text-xs text-slate-400">No open reports</li>
              )}
              {unresolved.map((c) => (
                <ComplaintItem
                  key={c._id}
                  c={c}
                  selected={selectedId === c._id}
                  onSelect={() => setSelectedId(c._id)}
                />
              ))}
            </ul>
          </div>

          {/* ── Resolved ── */}
          <div className="flex min-h-0 flex-1 flex-col border-t border-slate-200">
            <div className="border-b border-slate-200 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Resolved
                <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-green-700">
                  {resolved.length}
                </span>
              </div>
            </div>
            <ul className="divide-y divide-slate-100 overflow-auto">
              {resolved.length === 0 && (
                <li className="px-4 py-6 text-center text-xs text-slate-400">None resolved yet</li>
              )}
              {resolved.map((c) => (
                <ResolvedItem
                  key={c._id}
                  c={c}
                  selected={selectedId === c._id}
                  onSelect={() => setSelectedId(c._id)}
                />
              ))}
            </ul>
          </div>
        </aside>

        <main className="relative">
          <ComplaintMap complaints={complaints} selectedId={selectedId} onSelect={setSelectedId} />
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

