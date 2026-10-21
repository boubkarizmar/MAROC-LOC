import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Search as SearchIcon,
  SlidersHorizontal,
  ArrowLeft,
  Home,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { propertyApi, PaginatedResponse } from '../api/propertyApi';
import { PropertyCard } from '../components/PropertyCard';
import { AdvancedFilterPanel } from '../components/filters/AdvancedFilterPanel';
import { SearchFilters, Property } from '../types';

const DEFAULT_PAGE = 0;
const DEFAULT_SIZE = 20;

const SORT_OPTIONS: { value: string; labelKey: string; label: string }[] = [
  { value: 'createdAt,desc', labelKey: 'property.search.sort.newest', label: 'Newest' },
  { value: 'price,asc', labelKey: 'property.search.sort.priceAsc', label: 'Price: low to high' },
  { value: 'price,desc', labelKey: 'property.search.sort.priceDesc', label: 'Price: high to low' },
  { value: 'viewCount,desc', labelKey: 'property.search.sort.popular', label: 'Most popular' },
  { value: 'surface,desc', labelKey: 'property.search.sort.surface', label: 'Largest surface' },
];

/**
 * Convertit les query params de l'URL en SearchFilters typés.
 */
const parseFiltersFromParams = (searchParams: URLSearchParams): SearchFilters => {
  const getNumber = (key: string) => {
    const value = searchParams.get(key);
    const parsed = value ? parseInt(value, 10) : NaN;
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  return {
    city: searchParams.get('city') || undefined,
    type: (searchParams.get('type') as any) || undefined,
    propertyType: (searchParams.get('propertyType') as any) || undefined,
    category: (searchParams.get('category') as any) || undefined,
    ownerId: getNumber('ownerId'),
    minPrice: getNumber('minPrice'),
    maxPrice: getNumber('maxPrice'),
    minRooms: getNumber('minRooms') ?? getNumber('bedrooms'),
    maxRooms: getNumber('maxRooms'),
    minSurface: getNumber('minSurface'),
    maxSurface: getNumber('maxSurface'),
    keyword: searchParams.get('keyword') || undefined,
    furnished: searchParams.get('furnished') === 'true',
    hasParking: searchParams.get('hasParking') === 'true',
    hasPool: searchParams.get('hasPool') === 'true',
    hasElevator: searchParams.get('hasElevator') === 'true',
    hasAirConditioning: searchParams.get('hasAirConditioning') === 'true',
    hasInternet: searchParams.get('hasInternet') === 'true',
    hasSecurity: searchParams.get('hasSecurity') === 'true',
    hasBalcony: searchParams.get('hasBalcony') === 'true',
    gardenView: searchParams.get('gardenView') === 'true',
    petAllowed: searchParams.get('petAllowed') === 'true',
    cityCenter: searchParams.get('cityCenter') === 'true',
    nearSchool: searchParams.get('nearSchool') === 'true',
    nearUniversity: searchParams.get('nearUniversity') === 'true',
    nearMosque: searchParams.get('nearMosque') === 'true',
    nearHospital: searchParams.get('nearHospital') === 'true',
    nearMarket: searchParams.get('nearMarket') === 'true',
    nearTram: searchParams.get('nearTram') === 'true',
    nearBus: searchParams.get('nearBus') === 'true',
    nearTrainStation: searchParams.get('nearTrainStation') === 'true',
    page: getNumber('page') ?? DEFAULT_PAGE,
    size: getNumber('size') ?? DEFAULT_SIZE,
    sort: searchParams.get('sort') || undefined,
  };
};

/**
 * Convertit les filtres en query params, en ignorant les valeurs vides.
 */
const buildSearchParams = (filters: SearchFilters): URLSearchParams => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === '' || value === null || value === false) return;
    params.set(key, String(value));
  });
  return params;
};

