import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LeafletMapInnerProps {
  position: [number, number];
  onPositionChange: (lat: number, lng: number) => void;
  city?: string;
  onMapReady?: (map: L.Map) => void;
}

// Custom teal marker icon using divIcon — avoids Vite asset bundling issues
const createCustomIcon = () =>
  L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div style="
      width: 28px; height: 28px;
      background: var(--color-primary-500);
      border: 3px solid var(--color-surface);
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 6px color-mix(in srgb, var(--color-text-primary) 30%, transparent);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });

export const LeafletMapInner: React.FC<LeafletMapInnerProps> = ({
  position,
  onPositionChange,
  city,
  onMapReady,
}) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const iconRef = useRef<L.DivIcon>(createCustomIcon());

  useEffect(() => {
    if (!containerRef.current) return;

    // Create map
    const map = L.map(containerRef.current, {
      center: position,
      zoom: 14,
      scrollWheelZoom: true,
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Add marker
    const marker = L.marker(position, { icon: iconRef.current }).addTo(map);
    markerRef.current = marker;

    // Click handler
    const handleClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      onPositionChange(lat, lng);
    };
    map.on('click', handleClick);

    // Fix grey tiles on initial render
    requestAnimationFrame(() => {
      map.invalidateSize();
    });

    mapRef.current = map;
    onMapReady?.(map);

    return () => {
      map.off('click', handleClick);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []); // Initialize only once

  // Update marker position when prop changes
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (map && marker) {
      marker.setLatLng(position);
      map.panTo(position);
    }
  }, [position]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      <div ref={containerRef} style={{ height: '280px', width: '100%' }} />

      <div className="absolute bottom-2 left-2 right-2 z-[400] pointer-events-none">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-slate-600 shadow-sm flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-500">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          {t('map.clickToSetLocation')}
        </div>
      </div>

      {city && (
        <p className="absolute top-2 left-2 z-[400] bg-white/90 backdrop-blur-sm rounded-md px-2 py-1 text-xs text-slate-600 shadow-sm pointer-events-none">
          {t('map.city')}: <span className="font-semibold">{city}</span>
        </p>
      )}
    </div>
  );
};
