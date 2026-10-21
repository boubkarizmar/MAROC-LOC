import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Search, MapPin, Home, Sparkles, TrendingUp, Clock,
  X, ArrowRight, Building2
} from 'lucide-react';
import { fixMediaUrl } from '../../utils/imageUtils';

interface SearchSuggestion {
  type: 'recent' | 'trending' | 'ai' | 'city' | 'property_type';
  text: string;
  subtextKey?: string;
  icon?: React.ElementType;
}

interface PredictiveSearchProps {
  onSearch: (query: string) => void;
  onAISearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
}

const TRENDING_SEARCHES = [
  { type: 'trending' as const, text: 'Villa avec piscine Marrakech', subtextKey: 'trending', icon: TrendingUp },
  { type: 'trending' as const, text: 'Appartement neuf Casablanca', subtextKey: 'trending', icon: TrendingUp },
  { type: 'trending' as const, text: 'Riad rénové Médina', subtextKey: 'trending', icon: TrendingUp },
  { type: 'city' as const, text: 'Tanger', subtextKey: 'city', icon: MapPin },
  { type: 'city' as const, text: 'Rabat Agdal', subtextKey: 'neighborhood', icon: MapPin },
  { type: 'property_type' as const, text: 'Duplex', subtextKey: 'type', icon: Home },
];

