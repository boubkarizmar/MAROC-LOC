import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, MapPin, Tag, Zap, Plus, X, Loader,
  Building, Store, Mountain, Crown, TreePine, Coffee, Dumbbell,
} from 'lucide-react';
import { propertyApi } from '../api/propertyApi';
import { useTranslation } from 'react-i18next';

interface Category {
  value: string;
  label: string;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  count?: number;
}

const ICON_MAP: { [key: string]: React.FC<React.SVGProps<SVGSVGElement>> } = {
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

interface CategoriesSectionProps {
  onSelectCategory?: (selection: {
    category?: string;
    customCategory?: string;
    value?: string;
  }) => void;
  selectedCategory?: string;
}

export const CategoriesSection: React.FC<CategoriesSectionProps> = ({
  onSelectCategory,
  selectedCategory = '',
}) => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // Load categories from API
  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      try {
        const response = await propertyApi.getCategories();
        const cats = Array.isArray(response.data) ? response.data : [];
        const enriched = cats.map((cat) => ({
          value: cat,
          label: t(`property.categories.${cat}`, cat.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase())),
          icon: ICON_MAP[cat] || Tag,
        }));
        setCategories(enriched);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Failed to load categories:', error);
        }
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [t]);

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    setIsAddingCategory(true);
    try {
      const customCat: Category = {
        value: `CUSTOM_${Date.now()}`,
        label: newCategory,
        icon: Tag,
        count: 0,
      };
      setCustomCategories([...customCategories, customCat]);
      setNewCategory('');
      setShowAddModal(false);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to add category:', error);
      }
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleRemoveCustomCategory = (value: string) => {
    setCustomCategories(customCategories.filter(cat => cat.value !== value));
  };

  const allCategories = [
    ...(Array.isArray(categories) ? categories : []),
    ...(Array.isArray(customCategories) ? customCategories : []),
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
  };

  return (
    <section className="py-14 bg-gradient-to-b from-white via-slate-50/50 to-white dark:from-slate-900 dark:via-slate-900/50 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-10 text-center sm:text-left"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
            {t('home.categories.title')}
          </h2>
          <p className="mt-3 text-base text-slate-500 dark:text-slate-400 max-w-xl">
            {t('home.categories.subtitle')}
          </p>
          <div className="mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-gold-400 to-teal-500 mx-auto sm:mx-0" />
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader className="w-7 h-7 animate-spin text-teal-500" />
            <span className="ml-3 text-slate-500 dark:text-slate-400 font-medium">
              {t('home.categories.loading')}
            </span>
          </div>
        ) : (
          <>
            {/* Categories Grid — responsive scroll on mobile, grid on desktop */}
            <motion.div
              className="overflow-x-auto pb-6 -mx-4 px-4 sm:overflow-visible sm:mx-0 sm:px-0"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="flex sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 min-w-max sm:min-w-0">
                {allCategories.map((category) => {
                  const IconComponent = category.icon || Tag;
                  const isSelected = selectedCategory === category.value;

                  return (
                    <motion.button
                      key={category.value}
                      onClick={() => {
                        const selection = category.value.startsWith('CUSTOM_')
                          ? { customCategory: category.label, value: category.value }
                          : { category: category.value, customCategory: '', value: category.value };
                        onSelectCategory?.(selection);
                      }}
                      variants={itemVariants}
                      whileHover={{ y: -4, transition: { duration: 0.2 } }}
                      whileTap={{ scale: 0.97 }}
                      className={`group relative flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border transition-all duration-300 min-w-[140px] sm:min-w-0 ${
                        isSelected
                          ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white border-transparent shadow-lg shadow-teal-500/25 dark:shadow-teal-400/20'
                          : 'bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 hover:border-teal-300/50 dark:hover:border-teal-500/30 hover:shadow-lg dark:hover:shadow-slate-900/50'
                      }`}
                    >
                      {/* Icon Circle */}
                      <div className={`flex items-center justify-center w-12 h-12 rounded-xl transition-colors duration-300 ${
                        isSelected
                          ? 'bg-white/20'
                          : 'bg-gradient-to-br from-teal-500/10 to-teal-600/5 dark:from-teal-400/10 dark:to-teal-500/5 group-hover:from-teal-500/20 group-hover:to-teal-600/10'
                      }`}>
                        <IconComponent size={24} className={isSelected ? 'text-white' : 'text-teal-600 dark:text-teal-400'} />
                      </div>

                      {/* Label & Count */}
                      <div className="flex flex-col items-center gap-1">
                        <p className="text-sm font-bold leading-tight">{category.label}</p>
                        {typeof category.count === 'number' && category.count > 0 && (
                          <p className={`text-xs font-medium ${isSelected ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'}`}>
                            {t('home.categories.listings', { count: category.count })}
                          </p>
                        )}
                      </div>

                      {/* Selection indicator */}
                      {isSelected && (
                        <motion.div
                          layoutId="category-selection"
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-white/60"
                        />
                      )}

                      {/* Remove button for custom categories */}
                      {customCategories.some(c => c.value === category.value) && (
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveCustomCategory(category.value);
                          }}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                        >
                          <X size={12} />
                        </motion.button>
                      )}
                    </motion.button>
                  );
                })}

                {/* Add Category Button */}
                <motion.button
                  onClick={() => setShowAddModal(true)}
                  variants={itemVariants}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.97 }}
                  className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-teal-400 dark:hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50/30 dark:hover:bg-teal-900/10 transition-all duration-300 min-w-[140px] sm:min-w-0"
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700/50">
                    <Plus size={24} />
                  </div>
                  <p className="text-sm font-semibold">{t('home.categories.addCustom')}</p>
                </motion.button>
              </div>
            </motion.div>

            {/* Add Category Modal */}
            <AnimatePresence>
              {showAddModal && (
                <motion.div
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowAddModal(false)}
                >
                  <motion.div
                    className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700"
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">
                      {t('home.categories.addCustomTitle')}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                      {t('home.categories.addCustomDesc', 'Créez une catégorie personnalisée pour votre bien')}
                    </p>

                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder={t('home.categories.customPlaceholder')}
                      className="w-full px-4 py-3.5 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent mb-6 transition bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                      autoFocus
                    />

                    <div className="flex gap-3">
                      <motion.button
                        onClick={() => setShowAddModal(false)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                      >
                        {t('common.cancel')}
                      </motion.button>
                      <motion.button
                        onClick={handleAddCategory}
                        disabled={!newCategory.trim() || isAddingCategory}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 shadow-md shadow-teal-500/20"
                      >
                        {isAddingCategory ? (
                          <>
                            <Loader size={16} className="animate-spin" />
                            {t('home.categories.adding')}
                          </>
                        ) : (
                          t('common.add')
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </section>
  );
};
