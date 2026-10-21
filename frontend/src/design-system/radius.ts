/**
 * MAROC-LOC Unified Border Radius System
 * 3 levels only. No random radius values.
 */

export const RADIUS = {
  sm:  'rounded-lg',     // 10px — small elements: badges, tags, inputs
  md:  'rounded-2xl',    // 28px — standard cards, sections
  lg:  'rounded-[2rem]', // 32px — hero cards, modals
  full:'rounded-full',   // pills, avatars
  none:'rounded-none',
} as const;
