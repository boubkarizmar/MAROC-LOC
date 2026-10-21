import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Property } from '../../types';
import { useNavigate } from 'react-router-dom';
import { MapPin, Bed, Square } from 'lucide-react';
import { fixMediaUrl } from '../../utils/imageUtils';

// Fix Leaflet default icon issue in bundled apps
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const createPropertyIcon = (price: number, isVerified: boolean) => {
  const color = isVerified ? 'var(--color-primary-500)' : 'var(--color-gold-500)';
  return L.divIcon({
    className: 'custom-property-marker',
    html: `<div style="
      background: ${color}; color: white; padding: 4px 10px; border-radius: 20px;
      font-size: 11px; font-weight: 700; box-shadow: 0 2px 8px color-mix(in srgb, var(--color-text-primary) 25%, transparent);
      border: '2px solid var(--color-surface)'; white-space: nowrap;
    ">${(price / 1000).toFixed(0)}k MAD</div>`,
    iconSize: [60, 28],
    iconAnchor: [30, 14],
  });
};

const MapBounds: React.FC<{ properties: Property[] }> = ({ properties }) => {
  const map = useMap();
  useEffect(() => {
    if (properties.length > 0) {
      const valid = properties.filter((p) => p.latitude && p.longitude);
      if (valid.length > 0) {
        const bounds = L.latLngBounds(valid.map((p) => [p.latitude!, p.longitude!] as L.LatLngExpression));
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
      }
    }
  }, [properties, map]);
  return null;
};

interface PropertyMapProps {
  properties: Property[];
  onSelectProperty?: (id: number) => void;
  height?: string;
  className?: string;
}

export const PropertyMap: React.FC<PropertyMapProps> = ({
  properties,
  onSelectProperty,
  height = '500px',
  className = '',
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const validProperties = properties.filter((p) => p.latitude && p.longitude);
  const defaultCenter: [number, number] = [31.7917, -7.0926];

  return (
    <div className={`relative rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700 ${className}`} style={{ height }}>
      <MapContainer center={defaultCenter} zoom={6} scrollWheelZoom={true} style={{ height: '100%', width: '100%', zIndex: 1 }}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBounds properties={validProperties} />
        {validProperties.map((property) => (
          <Marker
            key={property.id}
            position={[property.latitude!, property.longitude!]}
            icon={createPropertyIcon(property.price, property.isVerified || false)}
            eventHandlers={{ click: () => onSelectProperty?.(property.id) }}
          >
            <Popup className="property-popup">
              <div className="cursor-pointer min-w-[220px]" onClick={() => navigate(`/property/${property.id}`)}>
                <div className="relative h-28 rounded-lg overflow-hidden mb-2">
                  <img src={property.images?.[0] ? fixMediaUrl(property.images[0]) : '/images/no-image.svg'} alt={property.title} className="w-full h-full object-cover" />
                  {property.isVerified && (
                    <span className="absolute top-1.5 left-1.5 bg-teal-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{t('property.verified')}</span>
                  )}
                </div>
                <h3 className="font-bold text-slate-900 dark:text-slate-50 text-sm line-clamp-1">{property.title}</h3>
                <p className="text-teal-600 font-bold text-sm mt-0.5">
                  {property.price.toLocaleString('fr-MA')} MAD
                  {property.type === 'RENT' && <span className="text-slate-400 text-xs font-normal">/mois</span>}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  <span className="flex items-center gap-0.5"><MapPin size={11} /> {property.city}</span>
                  {property.rooms && <span className="flex items-center gap-0.5"><Bed size={11} /> {property.rooms}</span>}
                  {property.surface && <span className="flex items-center gap-0.5"><Square size={11} /> {property.surface}m²</span>}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <div className="absolute top-3 left-3 z-[400] bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-full px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-md">
        {t('property.count', { count: validProperties.length })}
      </div>
    </div>
  );
};
