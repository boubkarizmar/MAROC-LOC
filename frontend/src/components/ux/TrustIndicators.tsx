import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck, BadgeCheck, Lock, Eye, Star,
  Users, Clock, Award, Fingerprint, Globe,
  TrendingUp, CheckCircle2, Sparkles, Crown
} from 'lucide-react';
import { fixMediaUrl } from '../../utils/imageUtils';

// ─── Verification Badge ─────────────────────────────────────────────
interface VerificationBadgeProps {
  level: 'verified' | 'premium' | 'gold' | 'ai-matched' | 'new';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const getBadgeConfig = (t: (key: string) => string) => ({
  verified: {
    icon: ShieldCheck,
    label: t('badge.verified'),
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    iconColor: 'text-emerald-600',
    glow: 'shadow-emerald-100',
  },
  premium: {
    icon: Crown,
    label: t('badge.premium'),
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    iconColor: 'text-amber-600',
    glow: 'shadow-amber-100',
  },
  gold: {
    icon: Award,
    label: t('badge.gold'),
    bg: 'bg-yellow-50',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
    iconColor: 'text-yellow-600',
    glow: 'shadow-yellow-100',
  },
  'ai-matched': {
    icon: Sparkles,
    label: t('badge.aiMatched'),
    bg: 'bg-teal-600/5',
    text: 'text-teal-600',
    border: 'border-morocco-emerald/20',
    iconColor: 'text-amber-500',
    glow: 'shadow-morocco-emerald/10',
  },
  new: {
    icon: BadgeCheck,
    label: t('badge.new'),
    bg: 'bg-primary-50',
    text: 'text-primary-700',
    border: 'border-primary-200',
    iconColor: 'text-primary-500',
    glow: 'shadow-primary-100',
  },
});

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  level,
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  const { t } = useTranslation();
  const config = getBadgeConfig(t)[level];
  const Icon = config.icon;
  const sizes = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  };
  const iconSizes = { sm: 12, md: 14, lg: 16 };

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center rounded-full border font-semibold ${config.bg} ${config.text} ${config.border} ${config.glow} ${sizes[size]} ${className}`}
    >
      <Icon size={iconSizes[size]} className={config.iconColor} />
      {showLabel && config.label}
    </motion.span>
  );
};

// ─── Trust Band ─────────────────────────────────────────────────────
interface TrustBandProps {
  variant?: 'minimal' | 'full' | 'compact';
  className?: string;
}

const useTrustItems = () => {
  const { t } = useTranslation();
  return [
    { icon: ShieldCheck, label: t('trust.items.verified'), desc: t('trust.items.verifiedDesc') },
    { icon: Lock, label: t('trust.items.secure'), desc: t('trust.items.secureDesc') },
    { icon: Eye, label: t('trust.items.transparency'), desc: t('trust.items.transparencyDesc') },
    { icon: Users, label: t('trust.items.localSupport'), desc: t('trust.items.localSupportDesc') },
    { icon: Clock, label: t('trust.items.quickResponse'), desc: t('trust.items.quickResponseDesc') },
    { icon: Fingerprint, label: t('trust.items.identity'), desc: t('trust.items.identityDesc') },
  ];
};

export const TrustBand: React.FC<TrustBandProps> = ({ variant = 'full', className = '' }) => {
  const trustItems = useTrustItems();
  if (variant === 'minimal') {
    return (
      <div className={`flex items-center justify-center gap-6 flex-wrap py-3 ${className}`}>
        {trustItems.slice(0, 3).map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-slate-500">
            <item.icon size={16} className="text-teal-600" />
            <span className="text-xs font-medium">{item.label}</span>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 ${className}`}>
        {trustItems.slice(0, 4).map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 rounded-xl bg-white/60 border border-slate-100 p-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-600/10">
              <item.icon size={18} className="text-teal-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{item.label}</p>
              <p className="text-xs text-slate-500">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {trustItems.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.06, duration: 0.4 }}
          className="group flex items-start gap-4 rounded-2xl bg-white/70 border border-slate-100 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-morocco-emerald/15 to-morocco-gold/15 group-hover:from-morocco-emerald/25 group-hover:to-morocco-gold/25 transition-colors">
            <item.icon size={20} className="text-teal-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-50 text-sm">{item.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// ─── Social Proof Bar ───────────────────────────────────────────────
interface SocialProofProps {
  viewers?: number;
  interested?: number;
  lastViewed?: string;
  className?: string;
}

export const SocialProofBar: React.FC<SocialProofProps> = ({
  viewers,
  interested,
  lastViewed,
  className = '',
}) => {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-wrap items-center gap-4 text-sm text-slate-500 ${className}`}
    >
      {viewers !== undefined && viewers > 0 && (
        <span className="inline-flex items-center gap-1.5">
          <Eye size={14} className="text-morocco-atlas" />
          <span className="font-medium text-slate-900 dark:text-slate-50">{viewers}</span> {t('property.details.views')}
        </span>
      )}
      {interested !== undefined && interested > 0 && (
        <span className="inline-flex items-center gap-1.5">
          <TrendingUp size={14} className="text-red-500" />
          <span className="font-medium text-slate-900 dark:text-slate-50">{interested}</span> {t('socialProof.interested')}
        </span>
      )}
      {lastViewed && (
        <span className="inline-flex items-center gap-1.5">
          <Clock size={14} className="text-amber-500" />
          {t('socialProof.lastViewed', { time: lastViewed })}
        </span>
      )}
    </motion.div>
  );
};

// ─── Rating Display ─────────────────────────────────────────────────
interface RatingDisplayProps {
  rating: number;
  count: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

export const RatingDisplay: React.FC<RatingDisplayProps> = ({
  rating,
  count,
  size = 'md',
  showCount = true,
  className = '',
}) => {
  const sizes = { sm: 14, md: 18, lg: 24 };
  const starSize = sizes[size];
  const numericRating = typeof rating === 'number' ? rating : Number(rating) || 0;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={starSize}
            className={i < Math.round(numericRating) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}
          />
        ))}
      </div>
      <span className={`font-bold text-slate-900 dark:text-slate-50 ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'}`}>
        {numericRating.toFixed(1)}
      </span>
      {showCount && (
        <span className="text-slate-400 text-xs">({count} avis)</span>
      )}
    </div>
  );
};

