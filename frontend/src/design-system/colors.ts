/**
 * MAROC-LOC Unified Color System
 * Strict 3-primary-color rule with derived secondary palette
 */

// ─── PRIMARY PALETTE (3 colors only) ────────────────────────────────
export const PRIMARY = {
  50:  '#F0FDF9',
  100: '#CCFBEF',
  200: '#99F6E0',
  300: '#5EEAD4',
  400: '#2DD4BF',
  500: '#0D9488', // Main brand color
  600: '#0F766E',
  700: '#115E59',
  800: '#134E4A',
  900: '#042F2E',
} as const;

export const ACCENT = {
  50:  '#FDF9F0',
  100: '#FAF0D9',
  200: '#F5E2B3',
  300: '#EDCD82',
  400: '#D4AF37', // Moroccan gold
  500: '#C8A96B',
  600: '#A68B4B',
  700: '#8A733D',
  800: '#6E5C31',
  900: '#524526',
} as const;

export const NEUTRAL = {
  50:  '#F8FAFC',
  100: '#F1F5F9',
  200: '#E2E8F0',
  300: '#CBD5E1',
  400: '#94A3B8',
  500: '#64748B',
  600: '#475569',
  700: '#334155',
  800: '#1E293B',
  900: '#0F172A', // Main dark/text
} as const;

// ─── SEMANTIC COLORS (derived from primary + neutral) ───────────────
export const SEMANTIC = {
  success: { light: '#F0FDF4', DEFAULT: '#22C55E', dark: '#16A34A' },
  warning: { light: '#FFFBEB', DEFAULT: '#F59E0B', dark: '#D97706' },
  error:   { light: '#FEF2F2', DEFAULT: '#EF4444', dark: '#DC2626' },
  info:    { light: '#EFF6FF', DEFAULT: '#3B82F6', dark: '#2563EB' },
} as const;

// ─── BACKGROUND COLORS ──────────────────────────────────────────────
export const BG = {
  page:       'bg-gradient-to-br from-slate-50 via-white to-slate-50',
  pageDark:   'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
  card:       'bg-white',
  cardDark:   'bg-slate-800',
  elevated:   'bg-white',
  input:      'bg-slate-50',
  inputDark:  'bg-slate-700',
} as const;

// ─── TEXT COLORS ────────────────────────────────────────────────────
export const TEXT = {
  primary:   'text-slate-900',
  primaryDark:'text-slate-50',
  secondary: 'text-slate-500',
  tertiary:  'text-slate-400',
  inverse:   'text-white',
  accent:    'text-amber-500',
  brand:     'text-teal-600',
} as const;

// ─── BORDER COLORS ──────────────────────────────────────────────────
export const BORDER = {
  DEFAULT:    'border-slate-200',
  strong:     'border-slate-300',
  subtle:     'border-slate-100',
  brand:      'border-teal-500',
  accent:     'border-amber-400',
} as const;
