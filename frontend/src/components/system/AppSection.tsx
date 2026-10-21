import React from 'react';
import { motion } from 'framer-motion';
import { fadeInUp, viewportOnce } from '../../design-system/animations/motion';
import { TYPE, TEXT_STYLE } from '../../design-system/typography';

interface AppSectionProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  animated?: boolean;
  id?: string;
}

export const AppSection: React.FC<AppSectionProps> = ({
  children,
  title,
  subtitle,
  className = '',
  animated = true,
  id,
}) => {
  return (
    <section id={id} className={`py-8 sm:py-12 ${className}`}>
      {(title || subtitle) && (
        <motion.div
          className="mb-6 sm:mb-8"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          {subtitle && (
            <p className={TEXT_STYLE.overline}>{subtitle}</p>
          )}
          {title && (
            <h2 className={TYPE.h2}>{title}</h2>
          )}
        </motion.div>
      )}
      {animated ? (
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          {children}
        </motion.div>
      ) : (
        children
      )}
    </section>
  );
};
