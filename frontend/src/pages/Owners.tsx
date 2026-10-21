import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Medal, Star, Building2, MessageSquare, ArrowLeft } from 'lucide-react';
import { useOwnerRankings } from '../hooks/useHomepageData';
import { Skeleton } from '../components/ui/Skeleton';
import { fixMediaUrl } from '../utils/imageUtils';

const MEDALS = [
  { icon: '🥇', color: 'from-yellow-400 to-amber-500', ring: 'ring-yellow-400/50' },
  { icon: '🥈', color: 'from-slate-300 to-slate-400', ring: 'ring-slate-300/50' },
  { icon: '🥉', color: 'from-orange-400 to-orange-500', ring: 'ring-orange-400/50' },
];

const GRADIENTS = [
  'from-teal-500 to-emerald-500',
  'from-blue-500 to-indigo-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-violet-500 to-purple-500',
  'from-cyan-500 to-sky-500',
  'from-lime-500 to-green-500',
  'from-fuchsia-500 to-rose-500',
];

const OwnerSkeleton: React.FC = () => (
  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 animate-pulse">
    <div className="flex flex-col items-center gap-3">
      <div className="h-20 w-20 rounded-full bg-slate-200 dark:bg-slate-700" />
      <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
      <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
      <div className="flex gap-3 mt-1">
        <div className="h-3 w-14 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-3 w-14 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    </div>
  </div>
);

export const Owners: React.FC = () => {
  const { t } = useTranslation();
  const { data: owners, isLoading } = useOwnerRankings();

  return (
    <section className="min-h-screen py-16 bg-[color:var(--color-bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0.01, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            to="/home"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-teal-500 transition-colors mb-6"
          >
            <ArrowLeft size={18} />
            {t('common.back', 'Retour')}
          </Link>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
            {t('owners.title', 'Tous les propriétaires')}
          </h1>
          <p className="mt-3 text-base text-slate-500 dark:text-slate-400 max-w-xl">
            {t('owners.subtitle', 'Découvrez les propriétaires les mieux notés par notre communauté')}
          </p>
          <div className="mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-gold-400 to-teal-500" />
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <OwnerSkeleton key={i} />
            ))}
          </div>
        ) : !owners || owners.length === 0 ? (
          <p className="text-center text-slate-500 dark:text-slate-400 py-8">
            {t('home.owners.empty', 'Aucun propriétaire classé pour le moment')}
          </p>
        ) : (
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"
            initial={{ opacity: 0.01 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {owners.map((owner, index) => {
              const medal = index < 3 ? MEDALS[index] : null;
              const gradient = GRADIENTS[index % GRADIENTS.length];
              const initial = owner.name?.charAt(0).toUpperCase() || '?';

              return (
                <motion.div
                  key={owner.userId}
                  initial={{ opacity: 0.01, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.25 } }}
                  className="group relative flex flex-col items-center gap-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-6 transition-all duration-300 hover:shadow-lg dark:hover:shadow-slate-900/50 hover:border-teal-300/50 dark:hover:border-teal-500/30"
                >
                  {medal && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
                      <span className="text-xl">{medal.icon}</span>
                    </div>
                  )}

                  <div
                    className={`relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${gradient} ring-2 ${medal ? medal.ring : 'ring-slate-200 dark:ring-slate-700'} ring-offset-2 dark:ring-offset-slate-800`}
                  >
                    {owner.avatar ? (
                      <img
                        src={fixMediaUrl(owner.avatar)}
                        alt={owner.name}
                        className="w-full h-full rounded-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-2xl font-black text-white">{initial}</span>
                    )}
                  </div>

                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 text-center line-clamp-1">
                    {owner.name}
                  </p>

                  <div className="flex items-center gap-1 rounded-full bg-gold-400/10 dark:bg-gold-400/10 px-2.5 py-0.5">
                    <Star size={12} className="text-gold-500 fill-gold-500" />
                    <span className="text-xs font-bold text-gold-600 dark:text-gold-400">
                      {owner.score.toFixed(1)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Building2 size={12} />
                      {owner.propertyCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare size={12} />
                      {owner.reviewCount}
                    </span>
                  </div>

                  <Link
                    to={`/search?ownerId=${owner.userId}`}
                    className="mt-1 w-full py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-teal-500 hover:text-white dark:hover:bg-teal-500 transition-colors text-center block"
                  >
                    {t('home.owners.viewProfile', 'Voir profil')}
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </section>
  );
};
