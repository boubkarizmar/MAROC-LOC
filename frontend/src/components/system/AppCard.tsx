import React from 'react';
import { motion } from 'framer-motion';
import { fadeInScale, hover, transition } from '../../design-system/animations/motion';
import { RADIUS } from '../../design-system/radius';
import { SHADOW, SHADOW_HOVER } from '../../design-system/shadows';
interface AppCardProps {
  children: React.ReactNode;
  className?: string;
  elevation?: 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  animated?: boolean;
  onClick?: () => void;
}

export const AppCard: React.FC<AppCardProps> = ({
  children,
  className = '',
  elevation = 'md',
  hoverable = true,
  animated = true,
  onClick,
}) => {
  const shadowClass = SHADOW[elevation];
  const hoverClass = hoverable ? SHADOW_HOVER[elevation] : '';
  const clickableClass = onClick ? 'cursor-pointer' : '';

  const classes = `bg-white dark:bg-slate-800 ${RADIUS.md} border border-slate-100 dark:border-slate-700 ${shadowClass} ${hoverClass} ${clickableClass} ${className}`;

  if (animated) {
    return (
      <motion.div
        className={classes}
        variants={fadeInScale}
        whileHover={hoverable ? hover.lift : undefined}
        onClick={onClick}
      >
        {children}
      </motion.div>
    );
  }

  return <div className={classes}>{children}</div>;
};
