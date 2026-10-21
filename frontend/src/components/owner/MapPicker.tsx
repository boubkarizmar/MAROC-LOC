import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Crosshair, Loader2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

// Lazy-load the Leaflet component to avoid SSR/hydration crashes
// Leaflet accesses `window` and `document` at import time
const LeafletMapInner = React.lazy(() => import('./LeafletMapInner').then((m) => ({ default: m.LeafletMapInner })));

interface MapPickerProps {
  latitude: number | string;
  longitude: number | string;
  city?: string;
  onLocationChange: (lat: number, lng: number) => void;
  className?: string;
}

// Morocco geographic bounds
const MOROCCO_BOUNDS = {
  latMin: 21.0,
  latMax: 36.0,
  lngMin: -17.0,
  lngMax: -1.0,
};



function parseCoord(value: number | string, fallback: number): number {
  if (typeof value === 'number') return isNaN(value) ? fallback : value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
}

// Default fallback coordinates: Casablanca
const DEFAULT_POSITION: [number, number] = [33.5731, -7.5898];

export const MapPicker: React.FC<MapPickerProps> = ({
  latitude,
  longitude,
  city,
  onLocationChange,
  className = '',
}) => {
  const { t } = useTranslation();

  const validateCoordinates = useCallback((lat: number, lng: number): string | null => {
    if (isNaN(lat) || isNaN(lng)) return t('map.invalidCoordinates');
    if (lat < MOROCCO_BOUNDS.latMin || lat > MOROCCO_BOUNDS.latMax) {
      return t('map.latitudeRange', { min: MOROCCO_BOUNDS.latMin, max: MOROCCO_BOUNDS.latMax });
    }
    if (lng < MOROCCO_BOUNDS.lngMin || lng > MOROCCO_BOUNDS.lngMax) {
      return t('map.longitudeRange', { min: MOROCCO_BOUNDS.lngMin, max: MOROCCO_BOUNDS.lngMax });
    }
    return null;
  }, [t]);

  const lat = parseCoord(latitude, DEFAULT_POSITION[0]);
  const lng = parseCoord(longitude, DEFAULT_POSITION[1]);
  const [position, setPosition] = useState<[number, number]>([lat, lng]);
  const [isLocating, setIsLocating] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const mapRef = React.useRef<any>(null);

  // Client-only gate: prevents SSR/hydration crashes
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Sync position when props change
  useEffect(() => {
    const newLat = parseCoord(latitude, DEFAULT_POSITION[0]);
    const newLng = parseCoord(longitude, DEFAULT_POSITION[1]);
    if (!isNaN(newLat) && !isNaN(newLng)) {
      setPosition([newLat, newLng]);
      const error = validateCoordinates(newLat, newLng);
      setValidationError(error);
    }
  }, [latitude, longitude]);

  // ResizeObserver to handle container size changes
  const containerRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!containerRef.current || !window.ResizeObserver) return;

    const ro = new ResizeObserver(() => {
      const map = mapRef.current;
      if (map) {
        try {
          map.invalidateSize();
        } catch (e) {
          // ignore
        }
      }
    });

    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const handlePositionChange = useCallback((newLat: number, newLng: number) => {
    const error = validateCoordinates(newLat, newLng);
    setValidationError(error);
    setPosition([newLat, newLng]);
    onLocationChange(newLat, newLng);
  }, [onLocationChange]);

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      setValidationError(t('map.geolocationUnsupported'));
      return;
    }
    setIsLocating(true);
    setValidationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const error = validateCoordinates(lat, lng);
        setValidationError(error);
        setPosition([lat, lng]);
        onLocationChange(lat, lng);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        setValidationError(
          err.code === 1
            ? t('map.geolocationDenied')
            : t('map.geolocationFailed')
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [onLocationChange]);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-amber-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t('map.positionOnMap')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {position[0].toFixed(4)}, {position[1].toFixed(4)}
          </span>
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={handleLocateMe}
            disabled={isLocating}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-teal-600 text-white text-xs hover:bg-teal-700 transition disabled:opacity-50"
          >
            <Crosshair size={12} />
            {isLocating ? '...' : t('map.myPosition')}
          </motion.button>
        </div>
      </div>

      {validationError && (
        <div className="mb-2 flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertTriangle size={14} />
          {validationError}
        </div>
      )}

      <div ref={containerRef}>
        {isClient ? (
          <Suspense
            fallback={
              <div
                className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
                style={{ height: '280px' }}
              >
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <Loader2 size={24} className="animate-spin" />
                  <span className="text-xs">{t('map.loadingMap')}</span>
                </div>
              </div>
            }
          >
            <LeafletMapInner
              position={position}
              onPositionChange={handlePositionChange}
              city={city}
              onMapReady={(map) => {
                mapRef.current = map;
              }}
            />
          </Suspense>
        ) : (
          <div
            className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
            style={{ height: '280px' }}
          >
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <Loader2 size={24} className="animate-spin" />
              <span className="text-xs">{t('map.initializing')}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
