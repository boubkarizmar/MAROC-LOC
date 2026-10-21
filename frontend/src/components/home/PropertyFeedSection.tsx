import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter, Grid3X3, Search, ChevronLeft, ChevronRight,
  Heart, MapPin, Star, Bed, Bath, Maximize2, ArrowRight,
} from 'lucide-react';
import { useProperties } from '../../hooks/useProperties';
import { SectionError } from '../ux/SectionErrorBoundary';
import { PropertyFilter } from '../PropertyFilter';
import { fixImageUrl } from '../../utils/imageUtils';
import { SearchFilters } from '../../types';
import { favoriteApi } from '../../api/favoriteApi';
import { useAuth } from '../../context/AuthContext';
import { safeParseId } from '../../utils/validation';
import { SafeImage } from '../common/SafeImage';

const cardMotion = {
  initial: { opacity: 0.01, y: 24 },
  animate: { opacity: 1, y: 0 },
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    maximumFractionDigits: 0,
  }).format(price || 0);

const getFinalPrice = (property: any) =>
  property.price + (property.additionalFees || 0) - (property.price * (property.discountPercentage || 0)) / 100;

interface PropertyCardProps {
  property: any;
  index: number;
  layout: 'grid' | 'list';
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, index, layout }) => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [favorite, setFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const validPropertyId = safeParseId(property.id);

  // Check initial favorite status from API
  useEffect(() => {
    if (!isAuthenticated || validPropertyId === null) return;
    let cancelled = false;
    favoriteApi.check(validPropertyId)
      .then(res => { if (!cancelled) setFavorite(res.data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isAuthenticated, validPropertyId]);

  const price = getFinalPrice(property);
  const hasDiscount = Boolean(property.discountPercentage && property.discountPercentage > 0);
  const imageSrc = property.images?.[0] ? fixImageUrl(property.images[0]) : '/images/no-image.svg';
  const isNew = property.createdAt && (new Date().getTime() - new Date(property.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;

  const toggleFavorite = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isAuthenticated) {
      // Optionally redirect to login or show toast
      return;
    }
    if (favoriteLoading) return;
    setFavoriteLoading(true);
    try {
      if (validPropertyId === null) return;
      if (favorite) {
        await favoriteApi.remove(validPropertyId);
        setFavorite(false);
      } else {
        await favoriteApi.add(validPropertyId);
        setFavorite(true);
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Favorite toggle failed:', err);
      }
    } finally {
      setFavoriteLoading(false);
    }
  };

  const cardContent = (
    <div className="group block h-full">
      <div className={layout === 'list' ? 'relative h-64 overflow-hidden lg:h-full' : 'relative h-64 overflow-hidden'}>
        <SafeImage
          src={imageSrc}
          alt={property.title}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          fallbackSrc="/images/no-image.svg"
        />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />

          {/* Badges */}
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-teal-600/90 px-3 py-1 text-xs font-black text-white shadow-soft backdrop-blur">
              {String(t(`property.types.${property.type}`, property.type))}
            </span>
            {property.isVerified && (
              <span className="rounded-full bg-emerald-500/92 px-3 py-1 text-xs font-black text-white shadow-soft backdrop-blur">
                {t('property.verified', 'Vérifié')}
              </span>
            )}
            {isNew && (
              <span className="rounded-full bg-amber-400/92 px-3 py-1 text-xs font-black text-white shadow-soft backdrop-blur">
                {t('property.new', 'Nouveau')}
              </span>
            )}
          </div>

          {hasDiscount && (
            <span className="absolute bottom-4 left-4 rounded-full bg-red-500 px-3 py-1 text-xs font-black text-white shadow-soft">
              -{property.discountPercentage}%
            </span>
          )}

          <motion.button
            type="button"
            whileTap={{ scale: 0.85 }}
            onClick={toggleFavorite}
            disabled={favoriteLoading}
            className={`absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full shadow-soft backdrop-blur transition ${
              favorite ? 'bg-red-500 text-white' : 'bg-white/90 text-slate-900 dark:text-slate-50 hover:text-red-500'
            } ${favoriteLoading ? 'opacity-70 cursor-wait' : ''}`}
            aria-label={t('common.addToFavorites', 'Ajouter aux favoris')}
          >
            <Heart size={18} fill={favorite ? 'currentColor' : 'none'} />
          </motion.button>
      </div>

      <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-1 text-lg font-black text-slate-900 dark:text-slate-50 transition group-hover:text-teal-600">
                {property.title}
              </h3>
              <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-slate-500">
                <MapPin size={15} className="text-amber-500 shrink-0" />
                <span className="truncate">{property.city}{property.address ? `, ${property.address}` : ''}</span>
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50/60 px-2.5 py-1 text-xs font-black text-teal-600 shrink-0">
              <Star size={13} fill="currentColor" className="text-amber-500" />
              {(property as any).averageRating || '-'}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1 rounded-2xl bg-amber-50/40 px-3 py-2">
              <Bed size={15} className="text-teal-600" /> {property.rooms || 0}
            </span>
            <span className="inline-flex items-center gap-1 rounded-2xl bg-amber-50/40 px-3 py-2">
              <Bath size={15} className="text-teal-600" /> {property.bathrooms || 0}
            </span>
            <span className="inline-flex items-center gap-1 rounded-2xl bg-amber-50/40 px-3 py-2">
              <Maximize2 size={15} className="text-teal-600" /> {property.surface || 0}m²
            </span>
          </div>

          <div className="mt-5 flex items-end justify-between border-t border-amber-400/15 pt-4">
            <div>
              <p className="text-2xl font-black text-teal-600">{formatPrice(price)}</p>
              {property.type === 'RENT' && (
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-500">{t('common.perMonth', 'par mois')}</p>
              )}
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-black text-teal-600">
              {t('common.viewDetails', 'Voir détails')} <ArrowRight size={16} className="rtl-flip" />
            </span>
          </div>
        </div>
    </div>
  );

  return (
    <motion.article
      layout
      variants={cardMotion}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.45, delay: index * 0.04 }}
      className={layout === 'list' ? 'premium-card lg:grid lg:grid-cols-[320px_1fr]' : 'premium-card'}
    >
      {validPropertyId !== null ? (
        <Link to={`/property/${validPropertyId}`} className="group block h-full">
          {cardContent}
        </Link>
      ) : (
        cardContent
      )}
    </motion.article>
  );
};

const sortOptions = [
  { value: 'createdAt,desc', label: 'Nouveauté' },
  { value: 'price,asc', label: 'Prix ↑' },
  { value: 'price,desc', label: 'Prix ↓' },
  { value: 'surface,desc', label: 'Surface' },
  { value: 'finalScore,desc', label: 'Score' },
];

interface PropertyFeedSectionProps {
  initialFilters?: SearchFilters;
}

export const PropertyFeedSection: React.FC<PropertyFeedSectionProps> = ({ initialFilters }) => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState('createdAt,desc');
  const [filters, setFilters] = useState<SearchFilters>(initialFilters || {});

  // Sync with hero search filters when they change
  React.useEffect(() => {
    if (initialFilters && Object.keys(initialFilters).length > 0) {
      setFilters((prev) => ({ ...prev, ...initialFilters }));
      setCurrentPage(0);
    }
  }, [initialFilters]);

  const { data, isLoading, error, refetch } = useProperties({
    filters,
    page: currentPage,
    size: viewMode === 'grid' ? 9 : 6,
    sort,
  });

  const properties = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;

  const handleFilterChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    setCurrentPage(0);
  };

  const handleSortChange = (value: string) => {
    setSort(value);
    setCurrentPage(0);
  };

  if (error) {
    return (
      <section id="properties" className="scroll-mt-28 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionError onRetry={() => refetch()} />
        </div>
      </section>
    );
  }

  return (
    <section id="properties" className="scroll-mt-28 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-500">
                {t('feed.subtitle', 'Marketplace')}
              </p>
              <h2 className="mt-2 text-3xl font-black text-slate-900 dark:text-slate-50 md:text-5xl">
                {totalElements} {t('feed.title', 'biens disponibles')}
              </h2>
              <p className="mt-3 max-w-2xl text-slate-600">
                {t('feed.description', 'Sélection responsive avec filtres, cartes rapides et informations essentielles pour comparer sans friction.')}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Sort */}
              <select
                value={sort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="luxury-input h-11 text-sm"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              <button
                onClick={() => setShowFilters((v) => !v)}
                className={showFilters ? 'btn-primary' : 'btn-secondary'}
                aria-expanded={showFilters}
              >
                <Filter size={17} />
                {t('property.search.filters', 'Filtres')}
              </button>

              <div className="flex rounded-full border border-amber-400/20 bg-white dark:bg-slate-800 p-1 shadow-soft">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`grid h-11 w-11 place-items-center rounded-full ${viewMode === 'grid' ? 'bg-teal-600 text-white' : 'text-slate-500'}`}
                  aria-label="Vue grille"
                >
                  <Grid3X3 size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`grid h-11 w-11 place-items-center rounded-full ${viewMode === 'list' ? 'bg-teal-600 text-white' : 'text-slate-500'}`}
                  aria-label="Vue liste"
                >
                  <Search size={18} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0.01 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0.01 }}
              className="mb-8 overflow-hidden"
            >
              <PropertyFilter onFilterChange={handleFilterChange} isLoading={isLoading} />
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className={viewMode === 'grid' ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3' : 'grid gap-6'}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="premium-card">
                <div className="h-64 bg-gray-200 animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-8 bg-gray-200 rounded animate-pulse" />
                    <div className="h-8 bg-gray-200 rounded animate-pulse" />
                    <div className="h-8 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg font-semibold text-gray-900">{t('feed.noResults', 'Aucun bien trouvé')}</p>
            <p className="mt-2 text-gray-600">{t('feed.tryDifferent', 'Essayez d\'autres critères de recherche.')}</p>
          </div>
        ) : (
          <>
            <motion.div
              className={viewMode === 'grid' ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3' : 'grid gap-6'}
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.04 } },
              }}
            >
              <AnimatePresence mode="popLayout">
                {properties.map((property, index) => (
                  <PropertyCard key={property.id} property={property} index={index} layout={viewMode} />
                ))}
              </AnimatePresence>
            </motion.div>

            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-3">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="btn-secondary h-12 w-12 p-0"
                  aria-label={t('common.previous', 'Précédent')}
                >
                  <ChevronLeft size={18} className="rtl-flip" />
                </button>
                <span className="rounded-full bg-white dark:bg-slate-800 px-5 py-3 text-sm font-black text-slate-900 dark:text-slate-50 shadow-soft">
                  {currentPage + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="btn-secondary h-12 w-12 p-0"
                  aria-label={t('common.next', 'Suivant')}
                >
                  <ChevronRight size={18} className="rtl-flip" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};
