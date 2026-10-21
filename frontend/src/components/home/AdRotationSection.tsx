import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Megaphone } from 'lucide-react';
import { useAds } from '../../hooks/useAds';
import { SectionError } from '../ux/SectionErrorBoundary';
import { fixImageUrl } from '../../utils/imageUtils';

const containerVariants = {
  hidden: { opacity: 0.01 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0.01, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const AdRotationSection: React.FC = () => {
  const { t } = useTranslation();
  const { data: ads, isLoading, error, refetch } = useAds('homepage', 3);

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
          <div className="grid gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!ads || ads.length === 0) {
    return null;
  }

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0.01, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          className="mb-10 flex items-center gap-3"
        >
          <Megaphone className="h-5 w-5 text-amber-500" />
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-500">
              {t('ads.subtitle', 'Sponsorisé')}
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-50">
              {t('ads.title', 'Annonces partenaires')}
            </h2>
          </div>
        </motion.div>

        <motion.div
          className="grid gap-6 md:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {ads.map((ad) => (
            <motion.div
              key={ad.id}
              variants={itemVariants}
              className="premium-card group relative overflow-hidden"
            >
              <div className="absolute left-3 top-3 z-10">
                <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
                  <Megaphone size={10} />
                  {t('ads.sponsored', 'Sponsorisé')}
                </span>
              </div>

              <div className="relative h-48 overflow-hidden">
                {ad.imageUrl ? (
                  <img
                    src={fixImageUrl(ad.imageUrl)}
                    alt={ad.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-primary-500 to-atlas-600" />
                )}
              </div>

              <div className="p-5">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">{ad.title}</h3>
                <p className="mt-2 text-sm text-slate-600 line-clamp-2">{ad.description}</p>
                {ad.property && (
                  <p className="mt-3 text-lg font-black text-teal-600">
                    {new Intl.NumberFormat('fr-MA', {
                      style: 'currency',
                      currency: 'MAD',
                      maximumFractionDigits: 0,
                    }).format(ad.property.price || 0)}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
