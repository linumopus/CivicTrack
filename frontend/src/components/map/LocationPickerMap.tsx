import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { osmRasterStyle } from './osmStyle';

export function LocationPickerMap({
  lngLat,
  onChange,
}: {
  lngLat: [number, number];
  onChange: (lngLat: [number, number]) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: osmRasterStyle,
      center: lngLat,
      zoom: 14,
    });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

    const marker = new maplibregl.Marker({ draggable: true }).setLngLat(lngLat).addTo(map);
    marker.on('dragend', () => {
      const p = marker.getLngLat();
      onChange([p.lng, p.lat]);
    });

    map.on('click', (e) => onChange([e.lngLat.lng, e.lngLat.lat]));

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      marker.remove();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    markerRef.current?.setLngLat(lngLat);
    mapRef.current?.easeTo({ center: lngLat, duration: 250 });
  }, [lngLat]);

  return <div ref={containerRef} className="h-full w-full" />;
}

