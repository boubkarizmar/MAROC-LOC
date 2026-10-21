import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Property } from '../../types';
import { X, Check, MapPin, Bed, Bath, Square, Car, Wind, Waves, TreeDeciduous, ShieldCheck, Wifi, Calendar, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fixMediaUrl } from '../../utils/imageUtils';

interface PropertyComparisonProps {
  properties: Property[];
  isOpen: boolean;
  onClose: () => void;
  onRemove: (id: number) => void;
}

const ComparisonFields = ({ t }: { t: (k: string) => string }) => [
  { key: 'price', label: t('common.price'), format: (v: number, p: Property) => `${v.toLocaleString('fr-MA')} ${t('common.currency')}${p.type === 'RENT' ? `/${t('common.perMonth')}` : ''}` },
  { key: 'city', label: t('common.city'), format: (v: string) => v },
  { key: 'surface', label: t('common.surface'), format: (v: number) => `${v} ${t('common.squareMeter')}` },
  { key: 'rooms', label: t('common.rooms'), format: (v: number) => v },
  { key: 'bedrooms', label: t('common.bedrooms'), format: (v: number) => v },
  { key: 'bathrooms', label: t('common.bathrooms'), format: (v: number) => v },
  { key: 'constructionYear', label: t('common.constructionYear'), format: (v: number) => v },
  { key: 'condition', label: t('common.condition'), format: (v: string) => v },
];

const AMENITY_ICONS: Record<string, React.ElementType> = {
  hasParking: Car,
  hasPool: Waves,
  hasAirConditioning: Wind,
  hasGarden: TreeDeciduous,
  hasSecurity: ShieldCheck,
  hasInternet: Wifi,
  hasElevator: CheckCircle,
};

const AmenityLabels = ({ t }: { t: (k: string) => string }) => ({
  hasParking: t('property.features.parking'),
  hasPool: t('property.features.pool'),
  hasAirConditioning: t('property.features.airConditioning'),
  hasGarden: t('property.features.garden'),
  hasSecurity: t('property.features.security'),
  hasInternet: t('property.features.internet'),
  hasElevator: t('property.features.elevator'),
});

export const PropertyComparison: React.FC<PropertyComparisonProps> = ({
  properties,
  isOpen,
  onClose,
  onRemove,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const comparisonFields = ComparisonFields({ t });
  const amenityLabels = AmenityLabels({ t });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 100 }}
            transition={prefersReducedMotion ? {} : undefined}
            className="relative bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">{t('property.details.compare')}</h2>
              <button onClick={onClose} aria-label={t('common.close')} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                <X className="w-5 h-5 text-slate-500" aria-hidden="true" />
              </button>
            </div>

            <div className="p-6 overflow-x-auto">
              {properties.length === 0 ? (
                <div className="text-center py-12 text-slate-500">{t('property.comparison.empty', 'Select properties to compare')}</div>
              ) : (
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr>
                      <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-4 w-32">{t('property.comparison.criteria', 'Criteria')}</th>
                      {properties.map((p) => (
                        <th key={p.id} className="pb-4 px-2 min-w-[200px]">
                          <div className="relative">
                            <button
                              onClick={() => onRemove(p.id)}
                              aria-label={t('a11y.removeFromComparison')}
                              className="absolute -top-1 -right-1 p-1 rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition z-10"
                            >
                              <X className="w-3 h-3" aria-hidden="true" />
                            </button>
                            <div
                              className="cursor-pointer"
                              onClick={() => navigate(`/property/${p.id}`)}
                            >
                              <div className="h-28 rounded-xl overflow-hidden mb-2">
                                <img src={p.images?.[0] ? fixMediaUrl(p.images[0]) : '/images/no-image.svg'} alt={p.title} className="w-full h-full object-cover" />
                              </div>
                              <p className="text-sm font-bold text-slate-900 dark:text-slate-50 line-clamp-2 text-left">{p.title}</p>
                              {p.isVerified && (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-teal-50 text-teal-600 px-1.5 py-0.5 rounded-full mt-1">
                                  <CheckCircle className="w-3 h-3" /> {t('property.verified')}
                                </span>
                              )}
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonFields.map((field) => (
                      <tr key={field.key} className="border-t border-slate-100 dark:border-slate-700">
                        <td className="py-3 text-xs font-medium text-slate-500">{field.label}</td>
                        {properties.map((p) => {
                          const value = (p as any)[field.key];
                          const isPrice = field.key === 'price';
                          const isBestPrice = isPrice && value === Math.min(...properties.map((pr) => pr.price));
                          return (
                            <td key={p.id} className="py-3 px-2">
                              <span className={`text-sm ${isBestPrice ? 'text-teal-600 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                                {value !== undefined && value !== null ? field.format(value, p) : '-'}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {/* Amenities */}
                    <tr className="border-t border-slate-100 dark:border-slate-700">
                      <td className="py-3 text-xs font-medium text-slate-500 align-top">{t('property.details.equipments')}</td>
                      {properties.map((p) => (
                        <td key={p.id} className="py-3 px-2">
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(amenityLabels).map(([key, label]) => {
                              const hasIt = (p as any)[key];
                              return (
                                <span
                                  key={key}
                                  className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full ${
                                    hasIt
                                      ? 'bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400'
                                      : 'bg-slate-50 text-slate-300 dark:bg-slate-700 dark:text-slate-500'
                                  }`}
                                >
                                  {hasIt ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                  {label}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
