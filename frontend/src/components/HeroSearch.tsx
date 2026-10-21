import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Building, Crown, Home, Landmark, MapPin, Search, Sparkles } from 'lucide-react';
import { useCities } from '../../hooks/useCities';

type PropertyType = 'RENT' | 'BUY' | 'MORTGAGE';

interface HeroSearchProps {
  onSearch?: (params: { city: string; type: PropertyType; keyword: string }) => void;
}


const CitiesOptions: React.FC = () => {
  const { t } = useTranslation();
  const { data: cities, isLoading } = useCities();
  if (isLoading) return <option value="">{t('common.loading')}</option>;
  return (
    <>
      {cities?.map((city: string) => (
        <option key={city} value={city}>
          {city}
        </option>
      ))}
    </>
  );
};

export const HeroSearch: React.FC<HeroSearchProps> = ({ onSearch }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<PropertyType>('RENT');
  const [city, setCity] = useState('');
  const [keyword, setKeyword] = useState('');

  const tabs = [
    { value: 'RENT' as const, label: t('property.types.RENT', 'Location'), icon: Home },
    { value: 'BUY' as const, label: t('property.types.BUY', 'Achat'), icon: Building },
    { value: 'MORTGAGE' as const, label: t('property.types.MORTGAGE', 'Rahn'), icon: Landmark },
  ];

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    onSearch?.({ city, type: activeTab, keyword });
  };

  return (
    <form onSubmit={handleSearch} className="premium-glass rounded-[2rem] p-3 text-left" role="search">
      <div className="flex flex-wrap gap-2 border-b border-amber-400/20 px-2 pb-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-black transition sm:flex-none ${
                active ? 'bg-teal-600 text-white shadow-luxury' : 'bg-white/70 text-slate-900 dark:text-slate-50 hover:bg-amber-50'
              }`}
              aria-pressed={active}
            >
              <Icon size={17} aria-hidden="true" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 p-2 lg:grid-cols-[1.2fr_0.9fr_auto]">
        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-teal-600">
            <Sparkles size={14} aria-hidden="true" />
            {t('property.search.keyword', 'Mots-cles')}
          </span>
          <span className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-amber-500" aria-hidden="true" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder={t('search.placeholder')}
              className="luxury-input h-14 pl-12"
              aria-label={t('property.search.keyword', 'Mots-cles')}
            />
          </span>
        </label>

        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-teal-600">
            <MapPin size={14} aria-hidden="true" />
            {t('property.search.city', 'Ville')}
          </span>
          <select value={city} onChange={(event) => setCity(event.target.value)} className="luxury-input h-14" aria-label={t('property.search.city', 'Ville')}>
            <option value="">{t('property.search.cityPlaceholder', 'Toutes les villes')}</option>
            <CitiesOptions />
          </select>
        </label>

        <div className="flex items-end">
          <button type="submit" className="btn-primary h-14 w-full px-8 lg:w-auto" aria-label={t('property.search.submit', 'Rechercher')}>
            <Search size={18} aria-hidden="true" />
            {t('search.button')}
          </button>
        </div>
      </div>
    </form>
  );
};
