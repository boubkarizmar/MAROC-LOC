import React from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '../../design-system/animations/motion';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  animated?: boolean;
  fullWidth?: boolean;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  className = '',
  animated = true,
  fullWidth = false,
}) => {
  const baseClasses = 'min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900';
  const widthClass = fullWidth ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';

  if (animated) {
    return (
      <motion.div
        className={`${baseClasses} py-6 sm:py-8 ${className}`}
        variants={pageTransition}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className={widthClass}>
          {children}
        </div>
      </motion.div>
    );
  }

  return (
    <div className={`${baseClasses} py-6 sm:py-8 ${className}`}>
      <div className={widthClass}>
        {children}
      </div>
    </div>
  );
};
