import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, TrendingUp, ArrowRight } from 'lucide-react';
import { useCityStatsDetailed } from '../../hooks/useHomepageData';
import { SectionError } from '../ux/SectionErrorBoundary';

const containerVariants = {
  hidden: { opacity: 0.01 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0.01, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const GRADIENTS = [
  'from-teal-500 to-emerald-600',
  'from-blue-500 to-indigo-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-violet-500 to-purple-600',
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-fuchsia-500 to-rose-600',
];

const CityImage: React.FC<{ city: { name: string; slug: string }; imageUrl: string }> = ({ city, imageUrl }) => {
  const [hasError, setHasError] = React.useState(false);
  const gradientIndex = city.slug.length % GRADIENTS.length;
  const initials = city.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  if (hasError) {
    return (
      <div className={`h-full w-full bg-gradient-to-br ${GRADIENTS[gradientIndex]} flex items-center justify-center`}>
        <span className="text-4xl font-black text-white/80">{initials}</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={city.name}
      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
      onError={() => setHasError(true)}
    />
  );
};

const CitySkeleton: React.FC = () => (
  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden animate-pulse">
    <div className="h-48 bg-slate-200 dark:bg-slate-700" />
    <div className="p-5 space-y-3">
      <div className="h-5 w-2/3 bg-slate-200 dark:bg-slate-700 rounded" />
      <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700 rounded" />
      <div className="h-10 w-full bg-slate-200 dark:bg-slate-700 rounded-xl mt-2" />
    </div>
  </div>
);

export const CityShowcaseSection: React.FC = () => {
  const { t } = useTranslation();
  const { data: cities, isLoading, error, refetch } = useCityStatsDetailed();

  if (error) {
    return (
      <section id="cities" className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionError onRetry={() => refetch()} />
        </div>
      </section>
    );
  }

  const displayCities = (Array.isArray(cities) ? cities : [])
    .sort((a, b) => b.propertyCount - a.propertyCount)
    .slice(0, 8);

  return (
    <section id="cities" className="py-16 bg-[color:var(--color-bg)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-10 text-center"
          initial={{ opacity: 0.01, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
            {t('home.cities.title', 'Villes en vedette')}
          </h2>
          <p className="mt-3 text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            {t('home.cities.subtitle', 'Découvrez les villes les plus dynamiques du Maroc')}
          </p>
          <div className="mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-gold-400 to-teal-500 mx-auto" />
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <CitySkeleton key={i} />
            ))}
          </div>
        ) : displayCities.length === 0 ? (
          <p className="text-center text-slate-500 dark:text-slate-400 py-8">
            {t('home.cities.empty', 'Aucune ville disponible')}
          </p>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
          >
            {displayCities.map((city) => {
              const imageUrl = `/images/cities/${city.slug}.jpg`;

              return (
                <motion.div
                  key={city.slug}
                  variants={itemVariants}
                  whileHover={{ y: -6, transition: { duration: 0.25 } }}
                  className="group relative flex flex-col rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 overflow-hidden transition-all duration-300 hover:shadow-xl dark:hover:shadow-slate-900/50 hover:border-teal-300/50 dark:hover:border-teal-500/30"
                >
                  {/* City image */}
                  <div className="relative h-48 overflow-hidden">
                    <CityImage city={city} imageUrl={imageUrl} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <h3 className="text-xl font-black text-white">{city.name}</h3>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="flex flex-col flex-1 p-5">
                    <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300 mb-4">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-teal-500" />
                        <span className="font-semibold">
                          {city.propertyCount} {t('home.owners.properties', 'biens')}
                        </span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <TrendingUp size={14} className="text-gold-500" />
                        <span className="font-semibold">
                          {t('home.cities.averagePrice', 'Prix moyen')}: {Math.round(city.averagePrice).toLocaleString()} {t('common.currency')}
                        </span>
                      </span>
                    </div>

                    <Link
                      to={`/search?city=${encodeURIComponent(city.name)}`}
                      className="mt-auto inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-teal-500 hover:text-white dark:hover:bg-teal-500 transition-colors"
                    >
                      {t('home.cities.explore', 'Explorer')}
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {displayCities.length > 0 && (
          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <Link
              to="/cities"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-teal-500 hover:text-white dark:hover:bg-teal-500 transition-all hover:scale-105"
            >
              {t('home.cities.seeAll', 'Voir toutes les villes')}
              <ArrowRight size={16} />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
};
