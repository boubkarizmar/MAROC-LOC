import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { CheckCircle2, Sparkles, Heart, Star, PartyPopper } from 'lucide-react';

// ─── Confetti Particle ──────────────────────────────────────────────
interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  delay: number;
}

const COLORS = ['var(--color-primary-600)', 'var(--color-gold-500)', 'var(--color-terracotta-500)', 'var(--color-atlas-500)', 'var(--color-sand-400)', 'var(--color-primary-900)'];

export const ConfettiBurst: React.FC<{
  trigger: boolean;
  origin?: { x: number; y: number };
  particleCount?: number;
  onComplete?: () => void;
}> = ({ trigger, origin = { x: 0.5, y: 0.5 }, particleCount = 40, onComplete }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!trigger) return;
    setActive(true);
    const newParticles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: origin.x * 100 + (Math.random() - 0.5) * 20,
      y: origin.y * 100 + (Math.random() - 0.5) * 20,
      rotation: Math.random() * 720 - 360,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 8 + 4,
      delay: Math.random() * 0.3,
    }));
    setParticles(newParticles);
    const timer = setTimeout(() => {
      setActive(false);
      setParticles([]);
      onComplete?.();
    }, 3000);
    return () => clearTimeout(timer);
  }, [trigger, origin.x, origin.y, particleCount, onComplete]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            scale: 0,
            rotate: 0,
            opacity: 1,
          }}
          animate={{
            left: `${p.x + (Math.random() - 0.5) * 60}%`,
            top: `${p.y + Math.random() * 50 + 20}%`,
            scale: [0, 1, 0.5],
            rotate: p.rotation,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 2,
            delay: p.delay,
            ease: 'easeOut',
          }}
          className="absolute"
          style={{
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            borderRadius: 1,
          }}
        />
      ))}
    </div>
  );
};

// ─── Success Celebration ────────────────────────────────────────────
export const SuccessCelebration: React.FC<{
  show: boolean;
  title: string;
  message?: string;
  onComplete?: () => void;
}> = ({ show, title, message, onComplete }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={onComplete}
        >
          <ConfettiBurst trigger={show} onComplete={onComplete} />
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="bg-white rounded-3xl p-8 text-center max-w-sm mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-emerald-50 mb-4"
            >
              <PartyPopper size={40} className="text-emerald-600" />
            </motion.div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50">{title}</h3>
            {message && <p className="text-slate-500 mt-2">{message}</p>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── Heart Burst (for favorites) ────────────────────────────────────
export const HeartBurst: React.FC<{
  trigger: boolean;
  onComplete?: () => void;
}> = ({ trigger, onComplete }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (trigger) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        onComplete?.();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 2, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <Heart size={40} className="text-red-500 fill-morocco-terracotta" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── Floating Emojis (delight moments) ──────────────────────────────
export const FloatingEmoji: React.FC<{
  emoji: string;
  x: number;
  y: number;
  onComplete?: () => void;
}> = ({ emoji, x, y, onComplete }) => {
  return (
    <motion.span
      initial={{ x, y, opacity: 1, scale: 0.5 }}
      animate={{
        y: y - 100,
        opacity: 0,
        scale: 1.2,
      }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
      onAnimationComplete={onComplete}
      className="fixed text-2xl pointer-events-none z-[100]"
    >
      {emoji}
    </motion.span>
  );
};

// ─── Animated Counter ───────────────────────────────────────────────
export const AnimatedCounter: React.FC<{
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}> = ({ value, duration = 1.5, prefix = '', suffix = '', className = '' }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      start = Math.floor(eased * value);
      setDisplay(start);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}{display.toLocaleString()}{suffix}
    </span>
  );
};

// ─── Staggered Reveal Container ─────────────────────────────────────
export const StaggerReveal: React.FC<{
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  childSelector?: string;
}> = ({ children, className = '', staggerDelay = 0.06 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (inView) setVisible(true);
    const timer = setTimeout(() => setVisible(true), 700);
    return () => clearTimeout(timer);
  }, [inView]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={visible ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: staggerDelay },
        },
      }}
      className={className}
    >
      {React.Children.map(children, (child) => (
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

// ─── Scroll Reveal Wrapper ──────────────────────────────────────────
export const ScrollReveal: React.FC<{
  children: React.ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
}> = ({ children, className = '', direction = 'up', delay = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (inView) setVisible(true);
    const timer = setTimeout(() => setVisible(true), 700);
    return () => clearTimeout(timer);
  }, [inView]);

  const directions = {
    up: { y: 30, x: 0 },
    down: { y: -30, x: 0 },
    left: { y: 0, x: 30 },
    right: { y: 0, x: -30 },
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...directions[direction] }}
      animate={visible ? { opacity: 1, y: 0, x: 0 } : { opacity: 0, ...directions[direction] }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ─── Micro-interaction Button Wrapper ───────────────────────────────
export const MicroInteraction: React.FC<{
  children: React.ReactNode;
  effect?: 'pulse' | 'bounce' | 'shake' | 'glow';
  trigger?: boolean;
  className?: string;
}> = ({ children, effect = 'pulse', trigger = true, className = '' }) => {
  const effects = {
    pulse: { scale: [1, 1.05, 1], transition: { duration: 0.4 } },
    bounce: { y: [0, -4, 0], transition: { duration: 0.4 } },
    shake: { x: [0, -4, 4, -4, 0], transition: { duration: 0.4 } },
    glow: { boxShadow: ['0 0 0 0 var(--color-primary-600-transparent)', '0 0 20px 4px var(--color-primary-600-shadow)', '0 0 0 0 var(--color-primary-600-transparent)'], transition: { duration: 0.6 } },
  };

  return (
    <motion.div
      animate={trigger ? effects[effect] : {}}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ─── Star Rating Input (animated) ───────────────────────────────────
export const AnimatedStarRating: React.FC<{
  value: number;
  onChange: (value: number) => void;
  size?: number;
  className?: string;
}> = ({ value, onChange, size = 28, className = '' }) => {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.button
          key={i}
          type="button"
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onMouseEnter={() => setHoverValue(i + 1)}
          onMouseLeave={() => setHoverValue(0)}
          onClick={() => onChange(i + 1)}
          className="p-0.5"
        >
          <Star
            size={size}
            className={
              i < (hoverValue || value)
                ? 'text-yellow-400 fill-yellow-400 transition-colors'
                : 'text-slate-300 transition-colors'
            }
          />
        </motion.button>
      ))}
    </div>
  );
};

// ─── Progress Step Indicator ────────────────────────────────────────
export const ProgressSteps: React.FC<{
  steps: string[];
  current: number;
  className?: string;
}> = ({ steps, current, className = '' }) => {
  return (
    <div className={`flex items-center ${className}`}>
      {steps.map((step, i) => (
        <React.Fragment key={step}>
          <div className="flex flex-col items-center">
            <motion.div
              animate={{
                backgroundColor: i <= current ? 'var(--color-primary-600)' : 'var(--color-gray-200)',
                scale: i === current ? 1.1 : 1,
              }}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                i <= current ? 'text-white' : 'text-slate-400'
              }`}
            >
              {i < current ? <CheckCircle2 size={16} /> : i + 1}
            </motion.div>
            <span className={`text-xs mt-1.5 font-medium ${i <= current ? 'text-slate-900 dark:text-slate-50' : 'text-slate-400'}`}>
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 h-0.5 mx-2 mb-5">
              <motion.div
                animate={{
                  backgroundColor: i < current ? 'var(--color-primary-600)' : 'var(--color-gray-200)',
                }}
                className="h-full rounded-full"
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// All components exported as named exports above
