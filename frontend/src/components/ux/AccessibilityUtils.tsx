import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Focus Trap Hook ────────────────────────────────────────────────
export const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isActive) {
      previouslyFocused.current = document.activeElement as HTMLElement;
      const container = containerRef.current;
      if (container) {
        const focusable = container.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        focusable[0]?.focus();
      }
    } else {
      previouslyFocused.current?.focus();
    }
  }, [isActive]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const container = containerRef.current;
    if (!container) return;
    const focusable = Array.from(
      container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !(el as HTMLButtonElement).disabled);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  return { containerRef, handleKeyDown };
};

// ─── Skip Link ──────────────────────────────────────────────────────
export const SkipLink: React.FC<{ targetId: string }> = ({ targetId }) => {
  const { t } = useTranslation();
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[999] focus:rounded-xl focus:bg-teal-600 focus:px-4 focus:py-2 focus:text-white focus:font-medium"
    >
      {t('a11y.skipToContent', 'Aller au contenu principal')}
    </a>
  );
};

// ─── Live Region ────────────────────────────────────────────────────
export const LiveRegion: React.FC<{
  message: string;
  priority?: 'polite' | 'assertive';
  className?: string;
}> = ({ message, priority = 'polite', className = '' }) => (
  <div
    aria-live={priority}
    aria-atomic="true"
    className={`sr-only ${className}`}
  >
    {message}
  </div>
);

// ─── Accessible Modal Wrapper ───────────────────────────────────────
interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className = '',
}) => {
  const { containerRef, handleKeyDown } = useFocusTrap(isOpen);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby={description ? 'modal-desc' : undefined}
        >
          <motion.div
            ref={containerRef}
            onKeyDown={handleKeyDown}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className={`bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto ${className}`}
          >
            <div className="p-6">
              <h2 id="modal-title" className="text-xl font-bold text-slate-900 dark:text-slate-50">
                {title}
              </h2>
              {description && (
                <p id="modal-desc" className="text-sm text-slate-500 mt-1">
                  {description}
                </p>
              )}
              <div className="mt-4">{children}</div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── Keyboard Navigation Hints ──────────────────────────────────────
export const KeyboardHint: React.FC<{ keys: string[]; action: string }> = ({
  keys,
  action,
}) => (
  <span className="inline-flex items-center gap-1 text-xs text-slate-400">
    {keys.map((key, i) => (
      <React.Fragment key={key}>
        <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px]">
          {key}
        </kbd>
        {i < keys.length - 1 && <span>+</span>}
      </React.Fragment>
    ))}
    <span className="ml-1">{action}</span>
  </span>
);

// ─── Reduced Motion Wrapper ─────────────────────────────────────────
export const RespectMotionPreference: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => {
  const [prefersReduced, setPrefersReduced] = React.useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (prefersReduced && fallback) return <>{fallback}</>;
  return <>{children}</>;
};

// ─── Screen Reader Only ─────────────────────────────────────────────
export const VisuallyHidden: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="sr-only">{children}</span>
);

// ─── Accessible Tabs ────────────────────────────────────────────────
interface AccessibleTabsProps {
  tabs: { id: string; label: string; content: React.ReactNode }[];
  defaultTab?: string;
  className?: string;
}

export const AccessibleTabs: React.FC<AccessibleTabsProps> = ({
  tabs,
  defaultTab,
  className = '',
}) => {
  const [active, setActive] = useState(defaultTab || tabs[0]?.id);

  return (
    <div className={className}>
      <div role="tablist" className="flex gap-1 rounded-xl bg-slate-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => setActive(tab.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              active === tab.id
                ? 'bg-white text-slate-900 dark:text-slate-50 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={active !== tab.id}
          className="mt-4"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
};

// Accessibility utilities module — all exports are named above
