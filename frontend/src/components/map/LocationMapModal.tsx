import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { IComplaint } from '@shared-types/index';
import { osmRasterStyle } from './osmStyle';

export function LocationMapModal({
  complaint,
  onClose,
}: {
  complaint: Pick<IComplaint, 'title' | 'location' | 'status' | 'upvotes'>;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: osmRasterStyle,
      center: complaint.location.coordinates,
      zoom: 15,
    });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

    const el = document.createElement('div');
    el.style.width = '18px';
    el.style.height = '18px';
    el.style.borderRadius = '999px';
    el.style.border = '2px solid white';
    el.style.background =
      complaint.status === 'Pending' ? '#ef4444' : complaint.status === 'In-Progress' ? '#eab308' : '#22c55e';
    el.style.boxShadow = '0 6px 18px rgba(0,0,0,0.18)';

    new maplibregl.Marker({ element: el, anchor: 'center' })
      .setLngLat(complaint.location.coordinates)
      .addTo(map);

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [complaint.location.coordinates, complaint.status]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-900">{complaint.title}</div>
            <div className="text-xs text-slate-500">
              {complaint.location.coordinates[1].toFixed(5)}, {complaint.location.coordinates[0].toFixed(5)}
            </div>
          </div>
          <button onClick={onClose} className="rounded p-2 text-slate-500 hover:bg-slate-100">
            ✕
          </button>
        </div>
        <div className="h-[70vh] w-full" ref={containerRef} />
      </div>
    </div>
  );
}

