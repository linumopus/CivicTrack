import type { IComplaint } from '@shared-types/index';
import { Button } from './Button';
import { useAuth } from '../state/auth/AuthContext';
import { upvoteComplaint } from '../state/complaints/complaintsApi';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function StatusPill({ status }: { status: IComplaint['status'] }) {
  const cls =
    status === 'Pending'
      ? 'bg-red-50 text-red-700 border-red-200'
      : status === 'In-Progress'
        ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
        : 'bg-green-50 text-green-700 border-green-200';
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${cls}`}>{status}</span>;
}

export function ComplaintDetailModal({
  complaint,
  onClose,
  onUpvotesChange,
}: {
  complaint: IComplaint;
  onClose: () => void;
  onUpvotesChange?: (id: string, upvotes: string[]) => void;
}) {
  const { user, token } = useAuth();
  const isAdmin = user?.role === 'admin';
  const alreadyUpvoted = !!user && complaint.upvotes.includes(user._id);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-base font-semibold text-slate-900">{complaint.title}</h3>
              <StatusPill status={complaint.status} />
            </div>
            <div className="text-xs text-slate-500">Reported on {formatDate(complaint.createdAt)}</div>
          </div>
          <button onClick={onClose} className="rounded p-2 text-slate-500 hover:bg-slate-100">
            ✕
          </button>
        </div>

        <div className="grid gap-4 p-4 md:grid-cols-2">
          <div className="space-y-3">
            {complaint.imageUrl ? (
              <img
                src={complaint.imageUrl}
                alt="Complaint"
                className="h-56 w-full rounded-md border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-56 w-full items-center justify-center rounded-md border border-dashed border-slate-300 text-sm text-slate-500">
                No photo uploaded
              </div>
            )}

            <div className="rounded-md border border-slate-200 p-3">
              <div className="text-xs font-semibold text-slate-700">Category</div>
              <div className="text-sm text-slate-900">{complaint.category}</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-md border border-slate-200 p-3">
              <div className="text-xs font-semibold text-slate-700">Description</div>
              <div className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{complaint.description}</div>
            </div>

            <div className="rounded-md border border-slate-200 p-3">
              <div className="text-xs font-semibold text-slate-700">Status timeline</div>
              <div className="mt-2 space-y-2 text-sm text-slate-700">
                <div className="flex items-center justify-between">
                  <span>Reported</span>
                  <span className="text-xs text-slate-500">{formatDate(complaint.createdAt)}</span>
                </div>
                {complaint.updatedAt && complaint.status !== 'Pending' && (
                  <div className="flex items-center justify-between">
                    <span>Last update</span>
                    <span className="text-xs text-slate-500">{formatDate(complaint.updatedAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {!isAdmin && (
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-slate-700">
                  <span className="font-semibold">{complaint.upvotes.length}</span> upvotes
                </div>
                <Button
                  variant={alreadyUpvoted ? 'secondary' : 'primary'}
                  disabled={!token || alreadyUpvoted}
                  onClick={async () => {
                    if (!token) return;
                    const res = await upvoteComplaint(complaint._id, token);
                    onUpvotesChange?.(res._id, res.upvotes);
                  }}
                >
                  {alreadyUpvoted ? 'Upvoted' : 'Upvote'}
                </Button>
              </div>
            )}
            {!user && <div className="text-xs text-slate-500">Login to upvote issues.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

