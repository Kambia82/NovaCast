import { useEffect, useRef } from 'react';

interface Props {
  lat: number;
  lon: number;
  label?: string;
}

// Small non-interactive-feeling map preview reusing the same Leaflet setup
// as NovaCastRecon, so "On the Bank" (and any other flow with known coords)
// can show a real map instead of only a text link.
export default function MapPreview({ lat, lon, label }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await import('leaflet/dist/leaflet.css');
      const L = (await import('leaflet')).default;
      if (cancelled || !mapRef.current) return;

      const icon = L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;border-radius:50%;background:#BAE8FF;border:2px solid #060b10;box-shadow:0 0 8px #BAE8FF;"></div>`,
        iconSize: [14, 14],
      });

      if (!mapInstance.current) {
        mapInstance.current = L.map(mapRef.current, { zoomControl: false }).setView([lat, lon], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 18,
        }).addTo(mapInstance.current);
        const marker = L.marker([lat, lon], { icon }).addTo(mapInstance.current);
        if (label) marker.bindPopup(label);
      } else {
        mapInstance.current.setView([lat, lon], 13);
      }
    })();

    return () => { cancelled = true; };
  }, [lat, lon, label]);

  useEffect(() => {
    return () => { if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; } };
  }, []);

  return <div ref={mapRef} className="w-full h-[160px] rounded-2xl border border-[#1A3346] overflow-hidden" />;
}
