import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface SectionErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const SectionError: React.FC<SectionErrorProps> = ({
  title,
  message,
  onRetry,
}) => {
  const { t } = useTranslation();
  const finalTitle = title || t('sectionError.title');
  const finalMessage = message || t('sectionError.message');
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-semantic-error-100 bg-semantic-error-50 p-6 text-center dark:bg-semantic-error-900/20"
    >
      <AlertCircle className="mx-auto h-8 w-8 text-semantic-error-500" />
      <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">{finalTitle}</h3>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{finalMessage}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm border border-gray-200 hover:bg-gray-50 transition dark:bg-dark-surface dark:border-dark-border dark:text-white"
        >
          <RefreshCw className="h-4 w-4" />
          {t('common.retry')}
        </button>
      )}
    </motion.div>
  );
};
