import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  MapPin,
  Sparkles,
  Home,
  Brain,
  Shield,
  ChevronRight,
  SkipForward,
} from 'lucide-react';
import { EASE } from '../design-system/animations/motion';

const SPLASH_DURATION_MS = 15000; // 15 seconds
const SKIP_BUTTON_DELAY_MS = 5000; // Show skip after 5s
const TICK_MS = 150; // Update progress every 150ms
const TOTAL_TICKS = SPLASH_DURATION_MS / TICK_MS; // 100 ticks

// ─── Zellige Geometric Pattern ──────────────────────────────────────
const ZelligeGrid = () => (
  <svg
    className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.04]"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern
        id="zellige-main"
        x="0"
        y="0"
        width="120"
        height="120"
        patternUnits="userSpaceOnUse"
      >
        <path d="M60 0L120 60L60 120L0 60Z" fill="none" stroke="currentColor" strokeWidth="0.8" />
        <path d="M60 20L100 60L60 100L20 60Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="60" cy="60" r="18" fill="none" stroke="currentColor" strokeWidth="0.4" />
        <path d="M60 42L78 60L60 78L42 60Z" fill="none" stroke="currentColor" strokeWidth="0.3" />
        <path d="M60 10L110 60L60 110L10 60Z" fill="none" stroke="currentColor" strokeWidth="0.2" opacity="0.5" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#zellige-main)" />
  </svg>
);

// ─── Video Background ───────────────────────────────────────────────
const AnimatedBackground: React.FC = () => (
  <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950">
    <video
      autoPlay
      loop
      muted
      playsInline
      className="absolute inset-0 w-full h-full object-cover"
      poster="/images/hero-bg.jpeg"
    >
      <source src="/video/splash.mp4" type="video/mp4" />
    </video>

    {/* Overlays for text readability */}
    <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/50 to-slate-950/85" />
    <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 via-transparent to-slate-950/40" />
    <div className="absolute inset-0 bg-radial-darken-strong" />
  </div>
);

// ─── Logo with text fallback ────────────────────────────────────────
const LogoBlock: React.FC = () => {
  const { t } = useTranslation();
  const [imgError, setImgError] = useState(false);

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Glow backdrops */}
      <motion.div
        className="absolute w-48 h-48 rounded-full bg-gold-400/10 blur-3xl"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1.5, opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.2, ease: EASE.out }}
      />
      <motion.div
        className="absolute w-32 h-32 rounded-full bg-primary-500/10 blur-2xl"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1.2, opacity: 1 }}
        transition={{ duration: 1, delay: 0.4, ease: EASE.out }}
      />

      <motion.div
        className="relative z-10"
        initial={{ rotateX: 45, opacity: 0, scale: 0.8 }}
        animate={{ rotateX: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, delay: 0.3, ease: EASE.out }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {!imgError ? (
          <motion.img
            src="/images/logo.png"
            alt="MAROC-LOC"
            className="h-24 sm:h-32 md:h-40 w-auto object-contain drop-shadow-2xl"
            onError={() => setImgError(true)}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-50 tracking-tighter">
              {t('common.appName').split('-')[0] || 'MAROC'}
            </span>
            <span className="text-4xl sm:text-5xl md:text-6xl font-black text-gold-400 tracking-tighter">
              {t('common.appName').split('-')[1] || 'LOC'}
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// ─── Cinematic Title ────────────────────────────────────────────────
const CinematicTitle = ({ delay = 0 }: { delay?: number }) => {
  const { t } = useTranslation();
  const words = [t('splash.maroc'), t('splash.loc')];
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mt-5">
      {words.map((word, wi) => (
        <span key={wi} className="flex">
          {word.split('').map((letter, li) => (
            <motion.span
              key={li}
              className={`inline-block text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter ${
                wi === 1 ? 'text-gold-400' : 'text-slate-50'
              }`}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: delay + (wi * word.length + li) * 0.05,
                ease: EASE.out,
              }}
              style={{
                textShadow: wi === 1 ? '0 0 40px var(--color-gold-400-shadow), 0 4px 20px var(--color-shadow-lg)' : '0 0 30px var(--color-text-inverse-shadow), 0 4px 20px var(--color-shadow-lg)',
              }}
            >
              {letter}
            </motion.span>
          ))}
        </span>
      ))}
    </div>
  );
};

// ─── Feature Pill ───────────────────────────────────────────────────
const FeaturePill = ({
  icon: Icon,
  label,
  delay,
}: {
  icon: React.FC<any>;
  label: string;
  delay: number;
}) => (
  <motion.div
    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white/80 text-sm"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: EASE.out }}
  >
    <Icon size={16} className="text-gold-400" />
    <span>{label}</span>
  </motion.div>
);

