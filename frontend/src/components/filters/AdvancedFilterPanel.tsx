import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SearchFilters, PropertyCategory, PropertyType } from '../../types';
import { useCities } from '../../hooks/useCities';
import { useCategories } from '../../hooks/useCategories';
import { useTransactionTypes } from '../../hooks/useTransactionTypes';
import {
  SlidersHorizontal, X, Home, Building, TreePine, Warehouse,
  Car, Waves, Wind, Wifi, ShieldCheck, TreeDeciduous, Cat,
  Baby, Bus, Train, ShoppingBag, GraduationCap, Church, Stethoscope,
  Banknote, MapPin, BedDouble, Bath, Maximize, Calendar, Loader2
} from 'lucide-react';

interface AdvancedFilterPanelProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  onApply: () => void;
  onReset: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  APARTMENT: Building,
  HOUSE: Home,
  VILLA: TreePine,
  LAND: Maximize,
  OFFICE: Warehouse,
  RIAD: Home,
  STUDIO: Building,
  COMMERCIAL: Warehouse,
  PENTHOUSE: Building,
  DUPLEX: Home,
};

const TxLabels = ({ t }: { t: (k: string) => string }) => ({
  RENT: t('property.types.RENT'),
  BUY: t('property.types.BUY'),
  MORTGAGE: t('property.types.MORTGAGE'),
});

const Amenities = ({ t }: { t: (k: string) => string }) => [
  { key: 'furnished', label: t('property.features.furnished'), icon: Home },
  { key: 'hasParking', label: t('property.features.parking'), icon: Car },
  { key: 'hasPool', label: t('property.features.pool'), icon: Waves },
  { key: 'hasAirConditioning', label: t('property.features.airConditioning'), icon: Wind },
  { key: 'hasInternet', label: t('property.features.internet'), icon: Wifi },
  { key: 'hasSecurity', label: t('property.features.security'), icon: ShieldCheck },
  { key: 'gardenView', label: t('property.features.garden'), icon: TreeDeciduous },
  { key: 'hasBalcony', label: t('property.features.balcony'), icon: Building },
  { key: 'hasElevator', label: t('property.features.elevator'), icon: Building },
  { key: 'petAllowed', label: t('property.create.petAllowed'), icon: Cat },
];

const Proximity = ({ t }: { t: (k: string) => string }) => [
  { key: 'nearSchool', label: t('property.create.env.school'), icon: GraduationCap },
  { key: 'nearUniversity', label: t('property.create.env.university'), icon: GraduationCap },
  { key: 'nearHospital', label: t('property.create.env.hospital'), icon: Stethoscope },
  { key: 'nearMarket', label: t('property.create.env.market'), icon: ShoppingBag },
  { key: 'nearTram', label: t('property.create.env.tram'), icon: Train },
  { key: 'nearBus', label: t('property.create.env.bus'), icon: Bus },
  { key: 'nearMosque', label: t('property.create.env.mosque'), icon: Church },
  { key: 'nearTrainStation', label: t('property.create.env.train'), icon: Train },
];

const PriceRanges = ({ t }: { t: (k: string, opts?: any) => string }) => [
  { min: 0, max: 3000, label: t('property.filters.priceRangeTemplate', { min: '0', max: '3 000' }) },
  { min: 3000, max: 5000, label: t('property.filters.priceRangeTemplate', { min: '3 000', max: '5 000' }) },
  { min: 5000, max: 10000, label: t('property.filters.priceRangeTemplate', { min: '5 000', max: '10 000' }) },
  { min: 10000, max: 20000, label: t('property.filters.priceRangeTemplate', { min: '10 000', max: '20 000' }) },
  { min: 20000, max: 50000, label: t('property.filters.priceRangeTemplate', { min: '20 000', max: '50 000' }) },
  { min: 50000, max: 100000000, label: t('property.filters.priceRangePlus', { min: '50 000' }) },
];

