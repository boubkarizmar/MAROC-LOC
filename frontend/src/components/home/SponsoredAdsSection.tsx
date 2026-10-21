import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import { useActiveAds } from '../../hooks/useHomepageData';
import { SafeImage } from '../common/SafeImage';
import { fixImageUrl } from '../../utils/imageUtils';
import { safeParseId } from '../../utils/validation';

const containerVariants = {
  hidden: { opacity: 0.01 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0.01, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

const AdSkeleton: React.FC = () => (
  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden animate-pulse">
    <div className="h-48 bg-slate-200 dark:bg-slate-700" />
    <div className="p-4 space-y-2">
      <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
      <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded" />
    </div>
  </div>
);

export const SponsoredAdsSection: React.FC = () => {
  const { t } = useTranslation();
  const { data: ads, isLoading } = useActiveAds();

  const activeAds = (ads || [])
    .filter((ad) => ad.status === 'ACTIVE')
    .slice(0, 6);

  return (
    <section className="py-16 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-10 flex items-center gap-3"
          initial={{ opacity: 0.01, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gold-500/10 dark:bg-gold-500/10 text-gold-600 dark:text-gold-400">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50">
              {t('home.properties.sponsored', 'Annonces sponsorisées')}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('ads.promotedSubtitle', 'Placements premium sélectionnés')}
            </p>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <AdSkeleton key={i} />
            ))}
          </div>
        ) : activeAds.length === 0 ? (
          <p className="text-center text-slate-500 dark:text-slate-400 py-8">
            {t('home.ads.empty', 'Aucune annonce sponsorisée pour le moment')}
          </p>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
          >
            {activeAds.map((ad) => {
              const validPropertyId = safeParseId(ad.propertyId);
              const imageSrc = ad.imageUrl ? fixImageUrl(ad.imageUrl) : '';
              const card = (
                <motion.div
                  key={ad.id}
                  variants={itemVariants}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group relative rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 overflow-hidden transition-all duration-300 hover:shadow-lg dark:hover:shadow-slate-900/50 hover:border-gold-300/50 dark:hover:border-gold-500/30"
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <SafeImage
                      src={imageSrc}
                      alt={ad.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      fallbackSrc="/images/no-image.svg"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                    {/* Sponsored badge */}
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                        <Crown size={10} />
                        {t('home.properties.sponsored', 'Sponsorisé')}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                      {ad.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                      {ad.description}
                    </p>
                    {ad.budget > 0 && (
                      <p className="mt-3 text-lg font-bold text-gold-600 dark:text-gold-400">
                        {new Intl.NumberFormat('fr-MA', {
                          style: 'currency',
                          currency: 'MAD',
                          maximumFractionDigits: 0,
                        }).format(ad.budget)}
                      </p>
                    )}
                  </div>
                </motion.div>
              );

              return validPropertyId !== null ? (
                <Link key={ad.id} to={`/property/${validPropertyId}`} className="block">
                  {card}
                </Link>
              ) : (
                <React.Fragment key={ad.id}>{card}</React.Fragment>
              );
            })}
          </motion.div>
        )}
      </div>
    </section>
  );
};
