import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Property } from '../../types';
import { Clock, MapPin, Heart, Eye } from 'lucide-react';
import { fixMediaUrl } from '../../utils/imageUtils';

interface RecentlyViewedProps {
  properties: Property[];
}

export const RecentlyViewed: React.FC<RecentlyViewedProps> = ({ properties }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (properties.length === 0) return null;

  return (
    <section className="py-8 bg-slate-50/50 dark:bg-slate-800/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">{t('recentlyViewed.title')}</h2>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x">
          {properties.map((property, index) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0.01, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(`/property/${property.id}`)}
              className="flex-shrink-0 w-64 snap-start cursor-pointer group"
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition border border-slate-100 dark:border-slate-700">
                <div className="relative h-36 overflow-hidden">
                  <img
                    src={property.images?.[0] ? fixMediaUrl(property.images[0]) : '/images/no-image.svg'}
                    alt={property.title}
                    className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-white font-bold text-sm line-clamp-1 drop-shadow">{property.title}</p>
                    <p className="text-white/80 text-xs flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {property.city}
                    </p>
                  </div>
                  {property.isVerified && (
                    <span className="absolute top-2 left-2 bg-teal-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {t('property.verified')}
                    </span>
                  )}
                </div>
                <div className="p-3 flex items-center justify-between">
                  <p className="text-teal-600 font-bold text-sm">
                    {property.price.toLocaleString('fr-MA')} MAD
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {property.viewCount || 0}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
