import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Star, TrendingUp, MapPin, Heart, Bed, Bath, Maximize2 } from 'lucide-react';
import { useTopRanked } from '../../hooks/useTopRanked';
import { SectionError } from '../ux/SectionErrorBoundary';
import { ScoreMeter } from './ScoreMeter';
import { fixImageUrl } from '../../utils/imageUtils';

const containerVariants = {
  hidden: { opacity: 0.01 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0.01, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const rankColors: Record<number, string> = {
  1: 'bg-gradient-to-br from-gold-400 to-gold-600 text-white',
  2: 'bg-gradient-to-br from-gray-300 to-gray-400 text-white',
  3: 'bg-gradient-to-br from-terracotta-400 to-terracotta-600 text-white',
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    maximumFractionDigits: 0,
  }).format(price || 0);

export const TopRankedSection: React.FC = () => {
  const { t } = useTranslation();
  const { data: properties, isLoading, error, refetch } = useTopRanked(6);

  if (error) {
    return (
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionError onRetry={() => refetch()} />
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-96 rounded-2xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!properties || properties.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-white/78 dark:bg-slate-800/78 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0.01, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          className="mb-10"
        >
          <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-500">
            {t('topRanked.subtitle', 'Classement')}
          </p>
          <h2 className="mt-2 text-3xl font-black text-slate-900 dark:text-slate-50 md:text-5xl">
            {t('topRanked.title', 'Top propriétés')}
          </h2>
          <p className="mt-3 max-w-2xl text-slate-600">
            {t('topRanked.description', 'Les biens les mieux notés selon notre algorithme de scoring.')}
          </p>
        </motion.div>

        <motion.div
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {properties.map((property) => {
            const image = property.images?.[0] ? fixImageUrl(property.images[0]) : '/images/no-image.svg';
            const rank = property.rank || 0;
            const trend = property.trend || 0;

            return (
              <motion.article
                key={property.id}
                variants={itemVariants}
                className="premium-card group relative"
              >
                {/* Rank Badge */}
                {rank <= 3 && (
                  <div
                    className={`absolute left-4 top-4 z-10 grid h-8 w-8 place-items-center rounded-full text-sm font-black shadow-lg ${rankColors[rank] || 'bg-primary-500 text-white'}`}
                  >
                    #{rank}
                  </div>
                )}

                <Link to={`/property/${property.id}`} className="block">
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={image}
                      alt={property.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                    {/* Score Meter */}
                    <div className="absolute right-4 top-4 z-10">
                      <ScoreMeter score={property.finalScore || 0} />
                    </div>

                    {/* Trend */}
                    {trend !== 0 && (
                      <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-full bg-white/90 dark:bg-slate-800/90 px-2.5 py-1 text-xs font-bold text-emerald-600 shadow-sm backdrop-blur">
                        <TrendingUp size={12} />
                        {trend > 0 ? '+' : ''}{trend}%
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="line-clamp-1 text-lg font-black text-slate-900 dark:text-slate-50 transition group-hover:text-teal-600">
                        {property.title}
                      </h3>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50/60 px-2 py-0.5 text-xs font-black text-teal-600 shrink-0">
                        <Star size={12} fill="currentColor" className="text-amber-500" />
                        {(property as any).averageRating || '-'}
                      </span>
                    </div>

                    <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-slate-500">
                      <MapPin size={14} className="text-amber-500 shrink-0" />
                      <span className="truncate">{property.city}</span>
                    </p>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-1 rounded-2xl bg-amber-50/40 px-3 py-2">
                        <Bed size={14} className="text-teal-600" /> {property.rooms || 0}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-2xl bg-amber-50/40 px-3 py-2">
                        <Bath size={14} className="text-teal-600" /> {property.bathrooms || 0}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-2xl bg-amber-50/40 px-3 py-2">
                        <Maximize2 size={14} className="text-teal-600" /> {property.surface || 0}m²
                      </span>
                    </div>

                    <div className="mt-4 flex items-end justify-between border-t border-amber-400/15 pt-4">
                      <p className="text-xl font-black text-teal-600">
                        {formatPrice(property.price)}
                      </p>
                      {property.type === 'RENT' && (
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-500">
                          {t('common.perMonth', 'par mois')}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};