export const Search: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState<PaginatedResponse<Property> | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filters = useMemo(() => parseFiltersFromParams(searchParams), [searchParams]);

  useEffect(() => {
    let cancelled = false;
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await propertyApi.search(filters);
        if (!cancelled) {
          setResult(response.data);
          setProperties(response.data?.content || []);
        }
      } catch (e: any) {
        if (!cancelled) {
          if (import.meta.env.DEV) {
            console.error('Search failed', e);
          }
          setError(e?.response?.data?.message || t('property.search.error', 'Failed to load results'));
          setResult(null);
          setProperties([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchResults();
    return () => { cancelled = true; };
  }, [searchParams, t]);

  const handleFilterChange = (newFilters: SearchFilters) => {
    // Reset pagination when filters change
    const resetPagination = { ...newFilters, page: DEFAULT_PAGE };
    setSearchParams(buildSearchParams(resetPagination), { replace: true });
  };

  const handleSortChange = (sort: string) => {
    const next = { ...filters, sort, page: DEFAULT_PAGE };
    if (!sort) delete (next as any).sort;
    setSearchParams(buildSearchParams(next), { replace: true });
  };

  const handlePageChange = (page: number) => {
    const next = { ...filters, page };
    setSearchParams(buildSearchParams(next), { replace: true });
  };

  const handleReset = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const activeFilterEntries = Object.entries(filters).filter(([key, value]) => {
    if (key === 'page' || key === 'size' || key === 'sort') return false;
    if (value === undefined || value === '' || value === null || value === false) return false;
    return true;
  });

  const totalElements = result?.totalElements ?? 0;
  const totalPages = result?.totalPages ?? 0;
  const currentPage = result?.number ?? filters.page ?? DEFAULT_PAGE;
  const hasNext = currentPage < totalPages - 1;
  const hasPrev = currentPage > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex items-center gap-4">
          <Link
            to="/home"
            className="flex items-center gap-2 text-slate-600 hover:text-morocco-royal transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-50">
              {t('property.search.title', 'Search properties')}
            </h1>
            {!loading && !error && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('property.search.resultCount', '{{count}} result', { count: totalElements })}
              </p>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2">
              <ArrowUpDown size={16} className="text-slate-500" />
              <select
                value={filters.sort || ''}
                onChange={(e) => handleSortChange(e.target.value)}
                className="text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500"
                aria-label={t('property.search.sortBy', 'Sort by')}
              >
                <option value="">{t('property.search.sort.relevance', 'Relevance')}</option>
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {t(opt.labelKey, opt.label)}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <SlidersHorizontal size={16} />
              {t('property.search.filters', 'Filters')}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Active filters */}
        {activeFilterEntries.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {activeFilterEntries.map(([key, value]) => (
              <span
                key={key}
                className="inline-flex items-center gap-1 rounded-full bg-teal-50 dark:bg-teal-900/20 px-3 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300"
              >
                {t(`property.search.${key}`, key)}: {String(value)}
              </span>
            ))}
            <button
              onClick={handleReset}
              className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline"
            >
              {t('property.search.clear', 'Clear filters')}
            </button>
          </div>
        )}

        {error ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <AlertCircle size={64} className="text-red-400 mb-4" />
            <p className="text-xl font-semibold text-slate-900 dark:text-slate-50">
              {t('property.search.errorTitle', 'Search error')}
            </p>
            <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-md">{error}</p>
            <button
              onClick={() => setSearchParams(searchParams, { replace: true })}
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 transition"
            >
              <RotateCcw size={18} />
              {t('common.retry', 'Retry')}
            </button>
          </div>
        ) : loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="premium-card">
                <div className="h-64 bg-gray-200 dark:bg-slate-700 animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-1/2" />
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Home size={64} className="text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-xl font-semibold text-slate-900 dark:text-slate-50">
              {t('home.filter.noResults', 'No properties found')}
            </p>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              {t('home.filter.noResultsMessage', 'Try adjusting your filters')}
            </p>
            <button
              onClick={handleReset}
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 transition"
            >
              <SearchIcon size={18} />
              {t('property.search.clear', 'Clear filters')}
            </button>
          </div>
        ) : (
          <>
            <motion.div
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  id={property.id}
                  title={property.title}
                  location={`${property.city}${property.address ? `, ${property.address}` : ''}`}
                  price={property.price}
                  pricePerMeter={property.pricePerSquareMeter}
                  imageUrl={property.images?.[0]}
                  beds={property.bedrooms}
                  baths={property.bathrooms}
                  surface={property.surface}
                  type={property.type}
                  isFeatured={property.isFeatured}
                  isNew={property.isNew}
                />
              ))}
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!hasPrev}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <ChevronLeft size={16} />
                  {t('common.previous', 'Previous')}
                </button>
                <span className="text-sm text-slate-600 dark:text-slate-300 px-3">
                  {t('pagination.page', 'Page {{page}} of {{total}}', { page: currentPage + 1, total: totalPages })}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!hasNext}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {t('common.next', 'Next')}
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <AdvancedFilterPanel
        filters={filters}
        onChange={handleFilterChange}
        onApply={() => setShowFilters(false)}
        onReset={handleReset}
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
      />
    </div>
  );
};
