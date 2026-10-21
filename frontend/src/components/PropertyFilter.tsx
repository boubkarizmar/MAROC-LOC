import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Filter, Loader2, Ruler, Bed, Car, Waves, Wind, Wifi, Shield, Home, DollarSign
} from 'lucide-react';
import { propertyApi } from '../api/propertyApi';
import { SearchFilters } from '../types';

interface PropertyFilterProps {
  onFilterChange: (filters: SearchFilters) => void;
  isLoading?: boolean;
}

export const PropertyFilter: React.FC<PropertyFilterProps> = ({ onFilterChange, isLoading = false }) => {
  const { t } = useTranslation();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const [filters, setFilters] = useState<SearchFilters>({
    keyword: '',
    city: '',
    minPrice: undefined,
    maxPrice: undefined,
    propertyType: undefined,
    category: undefined,
    minSurface: undefined,
    maxSurface: undefined,
    minRooms: undefined,
    maxRooms: undefined,
    furnished: false,
    hasParking: false,
    hasPool: false,
    hasElevator: false,
    hasAirConditioning: false,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [categories, setCategories] = useState<Array<{ value: string; label: string }>>([]);
  const [transactionTypes, setTransactionTypes] = useState<Array<{ value: string; label: string }>>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherCity, setOtherCity] = useState('');

  // Récupérer les catégories et types de transaction
  useEffect(() => {
    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        const [categoriesRes, typesRes] = await Promise.all([
          propertyApi.getCategories(),
          propertyApi.getTransactionTypes(),
        ]);
        setCategories((categoriesRes.data || []).map(value => ({
          value,
          label: t(`property.categories.${value}`, value.replace(/_/g, ' ')),
        })));
        setTransactionTypes((typesRes.data || []).map(value => ({
          value,
          label: t(`property.types.${value}`, value.replace(/_/g, ' ')),
        })));
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error fetching filter options:', error);
        }
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, [t]);

  // Récupérer les villes depuis l'API
  useEffect(() => {
    const fetchCities = async () => {
      setLoadingCities(true);
      try {
        const response = await propertyApi.getDistinctCities();
        setCities(response.data || []);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error fetching cities:', error);
        }
        setCities([]);
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, [t]);

  const debouncedFilterChange = useCallback((updatedFilters: SearchFilters) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onFilterChange(updatedFilters);
    }, 300);
  }, [onFilterChange]);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const updatedFilters = { ...filters, [key]: value };
    setFilters(updatedFilters);
    debouncedFilterChange(updatedFilters);
  };

  const handleCityChange = (value: string) => {
    if (value === 'OTHER') {
      setShowOtherInput(true);
      setSelectedCity('');
      handleFilterChange('city', '');
    } else {
      setShowOtherInput(false);
      setSelectedCity(value);
      setOtherCity('');
      handleFilterChange('city', value);
    }
  };

  const handleOtherCityChange = (value: string) => {
    setOtherCity(value);
    handleFilterChange('city', value);
  };

  const handleClearFilters = () => {
    const emptyFilters: SearchFilters = {
      keyword: '',
      city: '',
      minPrice: undefined,
      maxPrice: undefined,
      propertyType: undefined,
      category: undefined,
      minSurface: undefined,
      maxSurface: undefined,
      minRooms: undefined,
      maxRooms: undefined,
      furnished: false,
      hasParking: false,
      hasPool: false,
      hasElevator: false,
      hasAirConditioning: false,
    };
    setFilters(emptyFilters);
    setSelectedCity('');
    setShowOtherInput(false);
    setOtherCity('');
    onFilterChange(emptyFilters);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined && v !== '' && v !== false);

  // Séparer les villes en deux groupes
  // const majorCities = cities.slice(0, 10);
  // const otherCities = cities.slice(10);
  const majorCities = Array.isArray(cities) ? cities.slice(0, 10) : [];
  const otherCities = Array.isArray(cities) ? cities.slice(10) : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white p-6 shadow-lg"
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary-500" />
          <h2 className="text-lg font-semibold text-slate-900">{t('property.search.advancedTitle')}</h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
          >
            <X size={14} />{t('property.search.clear')}</button>
        )}
      </div>

      {loadingOptions ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
          <span className="ml-2 text-slate-600">{t('common.loading')}</span>
        </div>
      ) : (
        <>
          {/* Recherche principale */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{t('property.search.keyword')}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('property.search.keywordPlaceholder')}
                  value={filters.keyword}
                  onChange={(e) => handleFilterChange('keyword', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>

            {/* Ville - Version dynamique avec API */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{t('property.search.city')}</label>
              {loadingCities ? (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
                  <span className="text-sm text-slate-500">{t('common.loading')}</span>
                </div>
              ) : (
                <>
                  <select
                    value={showOtherInput ? 'OTHER' : selectedCity}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  >
                    <option value="">{t('property.search.allCities')}</option>

                    {majorCities.length > 0 && (
                      <optgroup label={t('property.search.majorCities')}>
                        {majorCities.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </optgroup>
                    )}

                    {otherCities.length > 0 && (
                      <optgroup label={t('property.search.otherCities')}>
                        {otherCities.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </optgroup>
                    )}

                    <option value="OTHER">{t('property.search.otherCity')}</option>
                  </select>

                  {showOtherInput && (
                    <input
                      type="text"
                      placeholder={t('property.search.otherCityPlaceholder')}
                      value={otherCity}
                      onChange={(e) => handleOtherCityChange(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                      autoFocus
                    />
                  )}

                  <p className="mt-1 text-xs text-slate-500">
                    {t('property.search.availableCities', { count: cities.length })}
                  </p>
                </>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{t('property.search.transactionType')}</label>
              <select
                value={filters.propertyType || ''}
                onChange={(e) => handleFilterChange('propertyType', e.target.value || undefined)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              >
                <option value="">{t('common.all')}</option>
                {transactionTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{t('common.category')}</label>
              <select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              >
                <option value="">{t('common.allFeminine')}</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Prix */}
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{t('property.search.minPrice')}</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  placeholder="0"
                  value={filters.minPrice ?? ''}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{t('property.search.maxPrice')}</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  placeholder={t('common.unlimited')}
                  value={filters.maxPrice ?? ''}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>
          </div>

          {/* Filtres avancés - Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="mt-4 flex items-center gap-2 text-sm font-medium text-primary-500 hover:text-primary-600"
          >
            <Filter size={14} />
            {showAdvanced ? t('property.search.hideAdvanced') : t('property.search.showAdvanced')}
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                {/* Surface */}
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 flex items-center gap-1 text-sm font-medium text-slate-700">
                      <Ruler size={14} /> {t('property.search.minSurface')}</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={filters.minSurface ?? ''}
                      onChange={(e) => handleFilterChange('minSurface', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 flex items-center gap-1 text-sm font-medium text-slate-700">
                      <Ruler size={14} /> {t('property.search.maxSurface')}</label>
                    <input
                      type="number"
                      placeholder={t('common.unlimited')}
                      value={filters.maxSurface ?? ''}
                      onChange={(e) => handleFilterChange('maxSurface', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    />
                  </div>
                </div>

                {/* Pièces */}
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 flex items-center gap-1 text-sm font-medium text-slate-700">
                      <Bed size={14} /> {t('property.search.minRooms')}
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={filters.minRooms ?? ''}
                      onChange={(e) => handleFilterChange('minRooms', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 flex items-center gap-1 text-sm font-medium text-slate-700">
                      <Bed size={14} /> {t('property.search.maxRooms')}
                    </label>
                    <input
                      type="number"
                      placeholder={t('common.unlimited')}
                      value={filters.maxRooms ?? ''}
                  onChange={(e) => handleFilterChange('maxRooms', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    />
                  </div>
                </div>

                {/* Équipements */}
                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium text-slate-700">{t('property.create.equipments')}</label>
                  <div className="flex flex-wrap gap-3">
                    <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={filters.furnished}
                        onChange={(e) => handleFilterChange('furnished', e.target.checked)}
                        className="rounded border-slate-300 text-primary-500 focus:ring-primary-500"
                      />
                      <Home size={14} /> {t('property.features.furnished')}</label>
                    <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={filters.hasParking}
                        onChange={(e) => handleFilterChange('hasParking', e.target.checked)}
                        className="rounded border-slate-300 text-primary-500 focus:ring-primary-500"
                      />
                      <Car size={14} /> {t('property.features.parking')}
                    </label>
                    <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={filters.hasPool}
                        onChange={(e) => handleFilterChange('hasPool', e.target.checked)}
                        className="rounded border-slate-300 text-primary-500 focus:ring-primary-500"
                      />
                      <Waves size={14} /> {t('property.features.pool')}
                    </label>
                    <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={filters.hasElevator}
                        onChange={(e) => handleFilterChange('hasElevator', e.target.checked)}
                        className="rounded border-slate-300 text-primary-500 focus:ring-primary-500"
                      />
                      <span className="text-lg">↕</span> {t('property.features.elevator')}
                    </label>
                    <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={filters.hasAirConditioning}
                        onChange={(e) => handleFilterChange('hasAirConditioning', e.target.checked)}
                        className="rounded border-slate-300 text-primary-500 focus:ring-primary-500"
                      />
                      <Wind size={14} /> {t('property.features.airConditioning')}
                    </label>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading indicator */}
          {isLoading && (
            <div className="mt-4 flex items-center justify-center rounded-xl bg-slate-50 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
              <span className="ml-2 text-sm text-slate-600">{t('property.search.searching')}</span>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};
