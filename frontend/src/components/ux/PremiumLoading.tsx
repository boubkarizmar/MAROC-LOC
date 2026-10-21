import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Sparkles, Building2, Search, MessageSquare, Loader2 } from 'lucide-react';

// ─── AI Brain Loading ───────────────────────────────────────────────
export const AIBrainLoading: React.FC<{ message?: string; className?: string }> = ({
  message,
  className = '',
}) => {
  const { t } = useTranslation();
  const finalMessage = message || t('loading.aiAnalyzing');
  return (
    <div className={`flex flex-col items-center justify-center gap-4 py-12 ${className}`}>
      <div className="relative h-16 w-16">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-2 border-dashed border-morocco-emerald/30"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-2 rounded-full border-2 border-dotted border-morocco-gold/40"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles size={24} className="text-amber-500" />
        </div>
      </div>
      <motion.p
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-sm font-medium text-slate-500"
      >
        {finalMessage}
      </motion.p>
    </div>
  );
};

// ─── Property Card Skeleton Premium ─────────────────────────────────
export const PropertyCardSkeleton: React.FC<{ count?: number; layout?: 'grid' | 'list' }> = ({
  count = 3,
  layout = 'grid',
}) => {
  return (
    <div className={layout === 'grid' ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3' : 'grid gap-4'}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.08 }}
          className="overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm"
        >
          <div className="relative h-56 overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100"
              animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              style={{ backgroundSize: '200% 100%' }}
            />
            <div className="absolute top-3 left-3 h-6 w-20 rounded-full bg-white/30 backdrop-blur" />
            <div className="absolute top-3 right-3 h-10 w-10 rounded-full bg-white/30 backdrop-blur" />
          </div>
          <div className="p-5 space-y-3">
            <div className="h-5 w-3/4 rounded-lg bg-slate-200 animate-pulse" />
            <div className="h-4 w-1/2 rounded-lg bg-slate-200 animate-pulse" />
            <div className="flex gap-2 pt-1">
              <div className="h-9 flex-1 rounded-xl bg-slate-200 animate-pulse" />
              <div className="h-9 flex-1 rounded-xl bg-slate-200 animate-pulse" />
              <div className="h-9 flex-1 rounded-xl bg-slate-200 animate-pulse" />
            </div>
            <div className="h-8 w-1/3 rounded-lg bg-slate-200 animate-pulse mt-2" />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// ─── Search Skeleton ────────────────────────────────────────────────
export const SearchSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`space-y-6 ${className}`}>
    {/* Search bar skeleton */}
    <div className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
    {/* Tabs skeleton */}
    <div className="flex gap-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-11 w-28 rounded-full bg-slate-100 animate-pulse" />
      ))}
    </div>
    {/* Results count */}
    <div className="h-5 w-40 rounded-lg bg-slate-100 animate-pulse" />
    {/* Cards */}
    <PropertyCardSkeleton count={6} />
  </div>
);

// ─── Chat Typing Indicator ──────────────────────────────────────────
export const ChatTypingIndicator: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-bl-md bg-slate-100 w-fit ${className}`}>
    <motion.span
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
      className="h-2 w-2 rounded-full bg-teal-600"
    />
    <motion.span
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
      className="h-2 w-2 rounded-full bg-teal-600"
    />
    <motion.span
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
      className="h-2 w-2 rounded-full bg-teal-600"
    />
  </div>
);

// ─── Page Transition Loader ─────────────────────────────────────────
export const PageTransitionLoader: React.FC = () => {
  const { t } = useTranslation();
  return (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-morocco-pearl/80 backdrop-blur-sm">
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className="flex flex-col items-center gap-4"
    >
      <div className="relative h-12 w-12">
        <Loader2 size={48} className="text-teal-600 animate-spin" />
      </div>
      <p className="text-sm font-medium text-slate-500">{t('common.loading')}</p>
    </motion.div>
  </div>
  );
};

// ─── Smart Section Loader ───────────────────────────────────────────
interface SmartSectionLoaderProps {
  variant?: 'properties' | 'search' | 'chat' | 'dashboard' | 'generic';
  message?: string;
  className?: string;
}

export const SmartSectionLoader: React.FC<SmartSectionLoaderProps> = ({
  variant = 'generic',
  message,
  className = '',
}) => {
  const { t } = useTranslation();
  const configs = {
    properties: { icon: Building2, defaultMsg: t('loading.properties') },
    search: { icon: Search, defaultMsg: t('loading.search') },
    chat: { icon: MessageSquare, defaultMsg: t('loading.chat') },
    dashboard: { icon: Building2, defaultMsg: t('loading.dashboard') },
    generic: { icon: Loader2, defaultMsg: t('common.loading') },
  };
  const config = configs[variant];
  const Icon = config.icon;

  return (
    <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      >
        <Icon size={32} className="text-teal-600" />
      </motion.div>
      <motion.p
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.8, repeat: Infinity }}
        className="mt-4 text-sm text-slate-500 font-medium"
      >
        {message || config.defaultMsg}
      </motion.p>
    </div>
  );
};

// ─── Progressive Image Loader ───────────────────────────────────────
export const ProgressiveImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  placeholderColor?: string;
}> = ({ src, alt, className = '', placeholderColor = 'var(--color-gray-100)' }) => {
  const [loaded, setLoaded] = React.useState(false);

  return (
    <div className="relative overflow-hidden" style={{ backgroundColor: placeholderColor }}>
      {!loaded && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100"
          animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          style={{ backgroundSize: '200% 100%' }}
        />
      )}
      <img
        src={src}
        alt={alt}
        className={`transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
};

// All components exported as named exports above
