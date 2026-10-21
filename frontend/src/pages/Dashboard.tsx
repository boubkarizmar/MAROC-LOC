import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Property } from '../types';
import { propertyApi } from '../api/propertyApi';
import { analyticsApi, OwnerDashboardData } from '../api/analyticsApi';
import { useAuth } from '../context/AuthContext';
import {
  Plus, Trash2, Eye, MapPin, AlertCircle, LogIn, Building2, Crown,
  TrendingUp, Heart, MessageCircle, Star, Zap, BarChart3, Calendar,
  Edit3, Rocket, Loader2, CheckCircle2, Clock, XCircle, ImageOff,
  ChevronRight, ArrowUpRight, Shield, Smartphone, Megaphone, Search,
  MessageSquare, Bell, CreditCard, LogOut
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { EmptyState, DashboardEmptyState } from '../components/ux/EmptyState';
import { PropertyCardSkeleton } from '../components/ux/PremiumLoading';
import { ScrollReveal, StaggerReveal, AnimatedCounter } from '../components/ux/EmotionalDesign';
import { OnboardingChecklist } from '../components/onboarding/OnboardingWizard';
import { useToast } from '../components/ui/Toast';
import { PromotionModal } from '../components/owner/PromotionModal';
import { fixMediaUrl } from '../utils/imageUtils';

const TenantDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const items = [
    { label: t('dashboard.tenant.search', 'Search'), icon: Search, path: '/search', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
    { label: t('dashboard.tenant.favorites', 'Favorites'), icon: Heart, path: '/favorites', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
    { label: t('dashboard.tenant.messages', 'Messages'), icon: MessageSquare, path: '/messages', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
    { label: t('dashboard.tenant.reservations', 'Reservations & purchases'), icon: CreditCard, path: '/my-transactions', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    { label: t('dashboard.tenant.notifications', 'Notifications'), icon: Bell, path: '/notifications', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    { label: t('dashboard.tenant.home', 'Home'), icon: Building2, path: '/home', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 mb-2">
            {t('dashboard.tenant.welcome', 'My space')}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {t('dashboard.tenant.subtitle', 'Access your favorites, reservations and messages quickly.')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.path}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -2 }}
                onClick={() => navigate(item.path)}
                className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm text-left hover:shadow-md transition"
              >
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${item.color} flex items-center justify-center`}>
                  <Icon size={24} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-50">{item.label}</p>
                </div>
                <ChevronRight className="ml-auto w-5 h-5 text-slate-400" />
              </motion.button>
            );
          })}
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          onClick={logout}
          className="mt-6 w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition font-medium"
        >
          <LogOut size={18} />
          {t('auth.logout', 'Déconnexion')}
        </motion.button>
      </div>
    </div>
  );
};

const statusBadgeConfig: Record<string, { labelKey: string; label: string; color: string; bg: string; icon: any }> = {
  PENDING: { labelKey: 'property.status.PENDING', label: 'Pending', color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
  APPROVED: { labelKey: 'property.status.APPROVED', label: 'Approved', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
  AVAILABLE: { labelKey: 'property.status.AVAILABLE', label: 'Available', color: 'text-blue-600', bg: 'bg-blue-50', icon: CheckCircle2 },
  RESERVED: { labelKey: 'property.status.RESERVED', label: 'Reserved', color: 'text-violet-600', bg: 'bg-violet-50', icon: Shield },
  RENTED: { labelKey: 'property.status.RENTED', label: 'Rented', color: 'text-slate-600', bg: 'bg-slate-100', icon: CheckCircle2 },
  REJECTED: { labelKey: 'property.status.REJECTED', label: 'Rejected', color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
};

const StatCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: number;
  suffix?: string;
  color: string;
  delay?: number;
  onClick?: () => void;
}> = ({ icon: Icon, label, value, suffix, color, delay = 0, onClick }) => (
  <ScrollReveal delay={delay}>
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`rounded-2xl bg-white border border-slate-100 p-5 shadow-sm ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-50 mt-1">
            <AnimatedCounter value={value} suffix={suffix} />
          </p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </motion.div>
  </ScrollReveal>
);

const DashboardPropertyCard: React.FC<{
  property: Property;
  onDelete: (id: number) => void;
  isDeleting: boolean;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onPromote: (property: Property) => void;
  index: number;
  locale: string;
}> = ({ property, onDelete, isDeleting, onView, onEdit, onPromote, index, locale }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { t } = useTranslation();
  const status = statusBadgeConfig[property.status] || statusBadgeConfig.PENDING;
  const StatusIcon = status.icon;

  const imageUrl = property.images?.[0] ? fixMediaUrl(property.images[0]) : null;
  const hasValidImage = imageUrl && !imageError;
  const finalPrice = property.price + (property.additionalFees || 0) - ((property.price * (property.discountPercentage || 0)) / 100);
  const hasDiscount = (property.discountPercentage || 0) > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group border border-slate-100 dark:border-slate-700"
    >
      <div className="relative h-52 overflow-hidden cursor-pointer bg-slate-100" onClick={() => onView(property.id)}>
        {hasValidImage ? (
          <>
            <img
              src={imageUrl}
              alt={property.title}
              className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
            {!imageLoaded && <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />}
          </>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-slate-400">
            <ImageOff size={40} />
            <p className="text-sm mt-2">{t('property.card.previewUnavailable')}</p>
          </div>
        )}
        {hasDiscount && (
          <div className="absolute top-3 right-3">
            <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">-{property.discountPercentage}%</span>
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className="rounded-full bg-teal-600/90 px-2.5 py-1 text-xs font-bold text-white shadow-soft backdrop-blur">
            {t(`property.types.${property.type}`, property.type)}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${status.bg} ${status.color} backdrop-blur`}>
            <StatusIcon size={10} />
            {t(status.labelKey, status.label)}
          </span>
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-black text-lg text-slate-900 dark:text-slate-50 mb-1 line-clamp-1 cursor-pointer hover:text-teal-600 transition" onClick={() => onView(property.id)}>
          {property.title}
        </h3>
        <div className="flex items-center gap-1 text-slate-500 text-sm mb-3">
          <MapPin size={14} className="text-amber-500" />
          <span className="line-clamp-1">{property.city}{property.address && `, ${property.address}`}</span>
        </div>
        <div className="flex items-center gap-3 mb-3 text-slate-500 text-sm">
          {property.surface && property.surface > 0 && (
            <span className="flex items-center gap-1"><Building2 size={14} className="text-teal-600" />{property.surface} m²</span>
          )}
          {property.rooms && property.rooms > 0 && (
            <span>{property.rooms} {t('property.card.bedroomsShort')}</span>
          )}
          <span className="flex items-center gap-1"><Eye size={14} />{property.viewCount || 0}</span>
          <span className="flex items-center gap-1"><Heart size={14} className="text-rose-400" />{property.interestedCount || 0}</span>
        </div>
        <div className="border-t border-slate-100 pt-3 mb-4">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-teal-600">{finalPrice.toLocaleString(locale || 'fr-FR')} {t('common.currency')}</span>
            {property.type === 'RENT' && <span className="text-xs text-slate-400">{t('common.perMonth')}</span>}
          </div>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => onView(property.id)} className="flex-1 bg-teal-600 text-white py-2 rounded-xl font-bold text-xs hover:bg-teal-700 transition flex items-center justify-center gap-1">
            <Eye size={14} /> {t('property.card.view')}
          </button>
          <button onClick={() => onEdit(property.id)} className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition">
            <Edit3 size={14} />
          </button>
          <button onClick={() => onPromote(property)} className="px-3 py-2 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 transition">
            <Rocket size={14} />
          </button>
          <button onClick={() => onDelete(property.id)} disabled={isDeleting} className="px-3 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-50">
            {isDeleting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" /> : <Trash2 size={14} />}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export const Dashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [properties, setProperties] = useState<Property[]>([]);
  const [analytics, setAnalytics] = useState<OwnerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [promoteProperty, setPromoteProperty] = useState<Property | null>(null);
  const { isProprietaire, user, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const locale = i18n.language === 'ar' ? 'ar-MA' : i18n.language === 'en' ? 'en-US' : 'fr-FR';

  const checklistItems = [
    { id: 'add_property', label: t('dashboard.checklist.addProperty', 'Ajouter votre première propriété'), icon: Plus, completed: properties.length > 0 },
    { id: 'verify', label: t('dashboard.checklist.verifyAccount'), icon: Shield, completed: user?.isVerified || false },
    { id: 'analytics', label: t('dashboard.checklist.viewAnalytics'), icon: BarChart3, completed: (analytics?.totalPropertyViews || 0) > 0 },
  ];

  const loadData = async () => {
    setLoading(true);
    setAuthError(false);
    try {
      const [propRes, analyticsRes] = await Promise.all([
        propertyApi.getMyProperties(0, 50),
        analyticsApi.getOwnerDashboard().catch(() => null),
      ]);
      const propData = propRes.data?.content || propRes.data;
      setProperties(Array.isArray(propData) ? propData : []);
      if (analyticsRes) {
        setAnalytics(analyticsRes.data);
      }
    } catch (err: any) {
      if (import.meta.env.DEV) console.error('Error loading dashboard:', err);
      if (err.response?.status === 401 || err.response?.status === 403) setAuthError(true);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (isProprietaire) loadData();
  }, [isProprietaire, user, navigate]);

  const handleDelete = async (id: number) => {
    if (!confirm(t('property.delete.confirm'))) return;
    setDeletingId(id);
    try {
      await propertyApi.delete(id);
      setProperties((prev) => prev.filter((p) => p.id !== id));
      showToast(t('property.delete.success'), 'success');
    } catch (err) {
      showToast(t('property.delete.error'), 'error');
    } finally {
      setDeletingId(null);
    }
  };

  if (authError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
        <EmptyState
          variant="generic"
          title={t('auth.sessionExpiredTitle')}
          description={t('auth.sessionExpiredMessage')}
          actionLabel={t('auth.login.submit')}
          onAction={() => { logout(); navigate('/login'); }}
          secondaryLabel={t('common.retry')}
          onSecondaryAction={loadData}
        />
      </div>
    );
  }

  if (!isProprietaire) {
    return <TenantDashboard />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <ScrollReveal>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 border border-slate-100 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Crown size={24} className="text-amber-500" />
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-50">{t('dashboard.title', 'Tableau de bord')}</h1>
                </div>
                <p className="text-slate-500 mt-1">{t('dashboard.subtitle', 'Gérez vos propriétés')}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/dashboard/visits')}
                  className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-full font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm"
                >
                  <Calendar size={16} /> {t('dashboard.actions.visits')}
                </button>
                <button
                  onClick={() => navigate('/dashboard/analytics')}
                  className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-full font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm"
                >
                  <BarChart3 size={16} /> {t('dashboard.actions.analytics')}
                </button>
                <button
                  onClick={() => navigate('/property/create')}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-morocco-royal to-morocco-emerald text-white px-5 py-2.5 rounded-full font-bold hover:shadow-lg transition shadow-md text-sm"
                >
                  <Plus size={16} /> {t('dashboard.actions.add')}
                </button>
                <button
                  onClick={logout}
                  className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 px-4 py-2.5 rounded-full font-bold hover:bg-red-50 dark:hover:bg-red-900/30 transition text-sm"
                  title={t('auth.logout')}
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Stats */}
        {analytics && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
            <StatCard icon={Building2} label={t('dashboard.stats.properties')} value={analytics.totalProperties} color="bg-teal-600" delay={0} onClick={() => {}} />
            <StatCard icon={Eye} label={t('dashboard.stats.views')} value={analytics.totalPropertyViews} color="bg-blue-500" delay={0.05} />
            <StatCard icon={Heart} label={t('dashboard.stats.favorites')} value={analytics.totalFavorites} color="bg-rose-500" delay={0.1} />
            <StatCard icon={MessageCircle} label={t('dashboard.stats.inquiries')} value={analytics.totalInquiries} color="bg-amber-500" delay={0.15} />
            <StatCard icon={Star} label={t('dashboard.stats.rating')} value={analytics.averageRating} suffix="/5" color="bg-violet-500" delay={0.2} />
            <StatCard icon={Zap} label={t('dashboard.stats.boosts')} value={analytics.activeAds} color="bg-emerald-500" delay={0.25} onClick={() => navigate('/dashboard/analytics')} />
          </div>
        )}

        {!analytics && properties.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <StatCard icon={Building2} label={t('dashboard.stats.totalProperties')} value={properties.length} color="bg-teal-600" delay={0} />
            <StatCard icon={Eye} label={t('dashboard.stats.totalViews')} value={properties.reduce((sum, p) => sum + (p.viewCount || 0), 0)} color="bg-morocco-atlas" delay={0.1} />
            <StatCard icon={TrendingUp} label={t('dashboard.stats.avgPrice')} value={Math.round((properties.reduce((sum, p) => sum + p.price, 0) / properties.length) / 1000)} suffix={`k ${t('common.currency')}`} color="bg-amber-400" delay={0.2} />
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_340px] gap-6 mt-6">
          {/* Main Content */}
          <div>
            {/* Pending properties alert */}
            {analytics && analytics.pendingProperties > 0 && (
              <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3">
                <Clock size={20} className="text-amber-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    {t('dashboard.pendingAlert.title', { count: analytics.pendingProperties })}
                  </p>
                  <p className="text-xs text-amber-600">
                    {t('dashboard.pendingAlert.subtitle')}
                  </p>
                </div>
              </div>
            )}

            {loading ? (
              <PropertyCardSkeleton count={3} />
            ) : properties.length === 0 ? (
              <DashboardEmptyState onAdd={() => navigate('/property/create')} />
            ) : (
              <StaggerReveal className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {properties.map((property, index) => (
                  <DashboardPropertyCard
                    key={property.id}
                    property={property}
                    onDelete={handleDelete}
                    isDeleting={deletingId === property.id}
                    onView={(id) => navigate(`/property/${id}`)}
                    onEdit={(id) => navigate(`/property/${id}/edit`)}
                    onPromote={(p) => setPromoteProperty(p)}
                    index={index}
                    locale={locale}
                  />
                ))}
              </StaggerReveal>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <OnboardingChecklist
              items={checklistItems}
              onItemClick={(id) => {
                if (id === 'add_property') navigate('/property/create');
                if (id === 'verify') navigate('/profile');
                if (id === 'analytics') navigate('/dashboard/analytics');
              }}
            />

            {/* Quick Actions */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 mb-3">{t('dashboard.quickActions.title')}</h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/property/create')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition text-left"
                >
                  <div className="p-2 rounded-lg bg-teal-100 text-teal-600">
                    <Plus size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{t('dashboard.quickActions.newListing')}</p>
                    <p className="text-xs text-slate-500">{t('dashboard.quickActions.publish')}</p>
                  </div>
                  <ChevronRight size={16} className="ml-auto text-slate-400" />
                </button>
                <button
                  onClick={() => navigate('/dashboard/visits')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition text-left"
                >
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{t('dashboard.actions.visits')}</p>
                    <p className="text-xs text-slate-500">{t('dashboard.quickActions.manageVisits')}</p>
                  </div>
                  <ChevronRight size={16} className="ml-auto text-slate-400" />
                </button>
                <button
                  onClick={() => navigate('/dashboard/analytics')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition text-left"
                >
                  <div className="p-2 rounded-lg bg-violet-100 text-violet-600">
                    <BarChart3 size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{t('dashboard.actions.analytics')}</p>
                    <p className="text-xs text-slate-500">{t('dashboard.quickActions.performance')}</p>
                  </div>
                  <ChevronRight size={16} className="ml-auto text-slate-400" />
                </button>
                <button
                  onClick={() => properties.length > 0 ? setPromoteProperty(properties[0]) : undefined}
                  disabled={properties.length === 0}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                    <Rocket size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{t('dashboard.quickActions.boost')}</p>
                    <p className="text-xs text-slate-500">{t('dashboard.quickActions.visibility')}</p>
                  </div>
                  <ChevronRight size={16} className="ml-auto text-slate-400" />
                </button>
                <button
                  onClick={() => navigate('/ads/create')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition text-left"
                >
                  <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                    <Megaphone size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{t('dashboard.quickActions.ad')}</p>
                    <p className="text-xs text-slate-500">{t('dashboard.quickActions.createCampaign')}</p>
                  </div>
                  <ChevronRight size={16} className="ml-auto text-slate-400" />
                </button>
              </div>
            </div>

            {/* Mobile App Promo */}
            <div className="bg-gradient-to-br from-morocco-royal to-morocco-emerald rounded-2xl p-5 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone size={20} />
                <h3 className="font-bold">{t('dashboard.mobileApp.title')}</h3>
              </div>
              <p className="text-sm text-white/80 mb-3">
                {t('dashboard.mobileApp.description')}
              </p>
              <button className="w-full py-2 rounded-xl bg-white/20 text-sm font-medium hover:bg-white/30 transition">
                {t('dashboard.mobileApp.download')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Promotion Modal */}
      <PromotionModal
        isOpen={!!promoteProperty}
        onClose={() => setPromoteProperty(null)}
        propertyId={promoteProperty?.id}
        propertyTitle={promoteProperty?.title}
      />
    </div>
  );
};

export default Dashboard;
