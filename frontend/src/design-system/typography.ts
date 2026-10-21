/**
 * MAROC-LOC Unified Typography System
 * One global font scale. No random font changes.
 */

// ─── FONT FAMILIES ──────────────────────────────────────────────────
export const FONT = {
  sans:    'font-sans',    // Inter
  arabic:  'font-arabic',  // Cairo / Noto Sans Arabic
  display: 'font-display', // Inter + Cairo fallback
} as const;

// ─── TYPE SCALE ─────────────────────────────────────────────────────
export const TYPE = {
  hero:      'text-hero-mobile md:text-hero font-black tracking-tight leading-[1.1]',
  h1:        'text-h1 font-bold tracking-tight leading-[1.2]',
  h2:        'text-h2 font-bold tracking-tight leading-[1.25]',
  h3:        'text-h3 font-semibold tracking-tight leading-[1.3]',
  h4:        'text-h4 font-semibold leading-[1.35]',
  h5:        'text-h5 font-semibold leading-[1.4]',
  h6:        'text-h6 font-semibold leading-[1.4]',
  bodyLg:    'text-body-lg leading-relaxed',
  body:      'text-body leading-relaxed',
  bodySm:    'text-body-sm leading-relaxed',
  caption:   'text-caption tracking-wide',
  button:    'text-button font-semibold tracking-wide',
  overline:  'text-overline font-bold uppercase tracking-widest',
} as const;

// ─── TEXT COLOR COMBINATIONS ────────────────────────────────────────
export const TEXT_STYLE = {
  pageTitle:     `${TYPE.h1} text-slate-900 dark:text-slate-50`,
  sectionTitle:  `${TYPE.h2} text-slate-900 dark:text-slate-50`,
  cardTitle:     `${TYPE.h4} text-slate-900 dark:text-slate-50`,
  body:          `${TYPE.body} text-slate-600 dark:text-slate-400`,
  bodySm:        `${TYPE.bodySm} text-slate-500 dark:text-slate-500`,
  caption:       `${TYPE.caption} text-slate-400 dark:text-slate-600`,
  button:        `${TYPE.button} text-white`,
  overline:      `${TYPE.overline} text-amber-500`,
  link:          'text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors',
} as const;
