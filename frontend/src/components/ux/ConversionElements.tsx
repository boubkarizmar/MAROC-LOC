import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Zap, Crown, ArrowRight, X, Sparkles,
  TrendingUp, Users, Clock, CheckCircle2,
  ChevronRight, Star, Gift, Flame, ShieldCheck
} from 'lucide-react';
import { Button } from '../ui/Button';

// ─── Premium Upsell Banner ──────────────────────────────────────────
interface PremiumBannerProps {
  variant?: 'inline' | 'floating' | 'sticky';
  onUpgrade: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const PremiumBanner: React.FC<PremiumBannerProps> = ({
  variant = 'inline',
  onUpgrade,
  onDismiss,
  className = '',
}) => {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const premiumFeatures = [
    t('premium.feature.highlighting'),
    t('premium.feature.analytics'),
    t('premium.feature.support'),
  ];

  const content = (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-morocco-royal via-morocco-emerald to-morocco-atlas p-5 text-white ${className}`}>
      <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-16 w-16 rounded-full bg-white/10" />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
          <Crown size={24} className="text-amber-500" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-lg">{t('premium.title')}</h4>
          <p className="text-white/80 text-sm mt-1">
            {t('premium.subtitle')}
          </p>
          <div className="flex flex-wrap gap-3 mt-3">
            {premiumFeatures.map((item) => (
              <span key={item} className="inline-flex items-center gap-1 text-xs bg-white/15 rounded-full px-2.5 py-1">
                <CheckCircle2 size={12} /> {item}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={onUpgrade}
            rightIcon={<ArrowRight size={16} />}
          >
            {t('premium.discover')}
          </Button>
          {onDismiss && (
            <button
              onClick={() => { setDismissed(true); onDismiss(); }}
              className="p-2 rounded-lg hover:bg-white/10 transition"
              aria-label={t('common.close')}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (variant === 'sticky') {
    return (
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 z-40 p-4"
      >
        {content}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      {content}
    </motion.div>
  );
};

// ─── Urgency Banner ─────────────────────────────────────────────────
interface UrgencyBannerProps {
  type: 'view_count' | 'price_drop' | 'limited_time' | 'last_unit';
  value?: string | number;
  expiryTime?: Date;
  className?: string;
}

export const UrgencyBanner: React.FC<UrgencyBannerProps> = ({
  type,
  value,
  expiryTime,
  className = '',
}) => {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!expiryTime) return;
    const interval = setInterval(() => {
      const diff = expiryTime.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('00:00:00'); return; }
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setTimeLeft(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [expiryTime]);

  const configs = {
    view_count: {
      icon: Users,
      color: 'bg-orange-50 border-orange-200 text-orange-800',
      iconColor: 'text-orange-500',
      text: t('urgency.viewCount', { count: value }),
    },
    price_drop: {
      icon: TrendingUp,
      color: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      iconColor: 'text-emerald-500',
      text: t('urgency.priceDrop', { value }),
    },
    limited_time: {
      icon: Clock,
      color: 'bg-red-50 border-red-200 text-red-800',
      iconColor: 'text-red-500',
      text: t('urgency.limitedTime', { timeLeft }),
    },
    last_unit: {
      icon: Flame,
      color: 'bg-red-50 border-red-200 text-red-800',
      iconColor: 'text-red-500',
      text: t('urgency.lastUnit'),
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium ${config.color} ${className}`}
    >
      <Icon size={16} className={config.iconColor} />
      <span>{config.text}</span>
    </motion.div>
  );
};

// ─── Social Proof Popup ─────────────────────────────────────────────
interface SocialProofPopupProps {
  proofs: Array<{
    text: string;
    location?: string;
    timeAgo: string;
  }>;
  className?: string;
}

