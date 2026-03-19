import { useMemo, useState } from 'react';
import type { IComplaint } from '@shared-types/index';
import { useAuth } from '../../state/auth/AuthContext';
import { useComplaints } from '../../state/complaints/useComplaints';
import { upvoteComplaint } from '../../state/complaints/complaintsApi';
import { ComplaintDetailModal } from '../../components/ComplaintDetailModal';
// (navigation no longer used; location opens modal)
import { LocationMapModal } from '../../components/map/LocationMapModal';

function StatusPill({ status }: { status: IComplaint['status'] }) {
  const cls =
    status === 'Pending'
      ? 'bg-red-50 text-red-700 border-red-200'
      : status === 'In-Progress'
        ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
        : 'bg-green-50 text-green-700 border-green-200';
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${cls}`}>
      {status}
    </span>
  );
}

function UpvoteTicks({ count }: { count: number }) {
  const ticks = Math.min(5, Math.max(0, count));
  return (
    <div className="flex items-end gap-0.5" aria-label={`${count} upvotes`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`w-1 rounded-sm ${i < ticks ? 'bg-slate-900' : 'bg-slate-200'}`}
          style={{ height: 6 + i * 3 }}
        />
      ))}
      <span className="ml-2 text-xs text-slate-600">{count}</span>
    </div>
  );
}

export function CommunityPage() {
  const { user, token } = useAuth();
  const { complaints, setComplaints, isLoading, error } = useComplaints();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [locId, setLocId] = useState<string | null>(null);
  const posts = useMemo(() => complaints, [complaints]);
  const selected = useMemo(
    () => (selectedId ? complaints.find((c) => c._id === selectedId) : null),
    [complaints, selectedId]
  );
  const locComplaint = useMemo(
    () => (locId ? complaints.find((c) => c._id === locId) : null),
    [complaints, locId]
  );

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Community</h1>
        <p className="mt-1 text-sm text-slate-600">
          View complaints posted by the community and upvote the ones that matter.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {isLoading && <div className="text-sm text-slate-600">Loading…</div>}
        {error && <div className="text-sm text-rose-600">{error}</div>}
        {!isLoading && !error && posts.length === 0 && (
          <div className="text-sm text-slate-600">No posts yet.</div>
        )}

        {posts.map((c) => {
          const alreadyUpvoted = !!user && c.upvotes.includes(user._id);
          return (
            <div key={c._id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <button className="min-w-0 text-left" onClick={() => setSelectedId(c._id)}>
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-semibold text-slate-900">{c.title}</div>
                    <StatusPill status={c.status} />
                    {c.refiledFrom && (
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">
                        Refile
                      </span>
                    )}
                  </div>
                  <div className="mt-1 line-clamp-2 text-sm text-slate-700">{c.description}</div>
                  <div className="mt-2 text-xs text-slate-500">Category: {c.category}</div>
                  {c.feedback && (
                    <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700">
                      <span className="font-semibold">Resolution rating:</span> {c.feedback.rating}/5
                      {c.feedback.note ? <span className="text-slate-600"> — {c.feedback.note}</span> : null}
                    </div>
                  )}
                </button>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <UpvoteTicks count={c.upvotes.length} />
                  <button
                    className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-slate-50"
                    onClick={() => setLocId(c._id)}
                  >
                    Location
                  </button>
                  <button
                    className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                      alreadyUpvoted
                        ? 'border-slate-200 bg-slate-50 text-slate-500'
                        : 'border-slate-300 bg-white text-slate-900 hover:bg-slate-50'
                    }`}
                    disabled={!token || alreadyUpvoted}
                    onClick={async () => {
                      if (!token) return;
                      const res = await upvoteComplaint(c._id, token);
                      setComplaints((prev) => prev.map((x) => (x._id === res._id ? { ...x, upvotes: res.upvotes } : x)));
                    }}
                  >
                    {alreadyUpvoted ? 'Upvoted' : 'Upvote'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
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

      {locComplaint && <LocationMapModal complaint={locComplaint} onClose={() => setLocId(null)} />}
    </div>
  );
}

