import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Building,
  Home,
  MapPin,
  Store,
  Dumbbell,
  Coffee,
  Tag,
  Mountain,
  Crown,
  TreePine,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useCategoryCounts } from '../../hooks/useHomepageData';
import { PropertyCategory } from '../../types';

const ICON_MAP: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  APARTMENT: Building,
  HOUSE: Home,
  OFFICE: MapPin,
  SHOP: Store,
  GYM: Dumbbell,
  CAFE: Coffee,
  OTHER: Tag,
  LAND: Mountain,
  RIAD: Crown,
  VILLA: TreePine,
};

const CATEGORY_IMAGES: Record<string, string> = {
  APARTMENT: '/images/categories/apartment.jpg',
  HOUSE: '/images/categories/house.jpg',
  OFFICE: '/images/categories/office.jpg',
  SHOP: '/images/categories/shop.jpg',
  GYM: '/images/categories/gym.jpg',
  CAFE: '/images/categories/cafe.jpg',
  OTHER: '/images/categories/other.jpg',
  LAND: '/images/categories/land.jpg',
  RIAD: '/images/categories/riad.jpg',
  VILLA: '/images/categories/villa.jpg',
};

interface CategoriesSectionProps {
  onSelectCategory?: (category: PropertyCategory) => void;
  selectedCategory?: string;
}

export const CategoriesSection: React.FC<CategoriesSectionProps> = ({
  onSelectCategory,
  selectedCategory = '',
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: categoryCounts, isLoading } = useCategoryCounts();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 280;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const categories = (Array.isArray(categoryCounts) ? categoryCounts : [])
    .map((item) => ({
      value: item.category,
      label: t(`property.categories.${item.category}`, item.category.replace(/_/g, ' ')),
      count: item.count,
      growthRate: item.growthRate ?? 0,
      icon: ICON_MAP[item.category] || Tag,
      image: CATEGORY_IMAGES[item.category] || '/images/categories/other.jpg',
    }))
    .sort((a, b) => b.count - a.count);

  const handleCategoryClick = (categoryValue: string) => {
    if (onSelectCategory) {
      onSelectCategory(categoryValue as PropertyCategory);
    } else {
      navigate(`/search?category=${encodeURIComponent(categoryValue)}`);
    }
  };

  return (
    <section
      className="py-14 bg-gradient-to-b from-white via-slate-50/50 to-white dark:from-slate-900 dark:via-slate-900/50 dark:to-slate-900"
      aria-labelledby="categories-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-8 flex items-end justify-between"
          initial={{ opacity: 0.01, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h2
              id="categories-heading"
              className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight"
            >
              {t('home.categories.title', 'Explorer par catégorie')}
            </h2>
            <p className="mt-3 text-base text-slate-500 dark:text-slate-400 max-w-xl">
              {t('home.categories.subtitle', 'Trouvez des biens dans votre catégorie préférée')}
            </p>
            <div className="mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-gold-400 to-teal-500" />
          </div>

          {/* Scroll arrows - hidden on mobile */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="p-2.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition focus:outline-none focus:ring-2 focus:ring-teal-500"
              aria-label={t('common.previous', 'Précédent')}
            >
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition focus:outline-none focus:ring-2 focus:ring-teal-500"
              aria-label={t('common.next', 'Suivant')}
            >
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex gap-4 overflow-hidden pb-4" role="list" aria-label={t('home.categories.loading', 'Chargement des catégories')}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[200px] sm:w-[220px] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 animate-pulse"
                role="listitem"
              >
                <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto mb-4" />
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mx-auto mb-2" />
                <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded mx-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div className="relative group">
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory scroll-smooth scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              role="list"
              aria-label={t('home.categories.list', 'Liste des catégories')}
            >
              {categories.map((category) => {
                const IconComponent = category.icon;
                const isSelected = selectedCategory === category.value;
                const isPositiveGrowth = category.growthRate >= 0;

                return (
                  <motion.button
                    key={category.value}
                    onClick={() => handleCategoryClick(category.value)}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.97 }}
                    className={`group relative flex-shrink-0 w-[200px] sm:w-[220px] snap-start flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all duration-300 overflow-hidden text-left focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                      isSelected
                        ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white border-transparent shadow-lg shadow-teal-500/25 dark:shadow-teal-400/20'
                        : 'bg-white dark:bg-slate-800 border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 hover:border-teal-300/50 dark:hover:border-teal-500/30 hover:shadow-lg dark:hover:shadow-slate-900/50'
                    }`}
                    role="listitem"
                    aria-label={t('home.categories.ariaLabel', { label: category.label, count: category.count })}
                  >
                    {/* Background image with overlay */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <img
                        src={category.image}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent" />
                    </div>

                    {/* Icon Circle */}
                    <div
                      className={`relative flex items-center justify-center w-16 h-16 rounded-full transition-colors duration-300 ${
                        isSelected
                          ? 'bg-white/20'
                          : 'bg-gradient-to-br from-teal-500/10 to-teal-600/5 dark:from-teal-400/10 dark:to-teal-500/5 group-hover:from-teal-500/20 group-hover:to-teal-600/10'
                      }`}
                    >
                      <IconComponent
                        size={28}
                        className={isSelected ? 'text-white' : 'text-teal-600 dark:text-teal-400'}
                        aria-hidden="true"
                      />
                    </div>

                    {/* Label & Count */}
                    <div className="relative flex flex-col items-center gap-1">
                      <p className="text-sm font-bold leading-tight">{category.label}</p>
                      <p
                        className={`text-xs font-medium ${
                          isSelected ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {t('home.categories.listings', { count: category.count, defaultValue: `${category.count} annonces` })}
                      </p>
                      {/* Growth rate */}
                      <div
                        className={`flex items-center gap-0.5 text-[10px] font-bold ${
                          isSelected
                            ? 'text-white/90'
                            : isPositiveGrowth
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isPositiveGrowth ? (
                          <TrendingUp className="w-3 h-3" aria-hidden="true" />
                        ) : (
                          <TrendingDown className="w-3 h-3" aria-hidden="true" />
                        )}
                        <span>
                          {isPositiveGrowth ? '+' : ''}
                          {category.growthRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Selection indicator */}
                    {isSelected && (
                      <motion.div
                        layoutId="category-selection"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-white/60"
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Fade edges */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white dark:from-slate-900 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white dark:from-slate-900 to-transparent" />
          </div>
        )}
      </div>
    </section>
  );
};
