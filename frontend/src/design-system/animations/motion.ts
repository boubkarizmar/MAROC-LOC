import { Variants, Transition } from "framer-motion";

// ==================== EASINGS ====================
export const easings = {
  default: [0.4, 0, 0.2, 1] as const,
  easeIn: [0.4, 0, 1, 1] as const,
  easeOut: [0, 0, 0.2, 1] as const,
  spring: [0.34, 1.56, 0.64, 1] as const,
  smooth: [0.45, 0.05, 0.55, 0.95] as const,
};

// ==================== DURATIONS ====================
export const durations = {
  instant: 0.075,
  fast: 0.15,
  normal: 0.25,
  slow: 0.35,
  slower: 0.5,
};

// ==================== TRANSITIONS ====================
export const transitions: Record<string, Transition> = {
  default: { duration: durations.normal, ease: easings.default },
  fast: { duration: durations.fast, ease: easings.default },
  slow: { duration: durations.slow, ease: easings.default },
  spring: { duration: durations.normal, ease: easings.spring },
  fade: { duration: durations.slow, ease: easings.easeOut },
  slide: { duration: durations.normal, ease: easings.easeOut },
  scale: { duration: durations.fast, ease: easings.spring },
};

// ==================== VARIANTS ====================
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: transitions.fade,
  },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.fade,
  },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.fade,
  },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitions.slide,
  },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitions.slide,
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: durations.normal, ease: easings.spring },
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.normal, ease: easings.easeOut },
  },
};

export const slideUp: Variants = {
  hidden: { y: "100%" },
  visible: {
    y: 0,
    transition: { duration: durations.slow, ease: easings.easeOut },
  },
  exit: {
    y: "100%",
    transition: { duration: durations.fast, ease: easings.easeIn },
  },
};

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.slow, ease: easings.easeOut },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: { duration: durations.fast, ease: easings.easeIn },
  },
};

// ==================== HOVER ANIMATIONS ====================
export const hoverScale = {
  scale: 1.02,
  transition: { duration: durations.fast, ease: easings.default },
};

export const hoverLift = {
  y: -4,
  transition: { duration: durations.normal, ease: easings.default },
};

export const tapScale = {
  scale: 0.97,
  transition: { duration: durations.instant, ease: easings.default },
};

// ==================== LOADING ANIMATIONS ====================
export const pulseAnimation = {
  scale: [1, 1.02, 1],
  opacity: [0.7, 1, 0.7],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut",
  },
};

export const shimmerAnimation = {
  backgroundPosition: ["-200% 0", "200% 0"],
  transition: {
    duration: 2.4,
    repeat: Infinity,
    ease: "linear",
  },
};

// ==================== AI CHAT ANIMATIONS ====================
export const messageBubbleIn: Variants = {
  hidden: { opacity: 0, x: -20, scale: 0.95 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: durations.normal, ease: easings.spring },
  },
};

export const typingDots: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

export const typingDot: Variants = {
  animate: {
    y: [0, -6, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// ==================== SCROLL REVEAL ====================
export const scrollReveal = (
  direction: "up" | "down" | "left" | "right" = "up",
  delay: number = 0
): Variants => {
  const directions = {
    up: { y: 40, x: 0 },
    down: { y: -40, x: 0 },
    left: { y: 0, x: 40 },
    right: { y: 0, x: -40 },
  };

  return {
    hidden: {
      opacity: 0,
      ...directions[direction],
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration: durations.slow,
        delay,
        ease: easings.easeOut,
      },
    },
  };
};

// ==================== BACKWARD COMPATIBILITY ALIASES ====================
// These aliases preserve imports from the legacy motion.ts module

export const EASE = {
  spring: easings.spring,
  smooth: easings.smooth,
  out: [0.22, 1, 0.36, 1] as const,
  inOut: easings.default,
};

export const DURATION = {
  instant: durations.instant,
  fast: durations.fast,
  normal: durations.normal,
  slow: durations.slow,
  slower: durations.slower,
  cinematic: 0.75,
};

export const transition = {
  fast: { duration: durations.fast, ease: easings.default },
  normal: { duration: durations.normal, ease: easings.easeOut },
  slow: { duration: durations.slow, ease: easings.easeOut },
  spring: { type: "spring" as const, stiffness: 380, damping: 30 },
  springSoft: { type: "spring" as const, stiffness: 100, damping: 30 },
  cinematic: { duration: 0.75, ease: easings.easeOut },
};

export const fadeInScale: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: durations.slow, ease: easings.default } },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: { duration: durations.normal, ease: easings.easeOut } },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0, transition: { duration: durations.normal, ease: easings.easeOut } },
};

export const hover = {
  lift: { y: -2, transition: { duration: durations.fast, ease: easings.default } },
  scale: { scale: 1.02, transition: { duration: durations.fast, ease: easings.default } },
  glow: { boxShadow: "0 0 20px var(--color-primary-600-shadow)", transition: { duration: durations.fast, ease: easings.default } },
};

export const tap = {
  shrink: { scale: 0.98 },
  soft: { scale: 0.96 },
};

export const viewportOnce = {
  once: true,
  margin: "-50px" as const,
};
