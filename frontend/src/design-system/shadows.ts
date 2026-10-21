/**
 * MAROC-LOC Unified Shadow System
 * 4 levels only. No random shadows.
 */

export const SHADOW = {
  sm:   'shadow-sm',     // Subtle elevation: stat cards, badges
  md:   'shadow-md',     // Standard cards, inputs
  lg:   'shadow-lg',     // Elevated cards, dropdowns
  xl:   'shadow-xl',     // Modals, overlays
  none: 'shadow-none',
} as const;

export const SHADOW_HOVER = {
  sm:   'hover:shadow-md transition-shadow duration-fast',
  md:   'hover:shadow-lg transition-shadow duration-fast',
  lg:   'hover:shadow-xl transition-shadow duration-fast',
} as const;

// ─── BRAND-COLORED SHADOWS (use sparingly for CTAs only) ────────────
export const SHADOW_BRAND = {
  sm: 'shadow-brand-sm',
  md: 'shadow-brand-md',
  gold: 'shadow-brand-gold',
} as const;
