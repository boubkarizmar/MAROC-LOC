import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Crown, Search, MapPin, Sparkles, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { useCities } from '../../hooks/useCities';
import { useTransactionTypes } from '../../hooks/useTransactionTypes';
import { useTopRanked } from '../../hooks/useTopRanked';
import { useCategoryCounts } from '../../hooks/useHomepageData';
import { useAnimatedStats } from '../../hooks/useHomepageData';
import { fixImageUrl } from '../../utils/imageUtils';
import { AdvancedFilterPanel } from '../filters/AdvancedFilterPanel';
import { SearchFilters } from '../../types';

interface HeroSectionProps {
  onSearch: (params: SearchFilters) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onSearch }) => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('RENT');
  const [city, setCity] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<SearchFilters>({});
  const sectionRef = useRef<HTMLElement>(null);
  const isInitializingRef = useRef(true);

  const { data: cities, isLoading: citiesLoading } = useCities();
  const { data: transactionTypes } = useTransactionTypes();
  const { data: topRanked, isLoading: topLoading } = useTopRanked(1);
  const { data: categoryCounts, isLoading: categoriesLoading } = useCategoryCounts();
  const { data: animatedStats } = useAnimatedStats();

  const featuredProperty = topRanked?.[0];

  // ─── URL sync for shareable filtered links ─────────────────────────
  // Parse advanced filters from URL (mirrors Search.tsx logic)
  const parseAdvancedFilters = (params: URLSearchParams): SearchFilters => {
    const getNumber = (key: string) => {
      const value = params.get(key);
      return value ? parseInt(value, 10) : undefined;
    };
    return {
      type: (params.get('type') as any) || undefined,
      category: (params.get('category') as any) || undefined,
      minPrice: getNumber('minPrice'),
      maxPrice: getNumber('maxPrice'),
      minRooms: getNumber('minRooms'),
      maxRooms: getNumber('maxRooms'),
      minSurface: getNumber('minSurface'),
      maxSurface: getNumber('maxSurface'),
      furnished: params.get('furnished') === 'true' || undefined,
      hasParking: params.get('hasParking') === 'true' || undefined,
      hasPool: params.get('hasPool') === 'true' || undefined,
      hasElevator: params.get('hasElevator') === 'true' || undefined,
      hasAirConditioning: params.get('hasAirConditioning') === 'true' || undefined,
      hasSecurity: params.get('hasSecurity') === 'true' || undefined,
      hasInternet: params.get('hasInternet') === 'true' || undefined,
      hasBalcony: params.get('hasBalcony') === 'true' || undefined,
      gardenView: params.get('gardenView') === 'true' || undefined,
      petAllowed: params.get('petAllowed') === 'true' || undefined,
      cityCenter: params.get('cityCenter') === 'true' || undefined,
      nearSchool: params.get('nearSchool') === 'true' || undefined,
      nearUniversity: params.get('nearUniversity') === 'true' || undefined,
      nearMosque: params.get('nearMosque') === 'true' || undefined,
      nearHospital: params.get('nearHospital') === 'true' || undefined,
      nearMarket: params.get('nearMarket') === 'true' || undefined,
      nearTram: params.get('nearTram') === 'true' || undefined,
      nearBus: params.get('nearBus') === 'true' || undefined,
      nearTrainStation: params.get('nearTrainStation') === 'true' || undefined,
    };
  };

  // Initialize form state from URL once
  useEffect(() => {
    const urlType = searchParams.get('type') || searchParams.get('propertyType') || 'RENT';
    const urlCity = searchParams.get('city') || '';
    const urlKeyword = searchParams.get('keyword') || '';
    const urlCategory = searchParams.get('category') || '';

    setActiveTab(urlType);
    setCity(urlCity);
    setKeyword(urlKeyword);
    setSelectedCategory(urlCategory);
    setAdvancedFilters(parseAdvancedFilters(searchParams));

    // Allow a tick before we start pushing URL updates back
    requestAnimationFrame(() => {
      isInitializingRef.current = false;
    });
  }, []);

  // Push local filter changes to URL (debounced for keyword)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (isInitializingRef.current) return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (city) params.set('city', city);
      if (keyword) params.set('keyword', keyword);
      if (activeTab && activeTab !== 'RENT') params.set('type', activeTab);
      if (selectedCategory) params.set('category', selectedCategory);

      Object.entries(advancedFilters).forEach(([key, value]) => {
        if (value === undefined || value === '' || value === null || value === false) return;
        params.set(key, String(value));
      });

      setSearchParams(params, { replace: true });
    }, 350);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [city, keyword, activeTab, selectedCategory, advancedFilters, setSearchParams]);

  const handleResetFilters = () => {
    setAdvancedFilters({});
    setCity('');
    setKeyword('');
    setSelectedCategory('');
    setActiveTab('RENT');
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  // ─── Parallax scroll effect ───────────────────────────────────────
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const videoY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '15%']);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const featuredScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      city,
      type: activeTab as any,
      keyword,
      category: selectedCategory as any,
      ...advancedFilters,
    });
  };

  const handleAdvancedApply = () => {
    setShowAdvanced(false);
    onSearch({
      city,
      type: activeTab as any,
      keyword,
      category: selectedCategory as any,
      ...advancedFilters,
    });
  };

  const tabs: { value: string; label: string }[] = transactionTypes?.length
    ? transactionTypes.map((tt: any) => ({
        value: tt.value,
        label: t(`property.types.${tt.value}`, tt.label) as string,
      }))
    : [
        { value: 'RENT', label: t('property.types.RENT', 'Location') as string },
        { value: 'BUY', label: t('property.types.BUY', 'Achat') as string },
        { value: 'MORTGAGE', label: t('property.types.MORTGAGE', 'Rahn') as string },
      ];

  const stats = animatedStats
    ? [
        { value: animatedStats.totalProperties, label: t('stats.properties', 'Biens') },
        { value: animatedStats.totalUsers, label: t('stats.users', 'Utilisateurs') },
        { value: animatedStats.totalCities, label: t('stats.cities', 'Villes') },
      ]
    : null;

  return (
    <section ref={sectionRef} className="relative isolate min-h-[92vh] overflow-hidden pt-28">
      {/* Animated Gradient Background (replaces 9.5MB video) */}
      <motion.div className="absolute inset-0 -z-10" style={{ y: videoY }}>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 animate-pulse-soft" />
        <div className="absolute inset-0 bg-radial-primary" />
        <div className="absolute inset-0 bg-radial-gold" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 via-transparent to-slate-950/40" />
        <div className="absolute inset-0 bg-radial-darken" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[color:var(--color-bg)] to-transparent" />
      </motion.div>

      {/* Content with Parallax */}
      <motion.div
        className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-4 pb-24 pt-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        <motion.div
          initial={{ opacity: 0.01, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Badge */}
          <motion.span
            className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-4 py-2 text-sm font-bold text-gold-300 shadow-sm backdrop-blur-md"
            initial={{ opacity: 0.01, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Crown size={16} className="text-gold-400" />
            <span>{t('home.hero.badge', "L'immobilier intelligent pour une nouvelle génération.")}</span>
          </motion.span>

          {/* Title */}
          <motion.h1
            className="mt-7 max-w-4xl text-hero-mobile md:text-hero font-black leading-[0.96] text-white"
            initial={{ opacity: 0.01, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <span className="block">{t('home.hero.title1', "L'art de vivre")}</span>
            <span className="block text-gradient-gold">{t('home.hero.title2', "marocain,")}</span>
            <span className="block">{t('home.hero.title3', "version premium.")}</span>
          </motion.h1>

          <motion.p
            className="mt-7 max-w-2xl text-lg leading-8 text-white/70 md:text-xl"
            initial={{ opacity: 0.01, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.7 }}
          >
            {t('home.hero.description', 'Explorez des villas, appartements, riads et espaces professionnels soigneusement sélectionnés avec une expérience digitale inspirée du luxe marocain contemporain.')}
          </motion.p>

          {/* Search Form */}
          <motion.div
            className="mt-10"
            initial={{ opacity: 0.01, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.9, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <form onSubmit={handleSubmit} className="rounded-[2rem] p-3 text-left bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-2xl" role="search">
              {/* Tabs */}
              <div className="flex flex-wrap gap-2 border-b border-white/10 px-2 pb-3">
                {tabs.map((tab) => {
                  const active = activeTab === tab.value;
                  return (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => setActiveTab(tab.value)}
                      className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold transition sm:flex-none ${
                        active
                          ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-slate-950 shadow-gold-sm'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                      aria-pressed={active}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Fields */}
              <div className="grid gap-3 p-2 lg:grid-cols-[1.2fr_0.9fr_auto]">
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-gold-400">
                    <Sparkles size={14} aria-hidden="true" />
                    {t('property.search.keyword', 'Mots-clés')}
                  </span>
                  <span className="relative block">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gold-400" aria-hidden="true" />
                    <input
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder={t('search.placeholder')}
                      className="w-full h-14 pl-12 pr-4 rounded-xl bg-white/10 text-white border border-white/10 placeholder:text-white/40 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:bg-white/15 transition-all duration-150 outline-none"
                      aria-label={t('property.search.keyword', 'Mots-clés')}
                    />
                  </span>
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-gold-400">
                    <MapPin size={14} aria-hidden="true" />
                    {t('property.search.city', 'Ville')}
                  </span>
                  {citiesLoading ? (
                    <div className="h-14 flex items-center px-4 rounded-xl bg-white/10 border border-white/10">
                      <div className="h-4 w-24 bg-white/20 rounded animate-pulse" />
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full h-14 px-4 pr-10 rounded-xl bg-white/10 text-white border border-white/10 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition-all duration-150 outline-none appearance-none"
                        aria-label={t('property.search.city', 'Ville')}
                      >
                        <option value="" className="bg-slate-900 text-white">{t('property.search.cityPlaceholder', 'Toutes les villes')}</option>
                        {(cities || []).map((item: string) => (
                          <option key={item} value={item} className="bg-slate-900 text-white">{item}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 pointer-events-none" aria-hidden="true" />
                    </div>
                  )}
                </label>

                <div className="flex items-end">
                  <button type="submit" className="inline-flex items-center justify-center gap-2 h-14 w-full lg:w-auto px-8 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-slate-950 font-bold shadow-gold-sm hover:shadow-gold hover:scale-[1.02] active:scale-[0.98] transition-all duration-150" aria-label={t('property.search.submit', 'Rechercher')}>
                    <Search size={18} aria-hidden="true" />
                    {t('search.button')}
                  </button>
                </div>
              </div>

              {/* Category chips */}
              <div className="px-2 pb-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-gold-400/80">
                    {t('common.category', 'Catégorie')}
                  </span>
                </div>
                {categoriesLoading ? (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-9 w-24 bg-white/10 rounded-full animate-pulse flex-shrink-0" />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(categoryCounts || []).slice(0, 8).map((cat) => {
                      const active = selectedCategory === cat.category;
                      return (
                        <button
                          key={cat.category}
                          type="button"
                          onClick={() => {
                        const newCat = active ? '' : cat.category;
                        setSelectedCategory(newCat);
                        onSearch({
                          city,
                          type: activeTab as any,
                          keyword,
                          category: newCat as any,
                          ...advancedFilters,
                        });
                      }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                            active
                              ? 'bg-gold-500 text-slate-950'
                              : 'bg-slate-800/50 text-white hover:bg-slate-700/60 hover:text-white border border-white/15'
                          }`}
                        >
                          {t(`property.categories.${cat.category}`, cat.category)}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-slate-950/10' : 'bg-white/10'}`}>
                            {cat.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Advanced filters button */}
              <div className="px-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(true)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gold-400/80 hover:text-gold-400 transition-colors"
                >
                  <SlidersHorizontal size={14} />
                  {t('property.search.showAdvanced', 'Filtres avancés')}
                </button>
              </div>
            </form>
          </motion.div>

          {/* Stats row */}
          {stats && (
            <motion.div
              className="mt-8 flex flex-wrap items-center gap-6 text-white/50 text-sm"
              initial={{ opacity: 0.01 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
            >
              {stats.map((stat, idx) => (
                <React.Fragment key={stat.label}>
                  {idx > 0 && <div className="w-px h-4 bg-white/20" />}
                  <div className="flex items-center gap-2">
                    <span className="text-gold-400 font-bold text-lg">
                      {stat.value >= 1000 ? `${(stat.value / 1000).toFixed(1).replace(/\.0$/, '')}K` : stat.value}
                    </span>
                    <span>{stat.label}</span>
                  </div>
                </React.Fragment>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Featured Property Card with Parallax Scale */}
        <motion.div
          initial={{ opacity: 0.01, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="hidden lg:block"
          style={{ scale: featuredScale }}
        >
          <div className="glass rounded-[2.2rem] p-4 border border-white/10">
            <div className="relative h-[520px] overflow-hidden rounded-[1.8rem]">
              {featuredProperty ? (
                <>
                  <img
                    src={featuredProperty.images?.[0] ? fixImageUrl(featuredProperty.images[0]) : '/images/hero-bg.jpeg'}
                    alt={featuredProperty.title}
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/hero-bg.jpeg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Badge */}
                  <div className="absolute top-5 left-5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold-500 text-slate-950 text-xs font-bold">
                      <Crown size={12} />
                      {t('home.hero.featured', 'Sélection du moment')}
                    </span>
                  </div>

                  <div className="absolute bottom-0 p-7 text-white">
                    <p className="text-sm font-bold uppercase tracking-[0.22em] text-gold-400">
                      {featuredProperty.city}
                    </p>
                    <h2 className="mt-2 text-2xl font-black">{featuredProperty.title}</h2>
                    <p className="mt-2 text-white/70 text-sm line-clamp-2">{featuredProperty.description}</p>
                    <div className="mt-4 flex items-center gap-4">
                      <span className="text-2xl font-black text-gold-400">
                        {featuredProperty.price?.toLocaleString()} {t('common.currency')}
                      </span>
                      <span className="text-white/50 text-sm">
                        {featuredProperty.surface} {t('common.squareMeter')} · {featuredProperty.rooms} {t('common.rooms')}
                      </span>
                    </div>
                  </div>
                </>
              ) : topLoading ? (
                <div className="h-full w-full bg-white/10 animate-pulse rounded-[1.8rem]" />
              ) : (
                <>
                  <img
                    src="/images/hero-bg.jpeg"
                    alt="Villa premium"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 p-7 text-white">
                    <p className="text-sm font-bold uppercase tracking-[0.22em] text-gold-400">
                      {t('home.hero.featured', 'Sélection du moment')}
                    </p>
                    <h2 className="mt-2 text-2xl font-black">{t('home.hero.featuredFallback', 'Riad moderne, Marrakech')}</h2>
                    <p className="mt-2 text-white/70">{t('home.hero.featuredDesc', 'Architecture artisanale, confort hôtelier, gestion digitale.')}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30 z-10"
        initial={{ opacity: 0.01, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.6 }}
      >
        <span className="text-xs font-medium uppercase tracking-widest">{t('home.hero.scroll', 'Découvrir')}</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown size={20} />
        </motion.div>
      </motion.div>

      {/* Advanced Filter Panel */}
      <AdvancedFilterPanel
        filters={advancedFilters}
        onChange={setAdvancedFilters}
        onApply={handleAdvancedApply}
        onReset={handleResetFilters}
        isOpen={showAdvanced}
        onClose={() => setShowAdvanced(false)}
      />
    </section>
  );
};
