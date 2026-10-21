import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Medal,
  Star,
  Building2,
  MessageSquare,
  User,
  ArrowRight,
  MapPin,
  ShieldCheck,
  MessageCircle,
  Eye,
} from 'lucide-react';
import { useOwnerRankings } from '../../hooks/useHomepageData';

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

const MEDALS = [
  { icon: '🥇', color: 'from-yellow-400 to-amber-500', ring: 'ring-yellow-400/50', bar: 'bg-yellow-400' },
  { icon: '🥈', color: 'from-slate-300 to-slate-400', ring: 'ring-slate-300/50', bar: 'bg-slate-300' },
  { icon: '🥉', color: 'from-orange-400 to-orange-500', ring: 'ring-orange-400/50', bar: 'bg-orange-400' },
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
  'from-yellow-500 to-amber-500',
  'from-indigo-500 to-blue-500',
];

const OwnerSkeleton: React.FC = () => (
  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 animate-pulse">
    <div className="flex flex-col items-center gap-3">
      <div className="h-16 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
      <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
      <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
      <div className="flex gap-3 mt-1">
        <div className="h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
      <div className="h-9 w-full bg-slate-200 dark:bg-slate-700 rounded-xl mt-1" />
    </div>
  </div>
);

export const TopOwnersSection: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: owners, isLoading } = useOwnerRankings();

  const topOwners = (owners || []).slice(0, 10);

  return (
    <section
      id="owners"
      className="py-16 bg-gradient-to-b from-white via-slate-50/50 to-white dark:from-slate-900 dark:via-slate-900/50 dark:to-slate-900"
      aria-labelledby="owners-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-10 text-center"
          initial={{ opacity: 0.01, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2
            id="owners-heading"
            className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight"
          >
            {t('home.owners.title', 'Meilleurs propriétaires')}
          </h2>
          <p className="mt-3 text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            {t('home.owners.subtitle', 'Les propriétaires les mieux notés par notre communauté')}
          </p>
          <div className="mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-gold-400 to-teal-500 mx-auto" />
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <OwnerSkeleton key={i} />
            ))}
          </div>
        ) : topOwners.length === 0 ? (
          <p className="text-center text-slate-500 dark:text-slate-400 py-8">
            {t('home.owners.empty', 'Aucun propriétaire classé pour le moment')}
          </p>
        ) : (
          <>
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              role="list"
              aria-label={t('home.owners.listAria', 'Liste des meilleurs propriétaires')}
            >
              {topOwners.map((owner, index) => {
                const medal = index < 3 ? MEDALS[index] : null;
                const gradient = GRADIENTS[index % GRADIENTS.length];
                const initial = owner.name?.charAt(0).toUpperCase() || '?';
                const scorePercent = Math.min(100, Math.max(0, owner.score));

                return (
                  <motion.div
                    key={owner.userId}
                    variants={itemVariants}
                    whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.25 } }}
                    className="group relative flex flex-col items-center gap-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-5 transition-all duration-300 hover:shadow-lg dark:hover:shadow-slate-900/50 hover:border-teal-300/50 dark:hover:border-teal-500/30"
                    role="listitem"
                  >
                    {/* Medal badge */}
                    {medal && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
                        <span className="text-xl" aria-label={t('home.owners.medal', { rank: index + 1 })}>
                          {medal.icon}
                        </span>
                      </div>
                    )}

                    {/* Avatar */}
                    <div
                      className={`relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br ${gradient} ring-2 ${medal ? medal.ring : 'ring-slate-200 dark:ring-slate-700'} ring-offset-2 dark:ring-offset-slate-800`}
                    >
                      {owner.avatar ? (
                        <img
                          src={owner.avatar}
                          alt={t('home.owners.avatarAlt', { name: owner.name })}
                          className="w-full h-full rounded-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-xl font-black text-white">{initial}</span>
                      )}
                      {owner.verified && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center ring-2 ring-white dark:ring-slate-800">
                          <ShieldCheck className="w-3 h-3 text-white" aria-hidden="true" />
                        </div>
                      )}
                    </div>

                    {/* Name */}
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 text-center line-clamp-1">
                      {owner.name}
                    </p>

                    {/* City */}
                    {owner.city && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                        <MapPin className="w-3 h-3" aria-hidden="true" />
                        <span className="line-clamp-1">{owner.city}</span>
                      </div>
                    )}

                    {/* Score badge + progress bar */}
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                          <Star size={12} className="text-gold-500 fill-gold-500" aria-hidden="true" />
                          <span className="text-xs font-bold text-gold-600 dark:text-gold-400">
                            {owner.score.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          {t('home.owners.score', 'Score')}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${medal ? medal.bar : 'bg-teal-500'}`}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${scorePercent}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: index * 0.05 }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1" title={t('home.owners.properties', 'Biens')}>
                        <Building2 size={12} aria-hidden="true" />
                        {owner.propertyCount}
                      </span>
                      <span className="flex items-center gap-1" title={t('home.owners.reviews', 'Avis')}>
                        <MessageSquare size={12} aria-hidden="true" />
                        {owner.reviewCount}
                      </span>
                      <span className="flex items-center gap-1" title={t('home.owners.responseRate', 'Taux de réponse')}>
                        <MessageCircle size={12} aria-hidden="true" />
                        {owner.responseRate.toFixed(0)}%
                      </span>
                      <span className="flex items-center gap-1" title={t('home.owners.visits', 'Visites')}>
                        <Eye size={12} aria-hidden="true" />
                        {owner.visitCount}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="mt-1 w-full flex flex-col gap-2">
                      <Link
                        to={`/owners/${owner.userId}`}
                        className="w-full py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-teal-500 hover:text-white dark:hover:bg-teal-500 transition-colors text-center block focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        {t('home.owners.viewProfile', 'Voir profil')}
                      </Link>
                      <button
                        onClick={() => navigate(`/search?ownerId=${owner.userId}`)}
                        className="w-full py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        {t('home.owners.viewProperties', 'Voir propriétés')}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {topOwners.length > 0 && (
              <motion.div
                className="mt-8 text-center"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <Link
                  to="/owners"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-teal-500 hover:text-white dark:hover:bg-teal-500 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {t('home.owners.seeAll', 'Voir tous les propriétaires')}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </motion.div>
            )}
          </>
        )}
      </div>
    </section>
  );
};
