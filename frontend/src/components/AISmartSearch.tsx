import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { moroccanAIApi } from '../api/moroccanAIApi';
import { AISearchResult } from '../types/ai';
import { AIVoiceSearch } from './AIVoiceSearch';

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const SparkleIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
  </svg>
);

export const AISmartSearch: React.FC = () => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AISearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await moroccanAIApi.search(query.trim(), 6);
      setResults(res.data.results || []);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('AI Search error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceResult = (text: string) => {
    setQuery(text);
    // Auto search after voice input
    setTimeout(() => {
      const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
      handleSearch(fakeEvent);
    }, 100);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form
        onSubmit={handleSearch}
        className="flex items-center gap-2 bg-white border border-gray-300 rounded-xl px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500"
      >
        <SearchIcon />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('aiSearch.placeholder')}
          className="flex-1 outline-none text-sm md:text-base bg-transparent"
          dir="auto"
        />
        <AIVoiceSearch onTranscript={handleVoiceResult} language="auto" />
        <button
          type="submit"
          disabled={loading}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1"
        >
          <SparkleIcon />
          {loading ? '...' : t('aiSearch.button')}
        </button>
      </form>

      {/* Results */}
      {searched && (
        <div className="mt-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            </div>
          ) : results.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              {t('aiSearch.noResults')}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((r) => (
                <a
                  key={r.id}
                  href={`/property/${r.id}`}
                  className="block bg-white border rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                    {r.metadata.type}
                  </div>
                  <h3 className="font-bold text-gray-900 mt-1">{r.metadata.title}</h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{r.document}</p>
                  <div className="flex items-center justify-between mt-3 text-sm">
                    <span className="text-gray-500">
                      {r.metadata.city}, {r.metadata.neighborhood}
                    </span>
                    <span className="font-bold text-emerald-700">
                      {t('chatbot.price', { price: r.metadata.price.toLocaleString() })}
                    </span>
                  </div>
                  <div className="flex gap-3 mt-2 text-xs text-gray-500">
                    <span>{t('aiSearch.bedrooms', { count: r.metadata.bedrooms })}</span>
                    <span>{t('aiSearch.area', { area: r.metadata.area_sqm })}</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};