// ─── Security Seal ──────────────────────────────────────────────────
export const SecuritySeal: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { t } = useTranslation();
  return (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className={`inline-flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 ${className}`}
  >
    <div className="relative">
      <Lock size={16} className="text-emerald-600" />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 rounded-full bg-emerald-400/20"
      />
    </div>
    <div className="text-xs">
      <p className="font-semibold text-emerald-800">{t('security.connection')}</p>
      <p className="text-emerald-600">{t('security.ssl')}</p>
    </div>
  </motion.div>
);
};

// ─── Trust Score Ring ───────────────────────────────────────────────
interface TrustScoreProps {
  score: number; // 0-100
  size?: number;
  label?: string;
  className?: string;
}

export const TrustScoreRing: React.FC<TrustScoreProps> = ({
  score,
  size = 64,
  label,
  className = '',
}) => {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return 'var(--color-primary-600)';
    if (s >= 60) return 'var(--color-gold-500)';
    return 'var(--color-terracotta-500)';
  };

  return (
    <div className={`inline-flex flex-col items-center gap-1 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-gray-200)"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getColor(score)}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-slate-900 dark:text-slate-50">{score}</span>
        </div>
      </div>
      {label && <span className="text-xs font-medium text-slate-500">{label}</span>}
    </div>
  );
};

// ─── Verified Owner Card ────────────────────────────────────────────
interface VerifiedOwnerProps {
  name: string;
  memberSince?: string;
  propertiesCount?: number;
  responseRate?: number;
  responseTime?: string;
  avatarUrl?: string;
  isPro?: boolean;
  className?: string;
}

export const VerifiedOwnerCard: React.FC<VerifiedOwnerProps> = ({
  name,
  memberSince,
  propertiesCount,
  responseRate,
  responseTime,
  avatarUrl,
  isPro = false,
  className = '',
}) => {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl bg-white border border-slate-100 p-5 shadow-sm ${className}`}
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          {avatarUrl ? (
            <img
              src={fixMediaUrl(avatarUrl)}
              alt={name}
              className="h-14 w-14 rounded-2xl object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-morocco-gold to-morocco-emerald text-white text-xl font-bold">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 border-2 border-white">
            <CheckCircle2 size={10} className="text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-slate-900 dark:text-slate-50 truncate">{name}</h4>
            {isPro && <VerificationBadge level="premium" size="sm" />}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{t('owner.verified')}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {memberSince && (
          <div className="rounded-xl bg-slate-50 p-2.5 text-center">
            <p className="text-xs text-slate-500">{t('owner.memberSince')}</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{memberSince}</p>
          </div>
        )}
        {propertiesCount !== undefined && (
          <div className="rounded-xl bg-slate-50 p-2.5 text-center">
            <p className="text-xs text-slate-500">{t('owner.ads')}</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{propertiesCount}</p>
          </div>
        )}
        {responseRate !== undefined && (
          <div className="rounded-xl bg-slate-50 p-2.5 text-center">
            <p className="text-xs text-slate-500">{t('owner.responseRate')}</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{responseRate}%</p>
          </div>
        )}
        {responseTime && (
          <div className="rounded-xl bg-slate-50 p-2.5 text-center">
            <p className="text-xs text-slate-500">{t('owner.responseTime')}</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{responseTime}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// All components exported as named exports above
