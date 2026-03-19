import { useEffect, useMemo, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { IComplaint } from '@shared-types/index';
import { osmRasterStyle } from './osmStyle';

const KOLKATA: [number, number] = [88.3639, 22.5726];
const LS_VIEW = 'civictrack.mapView';

function statusColor(status: IComplaint['status']) {
  if (status === 'Pending') return '#ef4444';
  if (status === 'In-Progress') return '#eab308';
  return '#22c55e';
}

function markerSize(upvotes: number) {
  // 12px base, grows with upvotes, capped so it doesn't get ridiculous
  return Math.min(34, 12 + Math.max(0, upvotes) * 2);
}

export function ComplaintMap({
  complaints,
  selectedId,
  onSelect,
  interactive = true,
}: {
  complaints: IComplaint[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  interactive?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);

  const selected = useMemo(
    () => (selectedId ? complaints.find((c) => c._id === selectedId) : undefined),
    [complaints, selectedId]
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const savedRaw = localStorage.getItem(LS_VIEW);
    const saved = savedRaw ? (JSON.parse(savedRaw) as { center: [number, number]; zoom: number }) : null;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: osmRasterStyle,
      center: saved?.center ?? KOLKATA,
      zoom: saved?.zoom ?? 11,
      interactive,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    mapRef.current = map;

    const persist = () => {
      const c = map.getCenter();
      localStorage.setItem(LS_VIEW, JSON.stringify({ center: [c.lng, c.lat], zoom: map.getZoom() }));
    };
    map.on('moveend', persist);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lngLat: [number, number] = [pos.coords.longitude, pos.coords.latitude];

          // White square "you are here" marker
          const el = document.createElement('div');
          el.style.cssText = [
            'width:18px', 'height:18px',
            'background:white',
            'border-radius:4px',
            'border:2px solid rgba(0,0,0,0.25)',
            'box-shadow:0 2px 8px rgba(0,0,0,0.35)',
            'display:flex', 'align-items:center', 'justify-content:center',
            'pointer-events:none',
          ].join(';');
          const dot = document.createElement('div');
          dot.style.cssText = [
            'width:6px', 'height:6px',
            'border-radius:50%',
            'background:#3b82f6',
          ].join(';');
          el.appendChild(dot);

          userMarkerRef.current?.remove();
          userMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'center' })
            .setLngLat(lngLat)
            .addTo(map);

          map.flyTo({ center: lngLat, zoom: 14, duration: 900 });
        },
        () => undefined,
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }

    return () => {
      map.off('moveend', persist);
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [interactive]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const existing = markersRef.current;
    const nextIds = new Set(complaints.map((c) => c._id));

    for (const [id, marker] of existing.entries()) {
      if (!nextIds.has(id)) {
        marker.remove();
        existing.delete(id);
      }
    }

    for (const c of complaints) {
      const size = markerSize(c.upvotes.length);
      const color = statusColor(c.status);

      if (!existing.has(c._id)) {
        const el = document.createElement('button');
        el.type = 'button';
        el.style.borderRadius = '999px';
        el.style.border = '2px solid white';
        el.style.boxShadow = '0 6px 18px rgba(0,0,0,0.18)';
        el.title = c.title;
        el.onclick = () => onSelect?.(c._id);

        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat(c.location.coordinates)
          .addTo(map);
        existing.set(c._id, marker);
      }

      // Always update styles so upvotes/status changes reflect immediately
      const marker = existing.get(c._id)!;
      const el = marker.getElement() as HTMLButtonElement;
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.background = color;
    }
  }, [complaints, onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selected) return;
    map.flyTo({ center: selected.location.coordinates, zoom: 14, essential: true });
  }, [selected]);

  useEffect(() => {
    const selected = selectedId ? markersRef.current.get(selectedId) : undefined;
    markersRef.current.forEach((marker) => {
      const el = marker.getElement() as HTMLElement;
      el.style.transform = 'scale(1)';
    });
    if (selected) {
      const el = selected.getElement() as HTMLElement;
      el.style.transform = 'scale(1.25)';
    }
  }, [selectedId]);

  return <div ref={containerRef} className="h-full w-full" />;
}

