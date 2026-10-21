import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsApi, OwnerDashboardData } from '../api/analyticsApi';
import { useToast } from '../components/ui/Toast';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Building2, Eye, Heart, MessageCircle, Star, TrendingUp,
  DollarSign, Rocket, Loader2, BarChart3, ArrowUpRight, ArrowDownRight,
  MapPin, Crown, Zap
} from 'lucide-react';

const StatCard: React.FC<{
  icon: any;
  label: string;
  value: string | number;
  subValue?: string;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
}> = ({ icon: Icon, label, value, subValue, color, trend }) => {
  const { t } = useTranslation();
  return (
  <motion.div
    whileHover={{ y: -2 }}
    className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
        {subValue && <p className="text-xs text-slate-400 mt-0.5">{subValue}</p>}
      </div>
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
    </div>
    {trend && (
      <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
        trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-slate-500'
      }`}>
        {trend === 'up' ? <ArrowUpRight size={12} /> : trend === 'down' ? <ArrowDownRight size={12} /> : null}
        {trend === 'up' ? t('analytics.trend.up') : trend === 'down' ? t('analytics.trend.down') : t('analytics.trend.stable')}
      </div>
    )}
  </motion.div>
  );
};

export const OwnerAnalytics: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isProprietaire } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState<OwnerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (!isProprietaire) { navigate('/home'); return; }
    loadAnalytics();
  }, [user, isProprietaire, navigate]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await analyticsApi.getOwnerDashboard();
      setData(res.data);
    } catch (err) {
      showToast(t('analytics.loadingError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-teal-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">{t('analytics.noData')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition">
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">{t('analytics.back')}</span>
          </button>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <BarChart3 size={24} className="text-teal-600" />
            {t('analytics.title')}
          </h1>
          <button onClick={loadAnalytics} className="p-2 rounded-lg hover:bg-slate-100 transition">
            <Loader2 size={16} className={`text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <StatCard icon={Building2} label={t('analytics.stats.properties')} value={data.totalProperties} color="bg-teal-600" />
          <StatCard icon={Eye} label={t('analytics.stats.totalViews')} value={data.totalPropertyViews.toLocaleString()} color="bg-blue-500" />
          <StatCard icon={Heart} label={t('analytics.stats.favorites')} value={data.totalFavorites.toLocaleString()} color="bg-rose-500" />
          <StatCard icon={MessageCircle} label={t('analytics.stats.inquiries')} value={data.totalInquiries.toLocaleString()} color="bg-amber-500" />
          <StatCard icon={Star} label={t('analytics.stats.avgRating')} value={data.averageRating.toFixed(1)} subValue={t('analytics.stats.reviews', { count: data.totalReviews })} color="bg-violet-500" />
          <StatCard icon={DollarSign} label={t('analytics.stats.adSpend')} value={`${data.totalAdSpend} ${t('common.currency')}`} color="bg-emerald-500" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Property Status */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Building2 size={18} className="text-teal-600" />
              {t('analytics.propertyStatus.title')}
            </h2>
            <div className="space-y-3">
              {[
                { label: t('analytics.propertyStatus.active'), value: data.activeProperties, total: data.totalProperties, color: 'bg-emerald-500' },
                { label: t('analytics.propertyStatus.pending'), value: data.pendingProperties, total: data.totalProperties, color: 'bg-amber-500' },
                { label: t('analytics.propertyStatus.inactive'), value: data.totalProperties - data.activeProperties - data.pendingProperties, total: data.totalProperties, color: 'bg-slate-300' },
              ].map((item) => {
                const pct = item.total > 0 ? Math.round((item.value / item.total) * 100) : 0;
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-600">{item.label}</span>
                      <span className="font-medium text-slate-900">{item.value} ({pct}%)</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${item.color} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ads Performance */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Rocket size={18} className="text-amber-500" />
              {t('analytics.ads.title')}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-slate-900">{data.activeAds}</p>
                <p className="text-xs text-slate-500">{t('analytics.ads.active')}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-slate-900">{data.totalAds}</p>
                <p className="text-xs text-slate-500">{t('analytics.ads.total')}</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
              <p className="text-sm text-amber-800 flex items-center gap-2">
                <Crown size={14} />
                {t('analytics.ads.boostTip')}
              </p>
            </div>
          </div>
        </div>

        {/* Top Properties */}
        {data.topProperties && data.topProperties.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-violet-500" />
              {t('analytics.topProperties.title')}
            </h2>
            <div className="space-y-2">
              {data.topProperties.map((prop, index) => (
                <motion.div
                  key={prop.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                  onClick={() => navigate(`/property/${prop.id}`)}
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                    index === 0 ? 'bg-amber-100 text-amber-700' :
                    index === 1 ? 'bg-slate-200 text-slate-700' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{prop.title}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin size={10} />{prop.city}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{t('analytics.topProperties.views', { count: prop.views })}</p>
                    <p className="text-xs text-slate-500">{prop.price?.toLocaleString()} {t('common.currency')}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerAnalytics;
