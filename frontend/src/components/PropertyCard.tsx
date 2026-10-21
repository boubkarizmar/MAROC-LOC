import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Heart, Bed, Bath, Maximize, BarChart3, User } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { staggerItem } from "../design-system/animations/motion";
import { SafeImage } from "./common/SafeImage";
import { safeParseId } from "../utils/validation";
import { fixMediaUrl } from "../utils/imageUtils";

export interface PropertyCardProps {
  id: number;
  title: string;
  location: string;
  price: number;
  pricePerMeter?: number;
  imageUrl?: string;
  beds?: number;
  baths?: number;
  surface?: number;
  type?: string;
  isFeatured?: boolean;
  isNew?: boolean;
  isFavorite?: boolean;
  isInCompare?: boolean;
  canAddCompare?: boolean;
  onFavoriteToggle?: (id: number) => void;
  onCompareToggle?: (id: number) => void;
  onClick?: (id: number) => void;
  ownerName?: string;
  aiScore?: number;
  badge?: string;
}

export const PropertyCard: React.FC<PropertyCardProps> = React.memo(({
  id,
  title,
  location,
  price,
  pricePerMeter,
  imageUrl,
  beds,
  baths,
  surface,
  type,
  isFeatured = false,
  isNew = false,
  isFavorite = false,
  isInCompare = false,
  canAddCompare = false,
  onFavoriteToggle,
  onCompareToggle,
  onClick,
  ownerName,
  aiScore,
  badge,
}) => {
  const { t } = useTranslation();
  const validId = safeParseId(id);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("fr-MA", {
      style: "currency",
      currency: "MAD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const cardBody = (
    <>
      {/* Image */}
      <div className="relative overflow-hidden">
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="w-full h-52"
        >
          <SafeImage
            src={fixMediaUrl(imageUrl) || ''}
            alt={title}
            className="w-full h-52 object-cover"
            fallbackSrc="/images/no-image.svg"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {isNew && <Badge variant="success" size="sm">{t('property.new')}</Badge>}
          {isFeatured && <Badge variant="gold" size="sm">{t('home.properties.featured')}</Badge>}
          {badge && <Badge variant="gold" size="sm">{badge}</Badge>}
          {type && <Badge variant="primary" size="sm">{type}</Badge>}
        </div>

        {/* Action buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={(e) => {
                e.stopPropagation();
                onFavoriteToggle?.(id);
              }}
              className="p-2 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-sm hover:bg-white dark:hover:bg-slate-700 transition-colors duration-150"
              aria-label={isFavorite ? t('property.favorite.remove') : t('property.favorite.add')}
            >
              <Heart
                className={`w-4 h-4 transition-colors duration-150 ${
                  isFavorite
                    ? "fill-semantic-error-500 text-semantic-error-500"
                    : "text-gray-500"
                }`}
                aria-hidden="true"
              />
            </motion.button>
            {onCompareToggle && (
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onCompareToggle(id);
                }}
                className={`p-2 rounded-full backdrop-blur-sm shadow-sm transition-colors duration-150 ${
                  isInCompare
                    ? 'bg-teal-600 text-white'
                    : canAddCompare
                    ? 'bg-white/90 dark:bg-slate-800/90 text-slate-500 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                    : 'bg-white/50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-500 cursor-not-allowed'
                }`}
                title={isInCompare ? t('property.details.inComparison') : canAddCompare ? t('property.details.compare') : t('property.details.maxComparison')}
              >
                <BarChart3 className="w-4 h-4" />
              </motion.button>
            )}
          </div>

          {/* Price overlay on hover */}
          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="text-white font-bold text-lg drop-shadow-lg">
              {formatPrice(price)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-h5 text-[color:var(--color-text-primary)] line-clamp-1 font-semibold flex-1">
              {title}
            </h3>
            {aiScore !== undefined && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-[10px] font-bold shrink-0">
                <BarChart3 className="w-3 h-3" />
                {aiScore.toFixed(0)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-2 text-[color:var(--color-text-secondary)]">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="text-body-sm line-clamp-1">{location}</span>
          </div>

          {ownerName && (
            <div className="flex items-center gap-1.5 mt-1 text-[color:var(--color-text-tertiary)]">
              <User className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-caption line-clamp-1">{ownerName}</span>
            </div>
          )}

          {/* Features */}
          <div className="flex items-center gap-4 mt-3 text-[color:var(--color-text-tertiary)]">
            {beds !== undefined && (
              <div className="flex items-center gap-1">
                <Bed className="w-4 h-4" />
                <span className="text-caption">{beds}</span>
              </div>
            )}
            {baths !== undefined && (
              <div className="flex items-center gap-1">
                <Bath className="w-4 h-4" />
                <span className="text-caption">{baths}</span>
              </div>
            )}
            {surface !== undefined && (
              <div className="flex items-center gap-1">
                <Maximize className="w-4 h-4" />
                <span className="text-caption">{surface} m²</span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="mt-4 pt-4 border-t border-[color:var(--color-border)] flex items-baseline justify-between">
            <span className="text-h4 font-bold text-primary-600 dark:text-primary-400">
              {formatPrice(price)}
            </span>
            {pricePerMeter && (
              <span className="text-caption text-[color:var(--color-text-tertiary)]">
                {formatPrice(pricePerMeter)}/m²
              </span>
            )}
          </div>
        </div>
    </>
  );

  return (
    <motion.div variants={staggerItem}>
      {validId !== null ? (
        <Link to={`/property/${validId}`} className="block">
          <Card
            padding="none"
            hover={true}
            glow={isFeatured ? "gold" : "none"}
            onClick={() => onClick?.(id)}
            className="overflow-hidden group cursor-pointer"
          >
            {cardBody}
          </Card>
        </Link>
      ) : (
        <Card
          padding="none"
          hover={true}
          glow={isFeatured ? "gold" : "none"}
          onClick={() => onClick?.(id)}
          className="overflow-hidden group cursor-pointer"
        >
          {cardBody}
        </Card>
      )}
    </motion.div>
  );
});
PropertyCard.displayName = 'PropertyCard';
