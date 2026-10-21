import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Star,
  Building2,
  MessageSquare,
  MessageCircle,
  Eye,
  ShieldCheck,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { useOwnerRankings } from '../hooks/useHomepageData';
import { useProperties } from '../hooks/useProperties';
import { PropertyCard } from '../components/PropertyCard';
import { Skeleton } from '../components/ui/Skeleton';
import { fixMediaUrl } from '../utils/imageUtils';

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

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
}> = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400">
      {icon}
    </div>
    <div>
      <p className="text-lg font-bold text-slate-900 dark:text-slate-50">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  </div>
);

export const OwnerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const ownerId = Number(id);

  const { data: owners, isLoading: ownersLoading } = useOwnerRankings();
  const { data: propertiesData, isLoading: propertiesLoading } = useProperties({
    filters: { ownerId: ownerId || undefined },
    size: 12,
  });

  const owner = owners?.find((o) => o.userId === ownerId);
  const properties = propertiesData?.content || [];

  const initial = owner?.name?.charAt(0).toUpperCase() || '?';
  const scorePercent = owner ? Math.min(100, Math.max(0, owner.score)) : 0;

  if (ownersLoading) {
    return (
      <div className="min-h-screen bg-[color:var(--color-bg)] pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton width="60%" height={32} className="mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
            ))}
          </div>
          <Skeleton width="40%" height={24} className="mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="min-h-screen bg-[color:var(--color-bg)] pt-24 pb-16 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-4">
            {t('owners.notFound', 'Propriétaire non trouvé')}
          </h1>
          <button
            onClick={() => navigate('/owners')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-teal-500 text-white hover:bg-teal-600 transition-colors"
          >
            <ArrowLeft size={16} />
            {t('owners.backToList', 'Retour à la liste')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-[color:var(--color-bg)] pt-24 pb-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors mb-6 focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-lg px-2 py-1"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          {t('common.back', 'Retour')}
        </button>

        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-10">
          {/* Avatar */}
          <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 ring-4 ring-teal-100 dark:ring-teal-900/30">
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
              <span className="text-3xl font-black text-white">{initial}</span>
            )}
            {owner.verified && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                <ShieldCheck className="w-4 h-4 text-white" aria-hidden="true" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-50">
              {owner.name}
            </h1>
            {owner.city && (
              <div className="flex items-center gap-1.5 mt-1 text-slate-500 dark:text-slate-400">
                <MapPin size={16} aria-hidden="true" />
                <span className="text-sm">{owner.city}</span>
              </div>
            )}

            {/* Score bar */}
            <div className="mt-4 max-w-md">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Star size={14} className="text-gold-500 fill-gold-500" aria-hidden="true" />
                  <span className="text-sm font-bold text-gold-600 dark:text-gold-400">
                    {owner.score.toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {t('home.owners.score', 'Score')}
                  </span>
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {scorePercent.toFixed(0)}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-gold-400 to-amber-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${scorePercent}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <StatCard
            icon={<Building2 size={20} aria-hidden="true" />}
            label={t('owners.stats.properties', 'Biens')}
            value={owner.propertyCount}
          />
          <StatCard
            icon={<MessageSquare size={20} aria-hidden="true" />}
            label={t('owners.stats.reviews', 'Avis')}
            value={owner.reviewCount}
          />
          <StatCard
            icon={<MessageCircle size={20} aria-hidden="true" />}
            label={t('owners.stats.responseRate', 'Taux de réponse')}
            value={`${owner.responseRate.toFixed(0)}%`}
          />
          <StatCard
            icon={<Eye size={20} aria-hidden="true" />}
            label={t('owners.stats.visits', 'Visites')}
            value={owner.visitCount}
          />
        </div>

        {/* Properties Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50">
              {t('owners.propertiesTitle', 'Biens du propriétaire')}
            </h2>
            <Link
              to={`/search?ownerId=${owner.userId}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-lg px-2 py-1"
            >
              {t('owners.seeAllProperties', 'Voir tout')}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          {propertiesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
              ))}
            </div>
          ) : properties.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-400 py-8">
              {t('owners.noProperties', 'Aucun bien disponible pour ce propriétaire')}
            </p>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
            >
              {properties.map((property) => (
                <motion.div key={property.id} variants={itemVariants}>
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
                    ownerName={property.ownerName}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
