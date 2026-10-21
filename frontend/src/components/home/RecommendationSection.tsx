import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Sparkles, MapPin, Star, ArrowRight, RotateCcw } from 'lucide-react';
import { useRecommendations } from '../../hooks/useRecommendations';
import { useAuth } from '../../context/AuthContext';
import { fixImageUrl } from '../../utils/imageUtils';
import { useRecommendationTracking } from '../../hooks/useBehavioralTracking';
import { SafeImage } from '../common/SafeImage';
import { safeParseId } from '../../utils/validation';

const cardMotion = {
  initial: { opacity: 0.01, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    maximumFractionDigits: 0,
  }).format(price || 0);

const getRecTypeLabel = (type: string | undefined, t: any) => {
  switch (type) {
    case 'COLLABORATIVE': return t('rec.collaborative', 'Similaire');
    case 'CONTENT_BASED': return t('rec.content', 'Vos critères');
    case 'TRENDING': return t('rec.trending', 'Tendance');
    case 'GEO': return t('rec.geo', 'Proche');
    case 'TRUST': return t('rec.trust', 'Confiance');
    case 'DISCOVER': return t('rec.discover', 'Découverte');
    case 'RECENT': return t('rec.recent', 'Nouveau');
    case 'EXPLORE': return t('rec.explore', 'Explorer');
    default: return t('rec.hybrid', 'Recommandé');
  }
};

export const RecommendationSection: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { data: recommendations, isLoading, error } = useRecommendations(6);
  const { trackImpression, trackClick } = useRecommendationTracking();
  const sectionRef = useRef<HTMLElement>(null);
  const trackedRef = useRef(false);

  const sectionTitle = isAuthenticated
    ? t('recommendations.title', 'Recommandations personnalisées')
    : t('recommendations.discoverTitle', 'Découvrez nos biens');

  const sectionSubtitle = isAuthenticated
    ? t('recommendations.subtitle', 'Pour vous')
    : t('recommendations.discoverSubtitle', 'Sélectionnés pour vous');

  // Track impressions when section comes into view
  useEffect(() => {
    if (!recommendations || recommendations.length === 0 || trackedRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !trackedRef.current) {
          trackedRef.current = true;
          trackImpression(
            recommendations.map((p, i) => ({
              propertyId: Number(p.id),
              recommendationType: p.recommendationType,
              matchScore: p.matchScore,
              position: i,
            }))
          );
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [recommendations, trackImpression]);

  if (error) {
    return (
      <section ref={sectionRef} className="py-16 bg-gradient-to-b from-amber-50/40 to-white dark:from-slate-900/40 dark:to-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0.01, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            className="mb-10 flex items-end justify-between"
          >
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-500">
                {sectionSubtitle}
              </p>
              <h2 className="mt-2 text-3xl font-black text-slate-900 dark:text-slate-50 md:text-4xl">
                {sectionTitle}
              </h2>
            </div>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="premium-card">
                <div className="h-56 bg-gray-200 dark:bg-slate-700 animate-pulse rounded-t-2xl" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <p className="text-slate-600 dark:text-slate-400 mb-4">{t('recommendations.error')}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 transition"
            >
              <RotateCcw size={16} />
              {t('recommendations.retry')}
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!isLoading && (!recommendations || recommendations.length === 0)) {
    return (
      <section ref={sectionRef} className="py-16 bg-gradient-to-b from-amber-50/40 to-white dark:from-slate-900/40 dark:to-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0.01, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            className="mb-10 flex items-end justify-between"
          >
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-500">
                {sectionSubtitle}
              </p>
              <h2 className="mt-2 text-3xl font-black text-slate-900 dark:text-slate-50 md:text-4xl">
                {sectionTitle}
              </h2>
            </div>
          </motion.div>
          <div className="text-center py-12">
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-4">
              {t('recommendations.empty')}
            </p>
            <Link
              to="/search"
              className="inline-flex items-center gap-2 text-teal-600 font-semibold hover:text-teal-700 transition"
            >
              {t('empty.action.browse')} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="py-16 bg-gradient-to-b from-amber-50/40 to-white dark:from-slate-900/40 dark:to-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0.01, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          className="mb-10 flex items-end justify-between"
        >
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-500">
              {sectionSubtitle}
            </p>
            <h2 className="mt-2 text-3xl font-black text-slate-900 dark:text-slate-50 md:text-4xl">
              {sectionTitle}
            </h2>
          </div>
          <Link
            to="/search"
            className="hidden items-center gap-1 text-sm font-black text-teal-600 hover:text-teal-700 md:inline-flex"
          >
            {t('recommendations.seeAll')} <ArrowRight size={16} />
          </Link>
        </motion.div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="premium-card">
                <div className="h-56 bg-gray-200 dark:bg-slate-700 animate-pulse rounded-t-2xl" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
          >
            {recommendations?.map((property, index) => {
              const recId = safeParseId(property.id);
              const cardInner = (
                <div>
                  <div className="relative h-56 overflow-hidden rounded-t-2xl">
                    <SafeImage
                      src={property.images?.[0] ? fixImageUrl(property.images[0]) : '/images/no-image.svg'}
                      alt={property.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      fallbackSrc="/images/no-image.svg"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />

                    {/* Match score badge */}
                    <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-teal-600/90 px-3 py-1 text-xs font-black text-white shadow-soft backdrop-blur">
                      <Sparkles size={13} />
                      {Math.round(property.matchScore || 0)}% {t('rec.match', 'match')}
                    </div>

                    {/* Recommendation type badge */}
                    <div className="absolute right-4 top-4 rounded-full bg-white/90 dark:bg-slate-800/90 px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-soft backdrop-blur">
                      {getRecTypeLabel(property.recommendationType, t)}
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="line-clamp-1 text-lg font-black text-slate-900 dark:text-slate-50 transition group-hover:text-teal-600">
                      {property.title}
                    </h3>
                    <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                      <MapPin size={14} className="text-amber-500 shrink-0" />
                      <span className="truncate">{property.city}</span>
                    </p>

                    {/* Match reasons */}
                    {property.matchReasons && property.matchReasons.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {property.matchReasons.slice(0, 2).map((reason, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 rounded-full bg-teal-50 dark:bg-teal-900/30 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300"
                          >
                            <Star size={11} fill="currentColor" />
                            {reason}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex items-end justify-between border-t border-amber-400/15 dark:border-slate-700/50 pt-4">
                      <p className="text-xl font-black text-teal-600 dark:text-teal-400">
                        {formatPrice(property.price || 0)}
                      </p>
                      {property.distanceKm && (
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          {property.distanceKm.toFixed(1)} km
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );

              return (
                <motion.article
                  key={property.id}
                  variants={cardMotion}
                  transition={{ duration: 0.4, delay: index * 0.06 }}
                  className="premium-card group"
                >
                  {recId !== null ? (
                    <Link
                      to={`/property/${recId}`}
                      className="block h-full"
                      onClick={() =>
                        trackClick({
                          propertyId: Number(property.id),
                          recommendationType: property.recommendationType,
                          matchScore: property.matchScore,
                          position: index,
                        })
                      }
                    >
                      {cardInner}
                    </Link>
                  ) : (
                    <div className="block h-full">{cardInner}</div>
                  )}
                </motion.article>
              );
            })}
          </motion.div>
        )}
      </div>
    </section>
  );
};
