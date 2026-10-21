import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useInView } from 'framer-motion';
import { Users, Building2, Home, Megaphone, KeyRound, MapPin } from 'lucide-react';
import { useAnimatedStats } from '../../hooks/useHomepageData';

const containerVariants = {
  hidden: { opacity: 0.01 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0.01, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

const ICONS = [Users, Users, Building2, Megaphone, KeyRound, MapPin];

const formatNumber = (num: number): string => {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return num.toString();
};

const useCountUp = (target: number, duration: number = 2000, start: boolean = false) => {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!start) {
      setCount(0);
      return;
    }

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      startTimeRef.current = null;
    };
  }, [target, duration, start]);

  return count;
};

const StatCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: number;
  index: number;
  inView: boolean;
}> = ({ icon: Icon, label, value, index, inView }) => {
  const count = useCountUp(value, 2000, inView);

  return (
    <motion.div
      variants={itemVariants}
      className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-6 transition-all duration-300 hover:shadow-lg dark:hover:shadow-slate-900/50 hover:border-teal-300/50 dark:hover:border-teal-500/30"
    >
      <div
        className={`flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${
          index % 3 === 0
            ? 'from-teal-500 to-emerald-500'
            : index % 3 === 1
            ? 'from-gold-400 to-amber-500'
            : 'from-blue-500 to-indigo-500'
        } text-white shadow-md`}
      >
        <Icon size={26} />
      </div>
      <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-50">
        {formatNumber(count)}
      </div>
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 text-center">
        {label}
      </p>
    </motion.div>
  );
};

export const StatsSection: React.FC = () => {
  const { t } = useTranslation();
  const { data: stats, isLoading } = useAnimatedStats();
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: '-100px' });

  const metrics = stats
    ? [
        { key: 'totalUsers', label: t('home.stats.users', 'Utilisateurs'), value: stats.totalUsers },
        { key: 'totalOwners', label: t('home.stats.owners', 'Propriétaires'), value: stats.totalOwners },
        { key: 'totalProperties', label: t('home.stats.properties', 'Biens'), value: stats.totalProperties },
        { key: 'totalAds', label: t('home.stats.ads', 'Annonces'), value: stats.totalAds },
        { key: 'totalRentals', label: t('home.stats.rentals', 'Locations'), value: stats.totalRentals },
        { key: 'totalCities', label: t('home.stats.cities', 'Villes'), value: stats.totalCities },
      ]
    : [];

  return (
    <section className="py-16 bg-[color:var(--color-bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-10 text-center"
          initial={{ opacity: 0.01, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
            {t('home.stats.title', 'Notre communauté en chiffres')}
          </h2>
          <p className="mt-3 text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            {t('home.stats.subtitle', 'Des chiffres qui reflètent la confiance de nos utilisateurs')}
          </p>
          <div className="mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-gold-400 to-teal-500 mx-auto" />
        </motion.div>

        <div ref={sectionRef}>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 animate-pulse"
                >
                  <div className="h-14 w-14 rounded-2xl bg-slate-200 dark:bg-slate-700" />
                  <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
              ))}
            </div>
          ) : metrics.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-400 py-8">
              {t('home.stats.empty', 'Aucune statistique disponible')}
            </p>
          ) : (
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
              variants={containerVariants}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
            >
              {metrics.map((metric, index) => (
                <StatCard
                  key={metric.key}
                  icon={ICONS[index]}
                  label={metric.label}
                  value={metric.value}
                  index={index}
                  inView={inView}
                />
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};
