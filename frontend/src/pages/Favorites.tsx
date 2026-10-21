import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { favoriteApi } from '../api/favoriteApi';
import { propertyApi } from '../api/propertyApi';
import { Property } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, Heart, Trash2, MapPin, Bed, Bath, Square,
  Eye, AlertCircle, Sparkles
} from 'lucide-react';
import { fixMediaUrl } from '../utils/imageUtils';
import { EmptyState, FavoritesEmptyState } from '../components/ux/EmptyState';
import { PropertyCardSkeleton } from '../components/ux/PremiumLoading';
import { VerificationBadge } from '../components/ux/TrustIndicators';
import { ScrollReveal, StaggerReveal } from '../components/ux/EmotionalDesign';
import { useToast } from '../components/ui/Toast';

const Favorites: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadFavorites();
  }, [isAuthenticated]);

  const loadFavorites = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await favoriteApi.getAll();
      setFavorites(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error('Failed to load favorites', err);
      }
      setError(err.response?.data?.message || t('favorites.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (propertyId: number) => {
    setRemovingId(propertyId);
    try {
      await favoriteApi.remove(propertyId);
      setFavorites((prev) => prev.filter((f) => f.id !== propertyId));
      showToast(t('property.removeFromFavorites'), 'info');
    } catch (err) {
      showToast(t('common.error'), 'error');
    } finally {
      setRemovingId(null);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(price);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <ScrollReveal>
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition"
          >
            <ArrowLeft size={16} /> {t('common.back')}
          </button>
        </ScrollReveal>

        <ScrollReveal>
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                <Heart size={20} className="text-red-500" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50">{t('favorites.title')}</h1>
                <p className="mt-1 text-slate-500">
                  {t('favorites.count', { count: favorites.length })}
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {loading ? (
          <PropertyCardSkeleton count={3} />
        ) : error ? (
          <EmptyState
            variant="generic"
            title={t('favorites.loadErrorTitle')}
            description={error}
            actionLabel={t('common.retry')}
            onAction={loadFavorites}
          />
        ) : favorites.length === 0 ? (
          <FavoritesEmptyState onBrowse={() => navigate('/home')} />
        ) : (
          <StaggerReveal className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((property, index) => (
              <motion.div
                key={property.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="group relative overflow-hidden rounded-2xl bg-white shadow-lg transition hover:shadow-xl"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={property.images && property.images.length > 0 ? fixMediaUrl(property.images[0]) : '/images/no-image.svg'}
                    alt={property.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Badges */}
                  <div className="absolute left-3 top-3 flex gap-2">
                    <span className="rounded-full bg-teal-600 px-3 py-1 text-xs font-bold text-white">
                      {property.type === 'RENT' ? t('property.types.RENT') : t('property.types.BUY')}
                    </span>
                    {property.isVerified && <VerificationBadge level="verified" size="sm" />}
                  </div>

                  {/* Remove button */}
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={(e) => { e.stopPropagation(); handleRemove(property.id); }}
                    disabled={removingId === property.id}
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-red-500 shadow-sm transition hover:bg-red-50 disabled:opacity-50"
                  >
                    {removingId === property.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </motion.button>

                  {/* Price overlay */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-2xl font-black text-white drop-shadow-lg">
                      {formatPrice(property.price)}
                    </p>
                    {property.type === 'RENT' && (
                      <p className="text-sm text-white/80">/{t('plan.month')}</p>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3
                    className="mb-2 cursor-pointer text-lg font-bold text-slate-900 dark:text-slate-50 line-clamp-1 hover:text-teal-600 transition"
                    onClick={() => navigate(`/property/${property.id}`)}
                  >
                    {property.title}
                  </h3>

                  <div className="mb-3 flex items-center gap-1 text-sm text-slate-500">
                    <MapPin size={14} />
                    <span className="truncate">{property.city}</span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    {property.rooms && (
                      <div className="flex items-center gap-1">
                        <Bed size={14} className="text-amber-500" />
                        <span>{property.rooms}</span>
                      </div>
                    )}
                    {property.bathrooms && (
                      <div className="flex items-center gap-1">
                        <Bath size={14} className="text-amber-500" />
                        <span>{property.bathrooms}</span>
                      </div>
                    )}
                    {property.surface && (
                      <div className="flex items-center gap-1">
                        <Square size={14} className="text-amber-500" />
                        <span>{property.surface} m²</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => navigate(`/property/${property.id}`)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-50 transition hover:bg-teal-600 hover:text-white"
                  >
                    <Eye size={16} /> {t('favorites.viewDetail')}
                  </button>
                </div>
              </motion.div>
            ))}
          </StaggerReveal>
        )}
      </div>
    </div>
  );
};

export default Favorites;
