import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ComplaintCategory } from '@shared-types/index';
import { Button } from '../components/Button';
import { LocationPickerMap } from '../components/map/LocationPickerMap';
import { useAuth } from '../state/auth/AuthContext';
import { createComplaint } from '../state/complaints/complaintsApi';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export function ReportIssuePage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>('Road');
  const [description, setDescription] = useState('');
  const [lngLat, setLngLat] = useState<[number, number]>([77.5946, 12.9716]);
  const [imageBase64, setImageBase64] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setLngLat([pos.coords.longitude, pos.coords.latitude]),
      () => undefined,
      { enableHighAccuracy: true, timeout: 7000 }
    );
  }, []);

  const canSubmit = useMemo(() => title.trim() && description.trim() && !!token, [title, description, token]);

  return (
    <div className="mx-auto grid max-w-6xl gap-6 p-6 md:grid-cols-2">
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Report an Issue</h1>
          <p className="mt-1 text-sm text-slate-600">Drop a pin, add details, and submit.</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="e.g., Pothole near main road"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="Road">Road</option>
                <option value="Lighting">Lighting</option>
                <option value="Drainage">Drainage</option>
                <option value="Garbage">Garbage</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 min-h-28 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="Add helpful context…"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Photo (optional)</label>
              <input
                type="file"
                accept="image/*"
                className="mt-1 block w-full text-sm"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return setImageBase64(undefined);
                  const b64 = await fileToBase64(file);
                  setImageBase64(b64);
                }}
              />
              {imageBase64 && (
                <img
                  src={imageBase64}
                  alt="Preview"
                  className="mt-3 h-44 w-full rounded-md border border-slate-200 object-cover"
                />
              )}
            </div>

            {error && <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

            <div className="flex items-center gap-3">
              <Button
                disabled={!canSubmit || busy}
                onClick={async () => {
                  if (!token) return;
                  setBusy(true);
                  setError(null);
                  try {
                    await createComplaint({
                      title,
                      description,
                      category,
                      coordinates: lngLat,
                      imageBase64,
                      token,
                    });
                    navigate('/user');
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to submit');
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? 'Submitting…' : 'Submit'}
              </Button>
              <Button variant="ghost" onClick={() => navigate('/user')}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium text-slate-700">Pick location</div>
        <div className="h-[540px] overflow-hidden rounded-lg border border-slate-200">
          <LocationPickerMap lngLat={lngLat} onChange={setLngLat} />
        </div>
        <div className="text-xs text-slate-500">
          Coordinates: {lngLat[1].toFixed(5)}, {lngLat[0].toFixed(5)}
        </div>
      </div>
    </div>
  );
}

