import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import { propertyApi } from '../api/propertyApi';
import { HeroSection } from '../components/home/HeroSection';
import { CategoriesSection } from '../components/home/CategoriesSection';
import { PropertiesSection } from '../components/home/PropertiesSection';
import { TopOwnersSection } from '../components/home/TopOwnersSection';
import { CityShowcaseSection } from '../components/home/CityShowcaseSection';
import { ReviewsSection } from '../components/home/ReviewsSection';
import { StatsSection } from '../components/home/StatsSection';
import { SponsoredAdsSection } from '../components/home/SponsoredAdsSection';
import { TrustBandSection } from '../components/home/TrustBandSection';
import { ChatbotFAB } from '../components/ChatbotFAB';
import { SearchFilters, PropertyCategory } from '../types';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  const scrollToProperties = useCallback(() => {
    document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const buildSearchUrl = (params: SearchFilters) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        searchParams.set(key, String(value));
      }
    });
    return `/search?${searchParams.toString()}`;
  };

  const handleSearch = useCallback(async (params: SearchFilters) => {
    const hasRealFilter = Object.values(params).some(v => v !== undefined && v !== '' && v !== null);
    if (hasRealFilter) {
      navigate(buildSearchUrl(params));
      return;
    }
    scrollToProperties();
    try {
      await propertyApi.search(params);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Search error:', err);
      }
    }
  }, [scrollToProperties, navigate]);

  const handleCategorySelect = useCallback((category: PropertyCategory) => {
    handleSearch({ category });
  }, [handleSearch]);

  return (
    <motion.div
      className="min-h-screen relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {/* Adaptive page background */}
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat transition-all duration-700"
        style={{ backgroundImage: "url('/images/hero-bg.jpeg')" }}
      />
      <div className="fixed inset-0 -z-10 bg-white/92 dark:bg-slate-950/92 transition-colors duration-700" />
      {/* Scroll Progress */}
      <motion.div
        className="fixed left-0 right-0 top-0 z-[60] h-1 origin-left bg-gradient-to-r from-morocco-gold via-morocco-emerald to-morocco-atlas"
        style={{ scaleX }}
      />

      {/* Hero — entrance animation handled internally with parallax */}
      <HeroSection onSearch={handleSearch} />

      {/* Trust Band */}
      <TrustBandSection />

      {/* Categories */}
      <div id="categories">
        <CategoriesSection
          selectedCategory=""
          onSelectCategory={handleCategorySelect}
        />
      </div>

      {/* Properties */}
      <div id="properties">
        <PropertiesSection />
      </div>

      {/* Top Owners */}
      <TopOwnersSection />

      {/* City Showcase */}
      <CityShowcaseSection />

      {/* Reviews */}
      <ReviewsSection />

      {/* Stats */}
      <StatsSection />

      {/* Sponsored Ads */}
      <SponsoredAdsSection />

      {/* Chatbot -- Footer is rendered globally in App.tsx */}
      <ChatbotFAB />
    </motion.div>
  );
};
