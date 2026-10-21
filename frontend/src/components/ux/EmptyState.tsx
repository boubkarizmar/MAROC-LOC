import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Home, Search, Heart, MessageCircle, Building2,
  FolderOpen, Bell, MapPin, FileSearch, Sparkles,
  ArrowRight, Plus, RefreshCw
} from 'lucide-react';
import { Button } from '../ui/Button';

interface EmptyStateProps {
  variant: 'properties' | 'search' | 'favorites' | 'messages' | 'dashboard' | 'notifications' | 'map' | 'reviews' | 'generic';
  title?: string;
  description?: string;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
  onSecondaryAction?: () => void;
  secondaryLabel?: string;
  className?: string;
  compact?: boolean;
  aiSuggestion?: string;
}

const illustrations: Record<string, React.FC<{ className?: string }>> = {
  properties: ({ className }) => (
    <svg viewBox="0 0 200 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="40" y="60" width="120" height="80" rx="12" fill="var(--color-primary-50)" stroke="var(--color-primary-600)" strokeWidth="2"/>
      <path d="M40 60 L100 20 L160 60" fill="var(--color-primary-100)" stroke="var(--color-primary-600)" strokeWidth="2" strokeLinejoin="round"/>
      <rect x="75" y="95" width="24" height="30" rx="4" fill="var(--color-sand-50)" stroke="var(--color-primary-600)" strokeWidth="1.5"/>
      <rect x="110" y="85" width="30" height="22" rx="4" fill="var(--color-sand-50)" stroke="var(--color-primary-600)" strokeWidth="1.5"/>
      <circle cx="60" cy="45" r="8" fill="var(--color-gold-500)" opacity="0.3"/>
      <circle cx="145" cy="38" r="6" fill="var(--color-gold-500)" opacity="0.3"/>
      <path d="M85 60 L85 45" stroke="var(--color-primary-600)" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="100" cy="20" r="3" fill="var(--color-gold-500)"/>
    </svg>
  ),
  search: ({ className }) => (
    <svg viewBox="0 0 200 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="85" cy="75" r="35" fill="var(--color-primary-50)" stroke="var(--color-primary-600)" strokeWidth="2"/>
      <path d="M110 100 L140 130" stroke="var(--color-primary-600)" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="140" cy="130" r="8" fill="var(--color-gold-500)" opacity="0.4"/>
      <path d="M70 65 L85 65 M85 65 L85 80" stroke="var(--color-primary-600)" strokeWidth="2" strokeLinecap="round"/>
      <rect x="120" y="40" width="30" height="4" rx="2" fill="var(--color-sand-400)" opacity="0.5"/>
      <rect x="130" y="50" width="20" height="4" rx="2" fill="var(--color-sand-400)" opacity="0.3"/>
      <circle cx="55" cy="55" r="4" fill="var(--color-gold-500)" opacity="0.3"/>
    </svg>
  ),
  favorites: ({ className }) => (
    <svg viewBox="0 0 200 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M100 130 L55 85 C45 75 45 60 55 50 C65 40 80 40 90 50 L100 60 L110 50 C120 40 135 40 145 50 C155 60 155 75 145 85 L100 130Z" fill="var(--color-error-50)" stroke="var(--color-terracotta-500)" strokeWidth="2"/>
      <circle cx="70" cy="35" r="6" fill="var(--color-gold-500)" opacity="0.3"/>
      <circle cx="140" cy="30" r="4" fill="var(--color-gold-500)" opacity="0.3"/>
      <path d="M100 75 L100 95" stroke="var(--color-terracotta-500)" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
      <path d="M90 85 L110 85" stroke="var(--color-terracotta-500)" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
    </svg>
  ),
  messages: ({ className }) => (
    <svg viewBox="0 0 200 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="35" y="40" width="130" height="85" rx="16" fill="var(--color-primary-50)" stroke="var(--color-primary-600)" strokeWidth="2"/>
      <path d="M35 100 L70 100 L85 125 L85 100 L165 100" stroke="var(--color-primary-600)" strokeWidth="2" fill="var(--color-primary-100)"/>
      <circle cx="65" cy="70" r="6" fill="var(--color-gold-500)" opacity="0.4"/>
      <circle cx="95" cy="70" r="6" fill="var(--color-gold-500)" opacity="0.4"/>
      <circle cx="125" cy="70" r="6" fill="var(--color-gold-500)" opacity="0.4"/>
      <circle cx="155" cy="30" r="8" fill="var(--color-primary-600)" opacity="0.1"/>
      <circle cx="45" cy="30" r="5" fill="var(--color-primary-600)" opacity="0.1"/>
    </svg>
  ),
  dashboard: ({ className }) => (
    <svg viewBox="0 0 200 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="30" y="35" width="60" height="50" rx="10" fill="var(--color-primary-50)" stroke="var(--color-primary-600)" strokeWidth="1.5"/>
      <rect x="100" y="35" width="70" height="30" rx="10" fill="var(--color-sand-200)" stroke="var(--color-gold-500)" strokeWidth="1.5"/>
      <rect x="30" y="95" width="140" height="40" rx="10" fill="var(--color-sand-50)" stroke="var(--color-sand-400)" strokeWidth="1.5"/>
      <path d="M45 65 L55 55 L65 60 L75 45" stroke="var(--color-primary-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="115" cy="50" r="8" fill="var(--color-gold-500)" opacity="0.3"/>
      <rect x="45" y="110" width="40" height="6" rx="3" fill="var(--color-sand-400)" opacity="0.4"/>
      <rect x="45" y="120" width="60" height="6" rx="3" fill="var(--color-sand-400)" opacity="0.2"/>
    </svg>
  ),
  notifications: ({ className }) => (
    <svg viewBox="0 0 200 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M100 25 C75 25 65 45 65 65 L65 95 L50 110 L150 110 L135 95 L135 65 C135 45 125 25 100 25Z" fill="var(--color-primary-50)" stroke="var(--color-primary-600)" strokeWidth="2"/>
      <path d="M85 110 C85 120 92 125 100 125 C108 125 115 120 115 110" stroke="var(--color-primary-600)" strokeWidth="2" fill="none"/>
      <circle cx="145" cy="40" r="12" fill="var(--color-terracotta-500)" stroke="var(--color-text-inverse)" strokeWidth="2"/>
      <circle cx="145" cy="40" r="3" fill="var(--color-text-inverse)"/>
      <circle cx="60" cy="35" r="5" fill="var(--color-gold-500)" opacity="0.3"/>
    </svg>
  ),
  generic: ({ className }) => (
    <svg viewBox="0 0 200 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="80" r="50" fill="var(--color-primary-50)" stroke="var(--color-primary-600)" strokeWidth="2"/>
      <circle cx="100" cy="80" r="30" fill="var(--color-sand-50)" stroke="var(--color-gold-500)" strokeWidth="1.5"/>
      <circle cx="100" cy="80" r="12" fill="var(--color-gold-500)" opacity="0.3"/>
      <path d="M100 35 L100 20 M100 125 L100 140 M35 80 L20 80 M165 80 L180 80" stroke="var(--color-primary-600)" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="100" cy="20" r="4" fill="var(--color-gold-500)"/>
      <circle cx="180" cy="80" r="4" fill="var(--color-gold-500)"/>
    </svg>
  ),
};

