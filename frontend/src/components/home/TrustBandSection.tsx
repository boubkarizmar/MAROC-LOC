import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Crown, Users, Sparkles } from 'lucide-react';
import { usePlatformStats } from '../../hooks/usePlatformStats';
import { SectionError } from '../ux/SectionErrorBoundary';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0.01 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0.01, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export const TrustBandSection: React.FC = () => {
  const { t } = useTranslation();
  const { data: stats, isLoading, error, refetch } = usePlatformStats();

  if (error) {
    return (
      <section className="border-y border-amber-400/15 bg-white/68 dark:bg-slate-800/68 py-10 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionError onRetry={() => refetch()} />
        </div>
      </section>
    );
  }

  const items = [
    {
      icon: ShieldCheck,
      title: t('trust.verified', 'Biens vérifiés'),
      text: stats
        ? t('trust.verifiedCount', '{{count}} biens vérifiés', { count: stats.verifiedProperties })
        : t('trust.verifiedDesc', 'Contrôle qualité et propriétaires validés'),
    },
    {
      icon: Crown,
      title: t('trust.premium', 'Sélection premium'),
      text: t('trust.premiumDesc', 'Riads, villas et appartements haut standing'),
    },
    {
      icon: Users,
      title: t('trust.support', 'Support local'),
      text: stats
        ? t('trust.usersCount', '{{count}} utilisateurs actifs', { count: stats.activeUsers })
        : t('trust.supportDesc', 'Accompagnement humain au Maroc'),
    },
    {
      icon: Sparkles,
      title: t('trust.ai', 'Recherche IA'),
      text: stats
        ? t('trust.satisfaction', 'Note moyenne {{rate}}/5', { rate: stats.satisfactionRate })
        : t('trust.aiDesc', 'Filtres rapides et recommandations utiles'),
    },
  ];

  return (
    <section className="border-y border-amber-400/15 bg-white/68 dark:bg-slate-800/68 py-10 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {items.map((item) => (
            <motion.div
              key={item.title}
              variants={itemVariants}
              className="flex items-start gap-4 rounded-3xl p-4 transition hover:bg-amber-50/35"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-teal-600 text-white shadow-soft">
                <item.icon size={22} />
              </span>
              <span>
                <strong className="block text-sm font-black text-slate-900 dark:text-slate-50">
                  {item.title}
                </strong>
                <span className="mt-1 block text-sm text-slate-500">
                  {isLoading ? '...' : item.text}
                </span>
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
