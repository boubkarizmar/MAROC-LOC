import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Home, Search, Heart, MessageCircle, Crown, Sparkles,
  MapPin, Building2, UserCheck, ChevronRight, ChevronLeft,
  CheckCircle2, Bell, ShieldCheck
} from 'lucide-react';
import { Button } from '../ui/Button';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  content?: React.ReactNode;
}

const getDefaultSteps = (t: (key: string) => string): OnboardingStep[] => [
  {
    id: 'welcome',
    title: t('onboarding.welcome.title'),
    description: t('onboarding.welcome.description'),
    icon: Sparkles,
  },
  {
    id: 'search',
    title: t('onboarding.search.title'),
    description: t('onboarding.search.description'),
    icon: Search,
  },
  {
    id: 'favorites',
    title: t('onboarding.favorites.title'),
    description: t('onboarding.favorites.description'),
    icon: Heart,
  },
  {
    id: 'chat',
    title: t('onboarding.chat.title'),
    description: t('onboarding.chat.description'),
    icon: MessageCircle,
  },
  {
    id: 'premium',
    title: t('onboarding.premium.title'),
    description: t('onboarding.premium.description'),
    icon: Crown,
  },
];

interface OnboardingWizardProps {
  steps?: OnboardingStep[];
  onComplete: () => void;
  onSkip?: () => void;
  storageKey?: string;
  className?: string;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  steps: stepsProp,
  onComplete,
  onSkip,
  storageKey = 'marocloc_onboarding_complete',
  className = '',
}) => {
  const { t } = useTranslation();
  const steps = stepsProp ?? getDefaultSteps(t);
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);

  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem(storageKey, 'true');
      onComplete();
    } else {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(storageKey, 'true');
    onSkip?.();
  };

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center bg-teal-600/95 backdrop-blur-md p-4 ${className}`}>
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: i <= currentStep ? '100%' : '0%' }}
                transition={{ duration: 0.4 }}
                className="h-full rounded-full bg-amber-400"
              />
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="relative h-[420px]">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={currentStep}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute inset-0 flex flex-col items-center text-center text-white"
            >
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.15 }}
                className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15 backdrop-blur mb-6"
              >
                <step.icon size={36} className="text-amber-500" />
              </motion.div>

              <h2 className="text-2xl font-black mb-3">{step.title}</h2>
              <p className="text-white/75 leading-relaxed max-w-sm">{step.description}</p>

              {step.content && (
                <div className="mt-6 w-full">{step.content}</div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={handlePrev}
            disabled={isFirst}
            className={`p-2 rounded-xl transition ${
              isFirst ? 'text-white/30 cursor-not-allowed' : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <ChevronLeft size={24} />
          </button>

          <div className="flex gap-2">
            {!isLast && (
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-sm text-white/60 hover:text-white transition"
              >
                {t('onboarding.skip')}
              </button>
            )}
            <Button
              variant="secondary"
              size="md"
              onClick={handleNext}
              rightIcon={<ChevronRight size={16} />}
            >
              {isLast ? t('onboarding.start') : t('common.next')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Coach Marks ────────────────────────────────────────────────────
interface CoachMarkProps {
  target: string; // CSS selector
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  step: number;
  totalSteps: number;
  onNext: () => void;
  onPrev?: () => void;
  onSkip: () => void;
  isLast: boolean;
}

export const CoachMark: React.FC<CoachMarkProps> = ({
  target,
  title,
  description,
  position = 'bottom',
  step,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  isLast,
}) => {
  const { t } = useTranslation();
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });

  useEffect(() => {
    const updatePosition = () => {
      const el = document.querySelector(target);
      if (el) {
        const rect = el.getBoundingClientRect();
        setCoords({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });
      }
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [target]);

  const getTooltipStyle = () => {
    const offset = 16;
    switch (position) {
      case 'top':
        return { bottom: window.innerHeight - coords.top + offset, left: coords.left + coords.width / 2 };
      case 'bottom':
        return { top: coords.top + coords.height + offset, left: coords.left + coords.width / 2 };
      case 'left':
        return { top: coords.top + coords.height / 2, right: window.innerWidth - coords.left + offset };
      case 'right':
        return { top: coords.top + coords.height / 2, left: coords.left + coords.width + offset };
    }
  };

  return (
    <>
      {/* Spotlight overlay */}
      <div className="fixed inset-0 z-[180] pointer-events-none">
        <div className="absolute inset-0 bg-black/60" />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bg-transparent"
          style={{
            top: coords.top - 8,
            left: coords.left - 8,
            width: coords.width + 16,
            height: coords.height + 16,
            boxShadow: '0 0 0 9999px var(--color-spotlight-overlay)',
            borderRadius: 12,
          }}
        />
      </div>

      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed z-[190] w-72 bg-white rounded-2xl shadow-2xl p-5"
        style={{
          ...getTooltipStyle(),
          transform: position === 'top' || position === 'bottom' ? 'translateX(-50%)' : 'translateY(-50%)',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
            {t('onboarding.step', { step, total: totalSteps })}
          </span>
          <button onClick={onSkip} className="text-xs text-slate-400 hover:text-slate-600">
            {t('onboarding.skip')}
          </button>
        </div>
        <h3 className="font-bold text-slate-900 dark:text-slate-50 mb-1">{title}</h3>
        <p className="text-sm text-slate-500 mb-4">{description}</p>
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-6 rounded-full transition-colors ${
                  i < step ? 'bg-teal-600' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {onPrev && step > 1 && (
              <button onClick={onPrev} className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-50 transition">
                {t('common.previous')}
              </button>
            )}
            <button
              onClick={onNext}
              className="px-4 py-1.5 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-600/90 transition"
            >
              {isLast ? t('onboarding.finish') : t('common.next')}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

// ─── Onboarding Checklist ───────────────────────────────────────────
interface ChecklistItem {
  id: string;
  label: string;
  icon: React.ElementType;
  completed: boolean;
}

export const OnboardingChecklist: React.FC<{
  items: ChecklistItem[];
  onItemClick: (id: string) => void;
  className?: string;
}> = ({ items, onItemClick, className = '' }) => {
  const { t } = useTranslation();
  const completed = items.filter((i) => i.completed).length;
  const progress = items.length > 0 ? (completed / items.length) * 100 : 0;

  return (
    <div className={`rounded-2xl bg-white border border-slate-100 p-5 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900 dark:text-slate-50">{t('onboarding.checklistTitle')}</h3>
        <span className="text-xs font-medium text-slate-500">{completed}/{items.length}</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full mb-4 overflow-hidden">
        <motion.div
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
          className="h-full rounded-full bg-gradient-to-r from-morocco-emerald to-morocco-gold"
        />
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <motion.button
            key={item.id}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onItemClick(item.id)}
            className={`w-full flex items-center gap-3 rounded-xl p-3 transition ${
              item.completed ? 'bg-emerald-50/50' : 'hover:bg-slate-50'
            }`}
          >
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                item.completed
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {item.completed ? <CheckCircle2 size={18} /> : <item.icon size={18} />}
            </div>
            <span
              className={`text-sm font-medium flex-1 text-left ${
                item.completed ? 'text-emerald-700 line-through opacity-60' : 'text-slate-900 dark:text-slate-50'
              }`}
            >
              {item.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default OnboardingWizard;
