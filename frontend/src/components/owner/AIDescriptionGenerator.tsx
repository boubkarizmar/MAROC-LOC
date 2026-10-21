import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Sparkles, Loader2, Wand2, RefreshCw, Check, Languages, Type } from 'lucide-react';
import { aiApi } from '../../api/aiApi';

interface AIDescriptionGeneratorProps {
  propertyData: {
    title: string;
    city: string;
    category: string;
    propertyType: 'RENT' | 'BUY' | 'MORTGAGE';
    surface: number;
    rooms: number;
    bedrooms?: number;
    bathrooms?: number;
    furnished?: boolean;
    hasParking?: boolean;
    hasPool?: boolean;
    hasGarden?: boolean;
    hasAirConditioning?: boolean;
    hasInternet?: boolean;
    hasSecurity?: boolean;
    hasBalcony?: boolean;
    hasElevator?: boolean;
    cityCenter?: boolean;
    nearSchool?: boolean;
    nearUniversity?: boolean;
    nearMosque?: boolean;
    nearHospital?: boolean;
    nearTram?: boolean;
    nearBus?: boolean;
    nearTrainStation?: boolean;
    seaView?: boolean;
    gardenView?: boolean;
    quietArea?: boolean;
    familyArea?: boolean;
    modernArea?: boolean;
  };
  onDescriptionGenerated: (description: string) => void;
  currentDescription?: string;
}

export const AIDescriptionGenerator: React.FC<AIDescriptionGeneratorProps> = ({
  propertyData,
  onDescriptionGenerated,
  currentDescription = '',
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [highlights, setHighlights] = useState<string[]>([]);
  const [language, setLanguage] = useState<'fr' | 'ar' | 'en'>('fr');
  const [tone, setTone] = useState<'professional' | 'friendly' | 'luxury' | 'concise'>('professional');
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const generate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await aiApi.generateDescription({
        ...propertyData,
        language,
        tone,
      });
      setGeneratedDescription(response.data.description);
      setHighlights(response.data.highlights);
      setShowPreview(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || t('aiDescription.error'));
    } finally {
      setIsGenerating(false);
    }
  };

  const applyDescription = () => {
    onDescriptionGenerated(generatedDescription);
    setShowPreview(false);
  };

  const canGenerate = propertyData.title && propertyData.city && propertyData.surface > 0 && propertyData.rooms > 0;

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1">
          {(['fr', 'ar', 'en'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                language === lang
                  ? 'bg-white text-teal-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {lang === 'fr' ? 'FR' : lang === 'ar' ? 'AR' : 'EN'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1">
          {([
            { key: 'professional', label: 'Pro' },
            { key: 'friendly', label: 'Convivial' },
            { key: 'luxury', label: 'Luxe' },
            { key: 'concise', label: 'Court' },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setTone(t.key)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                tone === t.key
                  ? 'bg-white text-teal-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={generate}
          disabled={isGenerating || !canGenerate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-medium hover:shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
        >
          {isGenerating ? (
            <><Loader2 size={14} className="animate-spin" /> {t('aiDescription.generating')}</>
          ) : (
            <><Wand2 size={14} /> {t('aiDescription.generate')}</>
          )}
        </motion.button>
      </div>

      {!canGenerate && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <Sparkles size={12} />
          {t('aiDescription.fillRequired')}
        </p>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Preview */}
      <>
        {showPreview && generatedDescription && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-4 space-y-3"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-violet-600" />
              <span className="text-sm font-semibold text-violet-800">{t('aiDescription.previewTitle')}</span>
            </div>

            {highlights.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {highlights.map((h, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white text-xs text-violet-700 border border-violet-100">
                    <Check size={10} />
                    {h}
                  </span>
                ))}
              </div>
            )}

            <div className="text-sm text-slate-700 leading-relaxed bg-white/60 rounded-lg p-3">
              {generatedDescription}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={applyDescription}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition"
              >
                <Check size={14} /> {t('aiDescription.apply')}
              </button>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-white transition"
              >
                {t('common.close')}
              </button>
              <button
                type="button"
                onClick={generate}
                disabled={isGenerating}
                className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white transition"
              >
                <RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} />
              </button>
            </div>
          </motion.div>
        )}
      </>
    </div>
  );
};