const defaultContent: Record<string, { title: string; description: string; icon: typeof Home }> = {
  properties: { title: 'empty.properties.title', description: 'empty.properties.description', icon: Home },
  search: { title: 'empty.search.title', description: 'empty.search.description', icon: Search },
  favorites: { title: 'empty.favorites.title', description: 'empty.favorites.description', icon: Heart },
  messages: { title: 'empty.messages.title', description: 'empty.messages.description', icon: MessageCircle },
  dashboard: { title: 'empty.dashboard.title', description: 'empty.dashboard.description', icon: Building2 },
  notifications: { title: 'empty.notifications.title', description: 'empty.notifications.description', icon: Bell },
  map: { title: 'empty.map.title', description: 'empty.map.description', icon: MapPin },
  reviews: { title: 'empty.reviews.title', description: 'empty.reviews.description', icon: FileSearch },
  generic: { title: 'empty.generic.title', description: 'empty.generic.description', icon: FolderOpen },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant,
  title,
  description,
  actionLabel,
  actionIcon,
  onAction,
  onSecondaryAction,
  secondaryLabel,
  className = '',
  compact = false,
  aiSuggestion,
}) => {
  const { t } = useTranslation();
  const content = defaultContent[variant];
  const Illustration = illustrations[variant] || illustrations.generic;
  const Icon = content.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`flex flex-col items-center justify-center text-center ${
        compact ? 'py-10 px-6' : 'py-16 px-8'
      } ${className}`}
      role="status"
      aria-live="polite"
    >
      {/* Animated illustration */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5, type: 'spring', stiffness: 200 }}
        className={`${compact ? 'w-32 h-24' : 'w-48 h-36'} mb-6`}
      >
        <Illustration className="w-full h-full" />
      </motion.div>

      {/* Icon badge */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
        className={`inline-flex items-center justify-center rounded-2xl bg-teal-600/10 mb-4 ${
          compact ? 'p-2.5' : 'p-3.5'
        }`}
      >
        <Icon size={compact ? 20 : 28} className="text-teal-600" />
      </motion.div>

      {/* Title */}
      <h3 className={`font-black text-slate-900 dark:text-slate-50 mb-2 ${compact ? 'text-lg' : 'text-2xl'}`}>
        {title || t(content.title, content.title)}
      </h3>

      {/* Description */}
      <p className={`text-slate-500 max-w-md ${compact ? 'text-sm' : 'text-base leading-relaxed'}`}>
        {description || t(content.description, content.description)}
      </p>

      {/* AI Suggestion */}
      {aiSuggestion && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-morocco-royal/5 to-morocco-emerald/5 border border-morocco-emerald/20 px-4 py-2"
        >
          <Sparkles size={14} className="text-amber-500" />
          <span className="text-sm text-teal-600 font-medium">{aiSuggestion}</span>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 flex flex-wrap items-center justify-center gap-3"
      >
        {onAction && (
          <Button
            variant="primary"
            size={compact ? 'sm' : 'md'}
            onClick={onAction}
            leftIcon={actionIcon || (variant === 'dashboard' ? <Plus size={16} /> : <ArrowRight size={16} />)}
          >
            {actionLabel || t('empty.action.explore', 'Explorer')}
          </Button>
        )}
        {onSecondaryAction && (
          <Button
            variant="secondary"
            size={compact ? 'sm' : 'md'}
            onClick={onSecondaryAction}
            leftIcon={<RefreshCw size={16} />}
          >
            {secondaryLabel || t('empty.action.retry', 'Réessayer')}
          </Button>
        )}
      </motion.div>
    </motion.div>
  );
};