export const SocialProofPopup: React.FC<SocialProofPopupProps> = ({
  proofs,
  className = '',
}) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (proofs.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % proofs.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [proofs.length]);

  const proof = proofs[current];
  if (!proof) return null;

  return (
    <div className={`fixed bottom-6 left-6 z-40 max-w-sm ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: -20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -20, scale: 0.95 }}
          transition={{ duration: 0.4 }}
          className="rounded-xl bg-white shadow-lg border border-slate-100 p-3 flex items-start gap-3"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50">
            <Users size={16} className="text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-slate-900 dark:text-slate-50 leading-snug">{proof.text}</p>
            <p className="text-xs text-slate-400 mt-1">
              {proof.location && `${proof.location} · `}{proof.timeAgo}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// ─── Subscription Comparison ────────────────────────────────────────
interface PlanFeature {
  name: string;
  free: boolean | string;
  premium: boolean | string;
}

interface SubscriptionComparisonProps {
  features: PlanFeature[];
  onSelectFree: () => void;
  onSelectPremium: () => void;
  className?: string;
}

export const SubscriptionComparison: React.FC<SubscriptionComparisonProps> = ({
  features,
  onSelectFree,
  onSelectPremium,
  className = '',
}) => {
  const { t } = useTranslation();
  return (
    <div className={`grid md:grid-cols-2 gap-6 ${className}`}>
      {/* Free Plan */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl bg-white border border-slate-200 p-6"
      >
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">{t('plan.free')}</h3>
        <p className="text-slate-500 text-sm mt-1">{t('plan.freeDesc')}</p>
        <p className="text-3xl font-black text-slate-900 dark:text-slate-50 mt-4">0 DH<span className="text-sm font-normal text-slate-400">/{t('plan.month')}</span></p>
        <ul className="mt-6 space-y-3">
          {features.map((f) => (
            <li key={f.name} className="flex items-center gap-2 text-sm">
              {typeof f.free === 'boolean' ? (
                <CheckCircle2 size={16} className={f.free ? 'text-emerald-500' : 'text-slate-300'} />
              ) : (
                <span className="text-xs font-medium text-slate-600">{f.free}</span>
              )}
              <span className={typeof f.free === 'boolean' && !f.free ? 'text-slate-400' : 'text-slate-900 dark:text-slate-50'}>
                {f.name}
              </span>
            </li>
          ))}
        </ul>
        <Button variant="secondary" fullWidth className="mt-6" onClick={onSelectFree}>
          {t('plan.continueFree')}
        </Button>
      </motion.div>

      {/* Premium Plan */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative rounded-2xl bg-gradient-to-br from-morocco-royal to-morocco-emerald p-6 text-white overflow-hidden"
      >
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-bold text-teal-600">
            <Zap size={12} /> {t('plan.recommended')}
          </span>
        </div>
        <h3 className="text-lg font-bold">{t('plan.premium')}</h3>
        <p className="text-white/70 text-sm mt-1">{t('plan.premiumDesc')}</p>
        <p className="text-3xl font-black mt-4">299 DH<span className="text-sm font-normal text-white/60">/{t('plan.month')}</span></p>
        <ul className="mt-6 space-y-3">
          {features.map((f) => (
            <li key={f.name} className="flex items-center gap-2 text-sm">
              {typeof f.premium === 'boolean' ? (
                <CheckCircle2 size={16} className="text-amber-500" />
              ) : (
                <span className="text-xs font-medium text-white/80">{f.premium}</span>
              )}
              <span>{f.name}</span>
            </li>
          ))}
        </ul>
        <Button
          variant="secondary"
          fullWidth
          className="mt-6 bg-white text-teal-600 hover:bg-amber-50"
          onClick={onSelectPremium}
        >
          {t('plan.upgrade')} <ChevronRight size={16} />
        </Button>
      </motion.div>
    </div>
  );
};

// ─── Trust Bar Minimal ──────────────────────────────────────────────
export const TrustBarMinimal: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { t } = useTranslation();
  return (
  <div className={`flex items-center justify-center gap-6 flex-wrap py-2 ${className}`}>
    {[
      { icon: CheckCircle2, label: t('trust.paymentSecure') },
      { icon: ShieldCheck, label: t('trust.verifiedProperties') },
      { icon: Star, label: t('trust.rating') },
    ].map((item) => (
      <div key={item.label} className="flex items-center gap-1.5 text-slate-500">
        <item.icon size={14} className="text-teal-600" />
        <span className="text-xs font-medium">{item.label}</span>
      </div>
    ))}
  </div>
);
};

// ─── AI Recommendation Nudge ────────────────────────────────────────
export const AIRecommendationNudge: React.FC<{
  onExplore: () => void;
  className?: string;
}> = ({ onExplore, className = '' }) => {
  const { t } = useTranslation();
  return (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.01 }}
    className={`cursor-pointer rounded-2xl bg-gradient-to-r from-morocco-royal/5 to-morocco-emerald/5 border border-morocco-emerald/15 p-4 ${className}`}
    onClick={onExplore}
  >
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600/10">
        <Sparkles size={20} className="text-amber-500" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-slate-900 dark:text-slate-50 text-sm">{t('aiRecommendation.title')}</p>
        <p className="text-xs text-slate-500">{t('aiRecommendation.subtitle')}</p>
      </div>
      <ChevronRight size={18} className="text-slate-400" />
    </div>
  </motion.div>
);
};

// ─── Free Trial Badge ───────────────────────────────────────────────
export const FreeTrialBadge: React.FC<{ daysLeft: number; className?: string }> = ({
  daysLeft,
  className = '',
}) => {
  const { t } = useTranslation();
  return (
  <motion.div
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-morocco-gold/20 to-morocco-emerald/20 border border-morocco-gold/30 px-3 py-1.5 ${className}`}
  >
    <Gift size={14} className="text-amber-500" />
    <span className="text-xs font-semibold text-teal-600">
      {t('premium.trialDays', { count: daysLeft })}
    </span>
  </motion.div>
);
};

// All components exported as named exports above