// ─── Progress Ring ──────────────────────────────────────────────────
const ProgressRing = ({ progress }: { progress: number }) => {
  const circumference = 2 * Math.PI * 30;
  const offset = circumference - (progress / 100) * circumference;
  return (
    <div className="relative w-14 h-14">
      <svg className="w-full h-full -rotate-90">
        <circle cx="28" cy="28" r="26" fill="none" stroke="var(--color-text-inverse)" strokeOpacity="0.1" strokeWidth="3" />
        <circle
          cx="28"
          cy="28"
          r="26"
          fill="none"
          stroke="var(--color-gold-400)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white/80">
        {Math.round(progress)}%
      </span>
    </div>
  );
};

// ─── MAIN SPLASH SCREEN ─────────────────────────────────────────────
export const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [progress, setProgress] = useState(0);
  const [showSkip, setShowSkip] = useState(false);
  const [isExiting, setIsExiting] = useState(false);


  const tickRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const skipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goHome = useCallback(() => {
    setIsExiting(true);
    exitTimerRef.current = setTimeout(() => {
      navigate('/home', { replace: true });
    }, 700);
  }, [navigate]);

  // 15-second deterministic timer
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      tickRef.current += 1;
      const pct = Math.min((tickRef.current / TOTAL_TICKS) * 100, 100);
      setProgress(pct);

      if (tickRef.current >= TOTAL_TICKS) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        goHome();
      }
    }, TICK_MS);

    skipTimerRef.current = setTimeout(() => {
      setShowSkip(true);
    }, SKIP_BUTTON_DELAY_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (skipTimerRef.current) clearTimeout(skipTimerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, [goHome]);

  const handleSkip = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    goHome();
  }, [goHome]);

  const containerVariants = {
    visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
    exit: {
      opacity: 0,
      scale: 1.08,
      filter: 'blur(10px)',
      transition: { duration: 0.7, ease: [0.33, 0, 0.67, 1] as const },
    },
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-hidden bg-slate-950"
      variants={containerVariants}
      initial="visible"
      animate={isExiting ? 'exit' : 'visible'}
      style={{ willChange: 'transform, opacity, filter' }}
    >
      {/* Animated Gradient Background */}
      <AnimatedBackground />

      {/* Zellige pattern overlay */}
      <ZelligeGrid />

      {/* Skip button */}
      <AnimatePresence>
        {showSkip && !isExiting && (
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onClick={handleSkip}
            className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-colors text-sm"
          >
            <SkipForward size={16} />
            {t('splash.skip', 'Passer')}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <LogoBlock />

        {/* Title */}
        <CinematicTitle delay={0.6} />

        {/* Tagline */}
        <motion.p
          className="mt-4 text-base sm:text-lg md:text-xl text-white/60 font-light tracking-wide text-center max-w-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.2, ease: EASE.out }}
        >
          {t('splash.tagline', "L'immobilier intelligent du Maroc")}
        </motion.p>

        {/* Gold divider */}
        <motion.div
          className="w-16 h-0.5 bg-gradient-to-r from-transparent via-gold-400 to-transparent mt-6"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.4 }}
        />

        {/* Feature pills */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-3 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
        >
          <FeaturePill icon={Home} label={t('splash.feature1', 'Biens premium')} delay={1.7} />
          <FeaturePill icon={Brain} label={t('splash.feature2', 'IA intégrée')} delay={1.85} />
          <FeaturePill icon={Shield} label={t('splash.feature3', 'Vérifié')} delay={2.0} />
          <FeaturePill icon={MapPin} label={t('splash.feature4', 'Partout au Maroc')} delay={2.15} />
        </motion.div>

        {/* Progress */}
        <motion.div
          className="mt-12 flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.4 }}
        >
          <div className="flex items-center gap-4">
            <ProgressRing progress={progress} />
            <span className="text-sm text-white/40 font-medium">
              {t('splash.loading', "Chargement de l'expérience...")}
            </span>
          </div>
          <p className="text-xs text-white/20">
            {Math.ceil((SPLASH_DURATION_MS - (progress / 100) * SPLASH_DURATION_MS) / 1000)}s
          </p>
        </motion.div>

        {/* Bottom hint */}
        <motion.p
          className="absolute bottom-6 text-xs text-white/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.8 }}
        >
          {t('splash.copyright', { year: new Date().getFullYear() })}
        </motion.p>
      </motion.div>
    </motion.div>
  );
};
