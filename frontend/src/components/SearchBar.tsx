import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { Search, MapPin } from 'lucide-react';

interface SearchBarProps {
  onSearch: (params: {
    city: string;
    minPrice: string;
    maxPrice: string;
    propertyType: string;
    keyword: string;
  }) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [city, setCity] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [propertyType, setPropertyType] = useState('any');
  const [keyword, setKeyword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ city, minPrice, maxPrice, propertyType, keyword });
  };

  const inputClass = "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-200";
  const labelClass = "block text-sm font-medium text-slate-700 mb-2";

  return (
    <form onSubmit={handleSubmit} className="rounded-[32px] bg-white p-6 shadow-xl shadow-slate-200/50">
      <h3 className={`text-lg font-semibold mb-4 ${isRTL ? 'text-right font-arabic' : ''}`}>
        {t('property.search.title')}
      </h3>

      <div className="grid gap-4 md:grid-cols-[1.5fr_1fr_1fr_0.9fr]">
        <div>
          <label className={labelClass}>{t('property.search.city')}</label>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-4 top-4 text-slate-400" size={20} />
            <input
              type="text"
              placeholder={t('property.search.cityPlaceholder')}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={`${inputClass} pl-11`}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>{t('property.search.minPrice')}</label>
          <input
            type="number"
            placeholder="0"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>{t('property.search.maxPrice')}</label>
          <input
            type="number"
            placeholder="10000"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>{t('property.search.propertyType')}</label>
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className={inputClass}
          >
            <option value="any">{t('property.search.propertyTypeAny')}</option>
            <option value="apartment">{t('property.search.propertyTypeApartment')}</option>
            <option value="villa">{t('property.search.propertyTypeVilla')}</option>
            <option value="studio">{t('property.search.propertyTypeStudio')}</option>
            <option value="commercial">{t('property.search.propertyTypeCommercial')}</option>
          </select>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[2.2fr_1fr]">
        <div>
          <label className={labelClass}>{t('property.search.keyword')}</label>
          <input
            type="text"
            placeholder={t('property.search.keywordPlaceholder')}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          className="inline-flex min-h-[54px] items-center justify-center rounded-2xl bg-primary-500 px-6 text-sm font-semibold text-white transition hover:bg-primary-600"
        >
          <Search size={20} className="mr-2" />
          {t('property.search.submit')}
        </button>
      </div>
    </form>
  );
};