export const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({
  filters,
  onChange,
  onApply,
  onReset,
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);
  const txLabels = TxLabels({ t });
  const amenities = Amenities({ t });
  const proximity = Proximity({ t });
  const priceRanges = PriceRanges({ t });
  const { data: cities, isLoading: citiesLoading } = useCities();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: transactionTypes, isLoading: txLoading } = useTransactionTypes();

  const updateFilter = useCallback(<K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleAmenity = useCallback((key: keyof SearchFilters) => {
    setLocalFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleApply = () => {
    onChange(localFilters);
    onApply();
  };

  const handleReset = () => {
    setLocalFilters({});
    onReset();
  };

  const activeCount = Object.entries(localFilters).filter(([k, v]) => {
    if (v === undefined || v === '' || v === false) return false;
    return true;
  }).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { x: '100%' }}
            animate={{ x: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { x: '100%' }}
            transition={prefersReducedMotion ? {} : { type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 bg-white dark:bg-slate-800 shadow-2xl overflow-y-auto"
          >
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-5 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-teal-600" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">{t('property.filters.title')}</h2>
                {activeCount > 0 && (
                  <span className="bg-teal-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{activeCount}</span>
                )}
              </div>
              <button onClick={onClose} aria-label={t('common.close')} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                <X className="w-5 h-5 text-slate-500" aria-hidden="true" />
              </button>
            </div>

            <div className="p-5 space-y-8">
              {/* Transaction Type */}
              <section>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">{t('property.search.transactionType')}</h3>
                {txLoading ? (
                  <div className="flex items-center gap-2 text-slate-400"><Loader2 className="w-4 h-4 animate-spin" /> {t('common.loading')}</div>
                ) : (
                  <div className="flex gap-2">
                    {transactionTypes?.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => updateFilter('type', localFilters.type === t.value ? undefined : t.value)}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition ${
                          localFilters.type === t.value
                            ? 'bg-teal-600 text-white shadow-md'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {txLabels[t.value] || t.label}
                      </button>
                    ))}
                  </div>
                )}
              </section>

              {/* Category */}
              <section>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">{t('common.category')}</h3>
                {categoriesLoading ? (
                  <div className="flex items-center gap-2 text-slate-400"><Loader2 className="w-4 h-4 animate-spin" /> {t('common.loading')}</div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {categories?.map((cat) => {
                      const Icon = CATEGORY_ICONS[cat.value] || Home;
                      return (
                        <button
                          key={cat.value}
                          onClick={() => updateFilter('category', localFilters.category === cat.value ? undefined : cat.value)}
                          className={`flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition ${
                            localFilters.category === cat.value
                              ? 'bg-teal-600 text-white shadow-md'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          <Icon className="w-4 h-4" /> {cat.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* City */}
              <section>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">{t('common.city')}</h3>
                {citiesLoading ? (
                  <div className="flex items-center gap-2 text-slate-400"><Loader2 className="w-4 h-4 animate-spin" /> {t('common.loading')}</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {cities?.map((city) => (
                      <button
                        key={city}
                        onClick={() => updateFilter('city', localFilters.city === city ? undefined : city)}
                        className={`py-1.5 px-3 rounded-full text-xs font-medium transition ${
                          localFilters.city === city
                            ? 'bg-amber-400 text-slate-900'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                )}
              </section>

              {/* Price Range */}
              <section>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">{t('property.filters.priceRange')}</h3>
                <div className="space-y-2">
                  {priceRanges.map((range) => (
                    <button
                      key={range.label}
                      onClick={() => {
                        const isActive = localFilters.minPrice === range.min && localFilters.maxPrice === range.max;
                        updateFilter('minPrice', isActive ? undefined : range.min);
                        updateFilter('maxPrice', isActive ? undefined : range.max);
                      }}
                      className={`w-full text-left py-2 px-3 rounded-lg text-sm transition flex items-center gap-2 ${
                        localFilters.minPrice === range.min && localFilters.maxPrice === range.max
                          ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border border-teal-200'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Banknote className="w-4 h-4" /> {range.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Rooms & Surface */}
              <section>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">{t('property.filters.roomsAndSurface')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">{t('property.filters.minBedrooms')}</label>
                    <div className="flex items-center gap-2">
                      <BedDouble className="w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        min={0}
                        value={localFilters.minRooms || ''}
                        onChange={(e) => updateFilter('minRooms', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">{t('property.filters.minSurface')}</label>
                    <div className="flex items-center gap-2">
                      <Maximize className="w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        min={0}
                        value={localFilters.minSurface || ''}
                        onChange={(e) => updateFilter('minSurface', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Amenities */}
              <section>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">{t('property.details.equipments')}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {amenities.map((amenity) => (
                    <button
                      key={amenity.key}
                      onClick={() => toggleAmenity(amenity.key as keyof SearchFilters)}
                      className={`flex items-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition ${
                        localFilters[amenity.key as keyof SearchFilters]
                          ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border border-teal-200'
                          : 'bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <amenity.icon className="w-3.5 h-3.5" /> {amenity.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Proximity */}
              <section>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">{t('property.filters.proximity')}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {proximity.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => toggleAmenity(item.key as keyof SearchFilters)}
                      className={`flex items-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition ${
                        localFilters[item.key as keyof SearchFilters]
                          ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200'
                          : 'bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <item.icon className="w-3.5 h-3.5" /> {item.label}
                    </button>
                  ))}
                </div>
              </section>
            </div>

            {/* Sticky footer */}
            <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              >
                {t('common.reset')}
              </button>
              <button
                onClick={handleApply}
                className="flex-1 py-3 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 transition shadow-md"
              >
                {t('common.apply')} ({activeCount})
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