// Specialized empty states for common scenarios
export const SearchEmptyState: React.FC<{ onClear: () => void; searchTerm?: string }> = ({
  onClear,
  searchTerm,
}) => {
  const { t } = useTranslation();
  return (
    <EmptyState
      variant="search"
      title={searchTerm ? t('search.noResultsFor', 'No results for "{{term}}"', { term: searchTerm }) : t('empty.search.title')}
      description={t('empty.search.description')}
      actionLabel={t('empty.action.clearSearch')}
      onAction={onClear}
      aiSuggestion={t('empty.aiSuggestion.search')}
    />
  );
};

export const FavoritesEmptyState: React.FC<{ onBrowse: () => void }> = ({ onBrowse }) => {
  const { t } = useTranslation();
  return (
    <EmptyState
      variant="favorites"
      title={t('empty.favorites.title')}
      description={t('empty.favorites.description')}
      actionLabel={t('common.addToFavorites')}
      onAction={onBrowse}
      aiSuggestion={t('empty.aiSuggestion.favorites')}
    />
  );
};

export const MessagesEmptyState: React.FC<{ onBrowse: () => void }> = ({ onBrowse }) => {
  const { t } = useTranslation();
  return (
    <EmptyState
      variant="messages"
      title={t('empty.messages.title')}
      description={t('empty.messages.description')}
      actionLabel={t('empty.action.browse')}
      onAction={onBrowse}
    />
  );
};

export const DashboardEmptyState: React.FC<{ onAdd: () => void }> = ({ onAdd }) => {
  const { t } = useTranslation();
  return (
    <EmptyState
      variant="dashboard"
      title={t('empty.dashboard.title')}
      description={t('empty.dashboard.description')}
      actionLabel={t('empty.action.addProperty')}
      onAction={onAdd}
      aiSuggestion={t('empty.aiSuggestion.dashboard')}
    />
  );
};

export default EmptyState;
