import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

type LanguageCode = 'fr' | 'en' | 'ar';

interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  flag: string;
  dir: 'ltr' | 'rtl';
}

const languages: LanguageOption[] = [
  { code: 'fr', label: 'Français', nativeLabel: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'ar', label: 'العربية', nativeLabel: 'العربية', flag: '🇲🇦', dir: 'rtl' },
];

interface LanguageSwitcherProps {
  variant?: 'navbar' | 'mobile';
  scrolled?: boolean;
  isHome?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'navbar',
  scrolled = true,
  isHome = false,
}) => {
  const { language, setLanguage, isRTL } = useLanguage();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
  };

  // Navbar variant: icon-only button with dropdown
  if (variant === 'navbar') {
    const isTransparent = !scrolled && isHome;

    return (
      <div ref={containerRef} className="relative">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-center gap-1.5 rounded-xl p-2.5 text-sm font-semibold transition-colors ${
            isTransparent
              ? 'text-white/70 hover:text-white hover:bg-white/10'
              : 'text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-bg-secondary)]'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label={t('language.switcher')}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <Globe className="w-[18px] h-[18px]" />
          <span className="hidden xl:inline text-xs font-bold uppercase tracking-wider">
            {currentLang.code.toUpperCase()}
          </span>
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop for mobile */}
              <motion.div
                className="fixed inset-0 z-40 sm:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
              />

              <motion.div
                className={`absolute z-50 mt-2 w-52 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-xl backdrop-blur-xl overflow-hidden ${
                  isRTL ? 'left-0' : 'right-0'
                }`}
                initial={{ opacity: 0, y: -8, scale: 0.96, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -8, scale: 0.96, filter: 'blur(4px)' }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                role="listbox"
                aria-label={t('language.header')}
              >
                {/* Header */}
                <div className="px-4 py-3 border-b border-[color:var(--color-border)]">
                  <p className="text-xs font-bold uppercase tracking-widest text-[color:var(--color-text-tertiary)]">
                    {t('language.header')}
                  </p>
                </div>

                {/* Options */}
                <div className="p-1.5">
                  {languages.map((lang) => {
                    const isActive = lang.code === language;
                    return (
                      <motion.button
                        key={lang.code}
                        onClick={() => handleSelect(lang.code)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                          isActive
                            ? 'bg-gold-400/10 text-gold-600'
                            : 'text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-bg-secondary)]'
                        }`}
                        whileHover={{ x: isRTL ? -2 : 2 }}
                        whileTap={{ scale: 0.98 }}
                        role="option"
                        aria-selected={isActive}
                      >
                        <span className="text-lg leading-none">{lang.flag}</span>
                        <span className="flex-1 font-medium">{lang.nativeLabel}</span>
                        <span className="text-xs text-[color:var(--color-text-tertiary)]">
                          {lang.label}
                        </span>
                        {isActive && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                          >
                            <Check className="w-4 h-4 text-gold-500" strokeWidth={2.5} />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Footer hint */}
                <div className="px-4 py-2 border-t border-[color:var(--color-border)] bg-[color:var(--color-bg-secondary)]/50">
                  <p className="text-[10px] text-[color:var(--color-text-tertiary)] text-center">
                    {t('language.rtlHint')}
                  </p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Mobile variant: full-width row inside mobile menu
  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-[color:var(--color-text-secondary)]"
        aria-expanded={isOpen}
      >
        <Globe className="w-5 h-5" />
        <span className="flex-1 text-body font-semibold text-left">
          {t('language.title')}
        </span>
        <span className="text-sm text-gold-500 font-bold">
          {currentLang.flag} {currentLang.code.toUpperCase()}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="mt-1 space-y-1 px-4 pb-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {languages.map((lang) => {
              const isActive = lang.code === language;
              return (
                <motion.button
                  key={lang.code}
                  onClick={() => handleSelect(lang.code)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-gold-400/10 text-gold-600 font-bold'
                      : 'text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-bg-secondary)]'
                  }`}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="flex-1 text-left">{lang.nativeLabel}</span>
                  {isActive && <Check className="w-4 h-4 text-gold-500" strokeWidth={2.5} />}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
