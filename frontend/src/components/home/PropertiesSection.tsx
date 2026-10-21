import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Crown,
  Sparkles,
  Clock,
  ArrowRight,
  Flame,
  MessageSquare,
  BarChart3,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { useActiveAds } from '../../hooks/useHomepageData';
import {
  useRecommendations,
  useTrendingProperties,
} from '../../hooks/useRecommendations';
import { recommendationToProperty } from '../../utils/recommendationMapper';
import { useProperties } from '../../hooks/useProperties';
import { usePropertyComparison } from '../../hooks/usePropertyComparison';
import { PropertyCard } from '../PropertyCard';
import { SafeImage } from '../common/SafeImage';
import { Skeleton } from '../ui/Skeleton';
import { favoriteApi } from '../../api/favoriteApi';
import { useAuth } from '../../context/AuthContext';
import { fixImageUrl } from '../../utils/imageUtils';
import { safeParseId } from '../../utils/validation';
import { Property } from '../../types';
import { ActiveAd } from '../../hooks/useHomepageData';

const containerVariants = {
  hidden: { opacity: 0.01 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0.01, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

const SectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}> = ({ icon, title, subtitle, action }) => (
  <motion.div
    className="mb-6 flex items-center justify-between flex-wrap gap-3"
    initial={{ opacity: 0.01, y: 12 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
  >
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gold-500/10 dark:bg-gold-500/10 text-gold-600 dark:text-gold-400">
        {icon}
      </div>
      <div>
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
    </div>
    {action}
  </motion.div>
);

const SectionError: React.FC<{ onRetry: () => void }> = ({ onRetry }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle size={40} className="text-red-400 mb-3" />
      <p className="text-slate-700 dark:text-slate-200 font-medium">
        {t('home.properties.error', 'Unable to load properties')}
      </p>
      <button
        onClick={onRetry}
        className="mt-3 inline-flex items-center gap-1.5 text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-semibold"
      >
        <RotateCcw size={14} />
        {t('common.retry', 'Retry')}
      </button>
    </div>
  );
};

const PropertyCardSkeleton: React.FC = () => (
  <div className="bg-[color:var(--color-surface)] rounded-xl border border-[color:var(--color-border)] overflow-hidden">
    <Skeleton width="100%" height={192} className="rounded-none" />
    <div className="p-4 space-y-3">
      <Skeleton width="75%" height={18} />
      <Skeleton width="50%" height={14} />
      <div className="flex gap-2 pt-1">
        <Skeleton width={60} height={20} />
        <Skeleton width={60} height={20} />
      </div>
    </div>
  </div>
);

const SponsoredCard: React.FC<{
  ad: ActiveAd;
}> = ({ ad }) => {
  const { t } = useTranslation();
  const validId = ad.propertyId ? safeParseId(ad.propertyId) : null;

  const cardBody = (
    <div className="group block h-full">
      <div className="relative h-48 overflow-hidden">
        <SafeImage
          src={ad.imageUrl ? fixImageUrl(ad.imageUrl) : ''}
          alt={ad.title}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          fallbackSrc="/images/no-image.svg"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
            <Crown size={10} aria-hidden="true" />
            {t('home.properties.sponsored', 'Sponsorisé')}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-h5 text-[color:var(--color-text-primary)] line-clamp-1 font-semibold">
          {ad.title}
        </h3>
        <p className="mt-2 text-sm text-[color:var(--color-text-secondary)] line-clamp-2">
          {ad.description}
        </p>
        {ad.budget > 0 && (
          <p className="mt-3 text-lg font-bold text-primary-600 dark:text-primary-400">
            {new Intl.NumberFormat('fr-MA', {
              style: 'currency',
              currency: 'MAD',
              maximumFractionDigits: 0,
            }).format(ad.budget)}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <motion.div variants={itemVariants}>
      {validId !== null ? (
        <Link to={`/property/${validId}`} className="block">
          <div className="bg-[color:var(--color-surface)] rounded-xl border border-[color:var(--color-border)] shadow-md hover:shadow-lg transition-shadow overflow-hidden cursor-pointer">
            {cardBody}
          </div>
        </Link>
      ) : (
        <div className="bg-[color:var(--color-surface)] rounded-xl border border-[color:var(--color-border)] shadow-md overflow-hidden">
          {cardBody}
        </div>
      )}
    </motion.div>
  );
};

const FavoritePropertyCard: React.FC<{
  property: Property;
  badge?: string;
}> = ({ property, badge }) => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const {
    isInCompare,
    canAddMore,
    addToCompare,
    removeFromCompare,
  } = usePropertyComparison();

  const inCompare = isInCompare(property.id);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    favoriteApi
      .check(property.id)
      .then((res) => {
        if (!cancelled) setIsFavorite(res.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, property.id]);

  const toggleFavorite = useCallback(
    async (_id: number) => {
      if (!isAuthenticated || favoriteLoading) return;
      setFavoriteLoading(true);
      try {
        if (isFavorite) {
          await favoriteApi.remove(property.id);
          setIsFavorite(false);
        } else {
          await favoriteApi.add(property.id);
          setIsFavorite(true);
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('Favorite toggle failed:', err);
        }
      } finally {
        setFavoriteLoading(false);
      }
    },
    [isAuthenticated, favoriteLoading, isFavorite, property.id]
  );

  const toggleCompare = useCallback(
    (_id: number) => {
      if (inCompare) {
        removeFromCompare(property.id);
      } else if (canAddMore) {
        addToCompare(property);
      }
    },
    [inCompare, canAddMore, property, addToCompare, removeFromCompare]
  );

  const handleContact = useCallback(() => {
    if (property.whatsappNumber) {
      const num = property.whatsappNumber.replace(/\s/g, '').replace(/^0/, '+212');
      window.open(`https://wa.me/${num}`, '_blank', 'noopener,noreferrer');
    } else if (property.phoneNumber) {
      window.location.href = `tel:${property.phoneNumber}`;
    }
  }, [property.whatsappNumber, property.phoneNumber]);

  const aiScore = (property as any).finalScore;

  return (
    <motion.div variants={itemVariants} className="relative flex flex-col gap-2">
      <PropertyCard
        id={property.id}
        title={property.title}
        location={property.city}
        price={property.price}
        pricePerMeter={property.pricePerSquareMeter}
        imageUrl={property.images?.[0]}
        beds={property.bedrooms}
        baths={property.bathrooms}
        surface={property.surface}
        type={property.type}
        isNew={
          property.createdAt &&
          new Date().getTime() - new Date(property.createdAt).getTime() <
            7 * 24 * 60 * 60 * 1000
        }
        isFavorite={isFavorite}
        isInCompare={inCompare}
        canAddCompare={canAddMore || inCompare}
        onFavoriteToggle={toggleFavorite}
        onCompareToggle={toggleCompare}
        ownerName={property.ownerName}
        aiScore={aiScore}
        badge={badge}
      />
      {/* Contact button */}
      {(property.whatsappNumber || property.phoneNumber) && (
        <button
          onClick={handleContact}
          className="w-full py-2 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:border-teal-300 dark:hover:border-teal-600 hover:text-teal-700 dark:hover:text-teal-300 transition-colors flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
          aria-label={t('property.contactOwner', 'Contacter le propriétaire')}
        >
          <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
          {t('property.contact', 'Contacter')}
        </button>
      )}
    </motion.div>
  );
};

export const PropertiesSection: React.FC = () => {
  const { t } = useTranslation();

  const { data: activeAds, isLoading: adsLoading } = useActiveAds();
  const {
    data: recommendedItems,
    isLoading: rankedLoading,
    error: recommendedError,
    refetch: refetchRecommended,
  } = useRecommendations(8);
  const {
    data: trendingItems,
    isLoading: popularLoading,
    error: popularError,
    refetch: refetchPopular,
  } = useTrendingProperties('week', 8);
  const {
    data: recentProperties,
    isLoading: recentLoading,
    error: recentError,
    refetch: refetchRecent,
  } = useProperties({
    sort: 'createdAt,desc',
    size: 8,
  });

  const premiumAds = (activeAds || [])
    .filter((ad) => ad.plan === 'PREMIUM')
    .slice(0, 4);
  const standardAds = (activeAds || [])
    .filter((ad) => ad.plan === 'STANDARD')
    .slice(0, 4);

  const recommended = (recommendedItems || [])
    .map(recommendationToProperty)
    .slice(0, 6);
  const popular = (trendingItems || [])
    .map(recommendationToProperty)
    .slice(0, 6);
  const recent = (recentProperties?.content || []).slice(0, 8);

  const gridClasses =
    'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';

  const sectionAction = (to: string, label: string) => (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-lg px-2 py-1"
    >
      {label}
      <ArrowRight size={16} aria-hidden="true" />
    </Link>
  );

  return (
    <section
      className="py-16 bg-[color:var(--color-bg)]"
      aria-labelledby="properties-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Hidden heading for aria */}
        <h2 id="properties-heading" className="sr-only">
          {t('home.properties.title', 'Propriétés')}
        </h2>

        {/* Sponsored Premium */}
        {premiumAds.length > 0 && (
          <div role="region" aria-label={t('home.properties.sponsoredPremium', 'Annonces sponsorisées premium')}>
            <SectionHeader
              icon={<Crown className="w-5 h-5" aria-hidden="true" />}
              title={t('home.properties.sponsored', 'Sponsorisé')}
              subtitle={t('ads.promotedSubtitle', 'Placements premium sélectionnés')}
              action={sectionAction('/search', t('home.properties.seeAll', 'Voir tout'))}
            />
            {adsLoading ? (
              <div className={gridClasses}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <PropertyCardSkeleton key={`premium-skel-${i}`} />
                ))}
              </div>
            ) : (
              <motion.div
                className={gridClasses}
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
              >
                {premiumAds.map((ad) => (
                  <SponsoredCard key={ad.id} ad={ad} />
                ))}
              </motion.div>
            )}
          </div>
        )}

        {/* Sponsored Standard */}
        {standardAds.length > 0 && (
          <div role="region" aria-label={t('home.properties.sponsoredStandard', 'Annonces partenaires')}>
            <SectionHeader
              icon={<Sparkles className="w-5 h-5" aria-hidden="true" />}
              title={t('ads.title', 'Annonces partenaires')}
              action={sectionAction('/search', t('home.properties.seeAll', 'Voir tout'))}
            />
            {adsLoading ? (
              <div className={gridClasses}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <PropertyCardSkeleton key={`std-skel-${i}`} />
                ))}
              </div>
            ) : (
              <motion.div
                className={gridClasses}
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
              >
                {standardAds.map((ad) => (
                  <SponsoredCard key={ad.id} ad={ad} />
                ))}
              </motion.div>
            )}
          </div>
        )}

        {/* Recommended */}
        <div role="region" aria-label={t('home.properties.recommended', 'Recommandations')}>
          <SectionHeader
            icon={<Sparkles className="w-5 h-5" aria-hidden="true" />}
            title={t('home.properties.recommended', 'Recommandé')}
            subtitle={t('recommendations.discoverSubtitle', 'Sélectionnés pour vous')}
            action={sectionAction('/search', t('home.properties.seeAllRecommended', 'Voir tous les recommandés'))}
          />
          {rankedLoading ? (
            <div className={gridClasses}>
              {Array.from({ length: 4 }).map((_, i) => (
                <PropertyCardSkeleton key={`rec-skel-${i}`} />
              ))}
            </div>
          ) : recommendedError ? (
            <SectionError onRetry={refetchRecommended} />
          ) : recommended.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-400 py-8">
              {t('recommendations.empty', 'Aucune recommandation pour le moment')}
            </p>
          ) : (
            <motion.div
              className={gridClasses}
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
            >
              {recommended.map((property) => (
                <FavoritePropertyCard
                  key={property.id}
                  property={property}
                  badge={t('home.properties.recommended', 'Recommandé')}
                />
              ))}
            </motion.div>
          )}
        </div>

        {/* Popular */}
        <div role="region" aria-label={t('home.properties.popular', 'Les plus populaires')}>
          <SectionHeader
            icon={<Flame className="w-5 h-5" aria-hidden="true" />}
            title={t('home.properties.popular', 'Populaire')}
            subtitle={t('home.properties.popularSubtitle', 'Les biens les plus consultés')}
            action={sectionAction('/search?sort=viewCount,desc', t('home.properties.seeAllPopular', 'Voir les plus populaires'))}
          />
          {popularLoading ? (
            <div className={gridClasses}>
              {Array.from({ length: 4 }).map((_, i) => (
                <PropertyCardSkeleton key={`pop-skel-${i}`} />
              ))}
            </div>
          ) : popularError ? (
            <SectionError onRetry={refetchPopular} />
          ) : popular.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-400 py-8">
              {t('home.properties.popularEmpty', 'Aucun bien populaire pour le moment')}
            </p>
          ) : (
            <motion.div
              className={gridClasses}
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
            >
              {popular.map((property) => (
                <FavoritePropertyCard
                  key={property.id}
                  property={property}
                  badge={t('home.properties.popular', 'Populaire')}
                />
              ))}
            </motion.div>
          )}
        </div>

        {/* Recent */}
        <div role="region" aria-label={t('home.properties.recent', 'Nouveautés')}>
          <SectionHeader
            icon={<Clock className="w-5 h-5" aria-hidden="true" />}
            title={t('home.properties.recent', 'Récent')}
            subtitle={t('property.new', 'Nouveau')}
            action={sectionAction('/search?sort=createdAt,desc', t('home.properties.seeAllRecent', 'Voir tous les récents'))}
          />
          {recentLoading ? (
            <div className={gridClasses}>
              {Array.from({ length: 4 }).map((_, i) => (
                <PropertyCardSkeleton key={`recent-skel-${i}`} />
              ))}
            </div>
          ) : recentError ? (
            <SectionError onRetry={refetchRecent} />
          ) : recent.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-400 py-8">
              {t('home.properties.empty', 'Aucun bien trouvé')}
            </p>
          ) : (
            <motion.div
              className={gridClasses}
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
            >
              {recent.map((property) => (
                <FavoritePropertyCard key={property.id} property={property} />
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};
