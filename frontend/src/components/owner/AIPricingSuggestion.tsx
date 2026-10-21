import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Loader2, Zap, ArrowUp, ArrowDown, Minus, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { aiApi } from '../../api/aiApi';

interface AIPricingSuggestionProps {
  propertyData: {
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
    hasElevator?: boolean;
    cityCenter?: boolean;
    nearTram?: boolean;
    seaView?: boolean;
    condition?: 'NEW' | 'GOOD' | 'RENOVATED' | 'TO_RENOVATE';
    buildingAge?: number;
  };
  currentPrice?: number;
  onPriceSuggested?: (price: number) => void;
}

export const AIPricingSuggestion: React.FC<AIPricingSuggestionProps> = ({
  propertyData,
  currentPrice,
  onPriceSuggested,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const { t } = useTranslation();

  const suggest = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await aiApi.suggestPrice(propertyData);
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || t('aiPricing.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const canSuggest = propertyData.city && propertyData.surface > 0 && propertyData.rooms > 0;

  const confidenceColor = result?.confidence === 'high' ? 'text-emerald-600 bg-emerald-50' :
    result?.confidence === 'medium' ? 'text-amber-600 bg-amber-50' : 'text-orange-600 bg-orange-50';

  const trendIcon = result?.market_trend === 'up' ? <ArrowUp size={14} /> :
    result?.market_trend === 'down' ? <ArrowDown size={14} /> : <Minus size={14} />;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={suggest}
          disabled={isLoading || !canSuggest}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-medium hover:shadow-md transition disabled:opacity-50"
        >
          {isLoading ? (
            <><Loader2 size={14} className="animate-spin" /> {t('aiPricing.analyzing')}</>
          ) : (
            <><Zap size={14} /> {t('aiPricing.estimate')}</>
          )}
        </motion.button>

        {!canSuggest && (
          <span className="text-xs text-amber-600">{t('aiPricing.fillRequired')}</span>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-800">{t('aiPricing.title')}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${confidenceColor}`}>
                {t('aiPricing.confidence', { level: t(`aiPricing.confidenceLevel.${result.confidence || 'low'}`) })}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/70 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-500">{t('aiPricing.suggestedPrice')}</p>
                <p className="text-xl font-black text-emerald-700">{result.suggested_price.toLocaleString()} DH</p>
              </div>
              <div className="bg-white/70 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-500">{t('aiPricing.range')}</p>
                <p className="text-sm font-bold text-slate-700">
                  {result.price_range_min.toLocaleString()} - {result.price_range_max.toLocaleString()} DH
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-slate-600">
                {trendIcon} {t('aiPricing.market')}: {t(`admin.trend.${result.market_trend || 'stable'}`)}
              </span>
              <span className="text-slate-500">
                {result.price_per_sqm.toLocaleString()} DH/m²
              </span>
              <span className="text-slate-500">
                {t('aiPricing.comparables', { count: result.comparable_count })}
              </span>
            </div>

            {currentPrice && (
              <div className="text-xs">
                {currentPrice < result.price_range_min ? (
                  <span className="text-amber-600 flex items-center gap-1">
                    <AlertCircle size={12} /> {t('aiPricing.belowMarket', { percent: Math.round((1 - currentPrice / result.suggested_price) * 100) })}
                  </span>
                ) : currentPrice > result.price_range_max ? (
                  <span className="text-amber-600 flex items-center gap-1">
                    <AlertCircle size={12} /> {t('aiPricing.aboveMarket', { percent: Math.round((currentPrice / result.suggested_price - 1) * 100) })}
                  </span>
                ) : (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={12} /> {t('aiPricing.inRange')}
                  </span>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-emerald-700 underline hover:text-emerald-800"
            >
              {showDetails ? t('common.less') : t('common.more')} {t('aiPricing.factors')}
            </button>

            <>
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1"
                >
                  {result.factors.map((factor: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-white/50 rounded-lg px-2 py-1">
                      <span className="text-slate-700">{factor.name}</span>
                      <span className={`font-medium ${factor.positive ? 'text-emerald-600' : 'text-red-500'}`}>
                        {factor.impact}
                      </span>
                    </div>
                  ))}
                </motion.div>
              )}
            </>

            {onPriceSuggested && (
              <button
                type="button"
                onClick={() => onPriceSuggested(result.suggested_price)}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition"
              >
                <CheckCircle2 size={14} /> {t('aiPricing.apply', { price: result.suggested_price.toLocaleString() })}
              </button>
            )}
          </motion.div>
        )}
      </>
    </div>
  );
};
