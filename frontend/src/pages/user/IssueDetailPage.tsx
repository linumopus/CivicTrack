import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { IComplaint, ComplaintStatus } from '@shared-types/index';
import { Button } from '../../components/Button';
import { useAuth } from '../../state/auth/AuthContext';
import { fetchComplaintById, leaveFeedback, refileComplaint } from '../../state/complaints/complaintsApi';

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function findStatusAt(c: IComplaint, status: ComplaintStatus) {
  const h = c.statusHistory?.find((x) => x.status === status);
  return h?.at;
}

export function IssueDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState<IComplaint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [rating, setRating] = useState(5);
  const [note, setNote] = useState('');
  const [refileTitle, setRefileTitle] = useState('');
  const [refileDesc, setRefileDesc] = useState('');

  useEffect(() => {
    if (!id || !token) return;
    setError(null);
    fetchComplaintById(id, token)
      .then((c) => {
        setComplaint(c);
        setRefileTitle(`Refile: ${c.title}`);
        setRefileDesc(c.description);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, [id, token]);

  const reportedAt = complaint ? complaint.createdAt : null;
  const inProgressAt = complaint ? findStatusAt(complaint, 'In-Progress') : null;
  const resolvedAt = complaint ? findStatusAt(complaint, 'Resolved') : null;

  const resolutionMs = useMemo(() => {
    if (!reportedAt || !resolvedAt) return null;
    const ms = new Date(resolvedAt).getTime() - new Date(reportedAt).getTime();
    return ms >= 0 ? ms : null;
  }, [reportedAt, resolvedAt]);

  const resolutionText = useMemo(() => {
    if (!resolutionMs) return '—';
    const hours = resolutionMs / (1000 * 60 * 60);
    if (hours < 24) return `${hours.toFixed(1)} hours`;
    const days = hours / 24;
    return `${days.toFixed(1)} days`;
  }, [resolutionMs]);

  if (!id) return <div className="p-6 text-sm text-slate-600">Missing id</div>;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500">
            <Link className="underline" to="/user">
              Your issues
            </Link>{' '}
            / Details
          </div>
          <h1 className="mt-2 text-xl font-semibold text-slate-900">{complaint?.title ?? 'Loading…'}</h1>
          {complaint && <div className="mt-1 text-sm text-slate-600">Status: {complaint.status}</div>}
        </div>
        <Button variant="secondary" onClick={() => navigate('/user')}>
          Back
        </Button>
      </div>

      {error && <div className="mt-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

      {complaint && (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Timeline</div>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <div className="flex items-center justify-between">
                  <span>Reported</span>
                  <span className="text-xs text-slate-500">{fmt(complaint.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Set In‑Progress</span>
                  <span className="text-xs text-slate-500">{inProgressAt ? fmt(inProgressAt) : '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Resolved</span>
                  <span className="text-xs text-slate-500">{resolvedAt ? fmt(resolvedAt) : '—'}</span>
                </div>
                <div className="mt-2 border-t border-slate-100 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Resolution time</span>
                    <span className="text-xs text-slate-500">{resolutionText}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Description</div>
              <div className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{complaint.description}</div>
            </div>
          </div>

          {complaint.status === 'Resolved' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="text-sm font-semibold text-slate-900">Leave a rating (posts to Community)</div>

                <div className="mt-3 grid gap-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">Rating</label>
                    <select
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                      disabled={!!complaint.feedback}
                    >
                      {[5, 4, 3, 2, 1].map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Note (optional)</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="mt-1 min-h-20 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    disabled={!!complaint.feedback}
                    placeholder="Share how the resolution went…"
                  />
                </div>
                {complaint.feedback ? (
                  <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                    Already rated: <span className="font-semibold">{complaint.feedback.rating}/5</span>
                  </div>
                ) : (
                  <Button
                    disabled={!token || busy}
                    onClick={async () => {
                      if (!token) return;
                      setBusy(true);
                      try {
                        const res = await leaveFeedback(complaint._id, { rating, note: note.trim() || undefined }, token);
                        setComplaint((c) => (c ? { ...c, feedback: res.feedback } : c));
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Post rating
                  </Button>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Refile complaint</div>
              <div className="mt-2 text-xs text-slate-500">
                Available once the complaint is marked <span className="font-semibold">Resolved</span>.
              </div>
              <div className="mt-3 grid gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700">Title</label>
                  <input
                    value={refileTitle}
                    onChange={(e) => setRefileTitle(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Description</label>
                  <textarea
                    value={refileDesc}
                    onChange={(e) => setRefileDesc(e.target.value)}
                    className="mt-1 min-h-24 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <Button
                  variant="secondary"
                  disabled={
                    !token ||
                    busy ||
                    !refileTitle.trim() ||
                    !refileDesc.trim()
                  }
                  onClick={async () => {
                    if (!token) return;
                    setBusy(true);
                    try {
                      const newC = await refileComplaint(complaint._id, { title: refileTitle, description: refileDesc }, token);
                      navigate(`/user/issues/${newC._id}`);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Refile
                </Button>
              </div>
            </div>
          </div>
          )}
        </div>
      )}
    </div>
  );
}