export const PredictiveSearch: React.FC<PredictiveSearchProps> = ({
  onSearch,
  onAISearch,
  placeholder,
  className = '',
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const placeholderText = placeholder || t('search.placeholder', 'Rechercher un bien, une ville, un quartier...');

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('marocloc_recent_searches');
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Update suggestions based on query
  useEffect(() => {
    if (!query.trim()) {
      const recents: SearchSuggestion[] = recentSearches.slice(0, 4).map((text) => ({
        type: 'recent',
        text,
        subtextKey: 'recent',
        icon: Clock,
      }));
      setSuggestions([...recents, ...TRENDING_SEARCHES]);
      return;
    }

    // Filter trending based on query
    const filtered = TRENDING_SEARCHES.filter(
      (s) => s.text.toLowerCase().includes(query.toLowerCase())
    );

    // Add AI suggestion if query is substantial
    const aiSuggestion: SearchSuggestion[] = query.length > 3 ? [{
      type: 'ai',
      text: query,
      subtextKey: 'aiPowered',
      icon: Sparkles,
    }] : [];

    setSuggestions([...aiSuggestion, ...filtered]);
  }, [query, recentSearches]);

  const saveSearch = useCallback((searchQuery: string) => {
    setRecentSearches((prev) => {
      const updated = [searchQuery, ...prev.filter((s) => s !== searchQuery)].slice(0, 8);
      localStorage.setItem('marocloc_recent_searches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleSubmit = (searchQuery: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    saveSearch(q);
    setIsOpen(false);
    setQuery('');
    onSearch(q);
  };

  const handleAISearch = (searchQuery: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    setIsAIThinking(true);
    saveSearch(q);
    setTimeout(() => {
      setIsAIThinking(false);
      setIsOpen(false);
      setQuery('');
      onAISearch?.(q);
    }, 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        const s = suggestions[activeIndex];
        if (s.type === 'ai') {
          handleAISearch(query);
        } else {
          setQuery(s.text);
          handleSubmit(s.text);
        }
      } else {
        handleSubmit(query);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('marocloc_recent_searches');
  };

  const hasRecents = suggestions.some((s) => s.type === 'recent');
  const hasTrending = suggestions.some((s) => s.type === 'trending' || s.type === 'city' || s.type === 'property_type');

  const getSubtext = (subtextKey?: string) => {
    switch (subtextKey) {
      case 'trending': return t('search.trending', 'Tendance');
      case 'city': return t('search.city', 'Ville');
      case 'neighborhood': return t('search.neighborhood', 'Quartier');
      case 'type': return t('search.type', 'Type');
      case 'recent': return t('search.recent', 'Récent');
      case 'aiPowered': return t('search.aiPowered', 'Propulsé par IA');
      default: return '';
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          {isAIThinking ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles size={20} className="text-amber-500" />
            </motion.div>
          ) : (
            <Search size={20} className="text-amber-500" />
          )}
        </div>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholderText}
          className="w-full h-14 pl-12 pr-24 rounded-2xl border border-slate-200 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition-all shadow-sm"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="search-suggestions"
        />
        <div className="absolute inset-y-0 right-2 flex items-center gap-1">
          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition"
            >
              <X size={16} />
            </button>
          )}
          <button
            onClick={() => query.length > 3 ? handleAISearch(query) : handleSubmit(query)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 text-white text-sm font-medium hover:shadow-md transition"
          >
            {query.length > 3 ? (
              <>
                <Sparkles size={14} />
                <span className="hidden sm:inline">IA</span>
              </>
            ) : (
              <ArrowRight size={16} />
            )}
          </button>
        </div>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="search-suggestions"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl overflow-hidden z-50"
          >
            {suggestions.length === 0 ? (
              <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-sm">
                {t('search.noSuggestions', 'Aucune suggestion. Appuyez sur Entrée pour rechercher.')}
              </div>
            ) : (
              <div className="py-2 max-h-[400px] overflow-y-auto">
                {/* AI Suggestion */}
                {suggestions.filter((s) => s.type === 'ai').map((s, i) => (
                  <button
                    key={`ai-${i}`}
                    onClick={() => handleAISearch(query)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                      activeIndex === i ? 'bg-teal-600/5 dark:bg-teal-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 to-teal-600/20">
                      <Sparkles size={16} className="text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                        {t('search.aiSearch', 'Recherche IA : "{{query}}"', { query: s.text })}
                      </p>
                      <p className="text-xs text-teal-600 dark:text-teal-400">{getSubtext(s.subtextKey)}</p>
                    </div>
                  </button>
                ))}

                {/* Recent searches */}
                {hasRecents && (
                  <div className="px-4 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        {t('search.recentSearches', 'Recherches récentes')}
                      </span>
                      <button
                        onClick={clearRecent}
                        className="text-[11px] text-slate-400 dark:text-slate-500 hover:text-red-500 transition"
                      >
                        {t('search.clear', 'Effacer')}
                      </button>
                    </div>
                  </div>
                )}
                {suggestions.filter((s) => s.type === 'recent').map((s, i) => (
                  <button
                    key={`recent-${i}`}
                    onClick={() => { setQuery(s.text); handleSubmit(s.text); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition ${
                      activeIndex === suggestions.indexOf(s) ? 'bg-teal-600/5 dark:bg-teal-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Clock size={14} className="text-slate-400 shrink-0" />
                    <span className="text-sm text-slate-900 dark:text-slate-50">{s.text}</span>
                  </button>
                ))}

                {/* Trending */}
                {hasTrending && (
                  <div className="px-4 py-2 mt-1">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {t('search.trending', 'Tendances')}
                    </span>
                  </div>
                )}
                {suggestions.filter((s) => s.type === 'trending' || s.type === 'city' || s.type === 'property_type').map((s, i) => {
                  const Icon = s.icon || Search;
                  const actualIndex = suggestions.indexOf(s);
                  return (
                    <button
                      key={`trend-${i}`}
                      onClick={() => { setQuery(s.text); handleSubmit(s.text); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition ${
                        activeIndex === actualIndex ? 'bg-teal-600/5 dark:bg-teal-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Icon size={14} className="text-slate-400 shrink-0" />
                      <span className="text-sm text-slate-900 dark:text-slate-50 flex-1">{s.text}</span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">{getSubtext(s.subtextKey)}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                {t('search.keyboardNav', 'Appuyez sur')}{' '}
                <kbd className="px-1 py-0.5 rounded bg-white dark:bg-slate-700 border dark:border-slate-600 text-[10px]">↑</kbd>{' '}
                <kbd className="px-1 py-0.5 rounded bg-white dark:bg-slate-700 border dark:border-slate-600 text-[10px]">↓</kbd>{' '}
                {t('search.keyboardNavSuffix', 'pour naviguer')}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                <kbd className="px-1 py-0.5 rounded bg-white dark:bg-slate-700 border dark:border-slate-600 text-[10px]">{t('search.enter', 'Entrée')}</kbd>{' '}
                {t('search.keyboardSelect', 'pour sélectionner')}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── AI Search Results ──────────────────────────────────────────────
export const AISearchResults: React.FC<{
  query: string;
  results: Array<{
    id: string;
    title: string;
    city: string;
    type: string;
    price: number;
    bedrooms?: number;
    area_sqm?: number;
    imageUrl?: string;
    relevance: number;
  }>;
  loading: boolean;
  onSelect: (id: string) => void;
  className?: string;
}> = ({ query, results, loading, onSelect, className = '' }) => {
  const { t } = useTranslation();
  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={16} className="text-amber-500" />
        <h3 className="font-semibold text-slate-900 dark:text-slate-50">
          {t('search.aiResultsFor', 'Résultats IA pour "{{query}}"', { query })}
        </h3>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-700 animate-pulse" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          <Search size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
          <p>{t('search.noResults', 'Aucun résultat trouvé. Essayez d\'autres mots-clés.')}</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {results.map((result, i) => (
            <motion.button
              key={result.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => onSelect(result.id)}
              className="flex items-start gap-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3 hover:border-teal-500/30 hover:shadow-sm transition text-left"
            >
              <div className="h-16 w-16 rounded-lg bg-slate-100 dark:bg-slate-700 shrink-0 overflow-hidden">
                {result.imageUrl ? (
                  <img
                    src={fixMediaUrl(result.imageUrl)}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <Home size={20} className="m-5 text-slate-400 dark:text-slate-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">{result.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{result.city} · {result.type}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-sm font-bold text-teal-600 dark:text-teal-400">
                    {result.price.toLocaleString()} MAD
                  </span>
                  {result.bedrooms && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">{result.bedrooms} {t('search.bedroomsShort', 'ch.')}</span>
                  )}
                  {result.area_sqm && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">{result.area_sqm} {t('common.squareMeter')}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] font-medium text-amber-500 bg-amber-400/10 px-1.5 py-0.5 rounded">
                  {(result.relevance * 100).toFixed(0)}%
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PredictiveSearch;
