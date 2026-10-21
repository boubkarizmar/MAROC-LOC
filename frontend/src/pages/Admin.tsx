import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  adminApi, EnhancedPlatformStats, EventLogEntry,
  AdminAd, AdminReview, AdminPayment, AdminAnalyticsDTO,
  MonthlyPoint, YearlyPoint,
} from '../api/adminApi';
import { analyticsApi, ChartDataPoint } from '../api/analyticsApi';
import { ensureValidToken } from '../api/axiosConfig';
import { useToast } from '../components/ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Building2, Users, ShieldCheck, BarChart3, Settings,
  Search, Filter, CheckCircle2, XCircle, Trash2, Eye, Loader2,
  AlertTriangle, TrendingUp, DollarSign, MessageCircle, Heart,
  MapPin, Crown, Clock, Smartphone, Globe, ChevronRight,
  Activity, LogOut, RefreshCw, Star, Zap, Flag, FileText,
  ArrowUpRight, ArrowDownRight, Minus, Check, X, Megaphone,
  Volume2, Ban, UserCog, PieChart, LineChart as LineChartIcon,
  Menu, type LucideIcon,
} from 'lucide-react';
import { fixMediaUrl } from '../utils/imageUtils';
import {
  LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';

// ─── Types ──────────────────────────────────────────────────────────
type AdminTab =
  | 'dashboard'
  | 'properties'
  | 'ads'
  | 'users'
  | 'reviews'
  | 'transactions'
  | 'analytics'
  | 'trust'
  | 'settings';

interface PropertyRow {
  id: number;
  title: string;
  city: string;
  price: number;
  status: string;
  ownerName: string;
  viewCount: number;
  createdAt: string;
  images?: string[];
  isVerified: boolean;
}

interface UserRow {
  id: number;
  name: string;
  email: string;
  role: string;
  city?: string;
  isVerified: boolean;
  createdAt: string;
  phoneNumber?: string;
}

// ─── Colors for charts ──────────────────────────────────────────────
const CHART_COLORS = ['var(--color-primary-500)', 'var(--color-gold-400)', 'var(--color-info-500)', 'var(--color-error-500)', 'var(--color-violet-500)', 'var(--color-warning-500)', 'var(--color-success-500)', 'var(--color-indigo-500)'];

// ─── Stat Card ──────────────────────────────────────────────────────
const StatCard: React.FC<{
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
}> = ({ icon: Icon, label, value, sub, color, trend }) => {
  const { t } = useTranslation();
  return (
    <motion.div whileHover={{ y: -2 }} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      {trend && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
          trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : trend === 'down' ? 'text-red-500 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'
        }`}>
          {trend === 'up' ? <ArrowUpRight size={12} /> : trend === 'down' ? <ArrowDownRight size={12} /> : <Minus size={12} />}
          {trend === 'up' ? t('admin.trend.up', 'En hausse') : trend === 'down' ? t('admin.trend.down', 'En baisse') : t('admin.trend.stable', 'Stable')}
        </div>
      )}
    </motion.div>
  );
};

// ─── Progress Bar ───────────────────────────────────────────────────
const ProgressBar: React.FC<{ label: string; value: number; total: number; color: string }> = ({ label, value, total, color }) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-slate-600 dark:text-slate-300">{label}</span>
        <span className="font-medium text-slate-900 dark:text-white">{value} ({pct}%)</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// ─── Status Badge ───────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const { t, i18n } = useTranslation();
  const map: Record<string, { bg: string; text: string; key: string }> = {
    PENDING: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', key: 'admin.status.pending' },
    APPROVED: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', key: 'admin.status.approved' },
    AVAILABLE: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', key: 'admin.status.available' },
    RESERVED: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-300', key: 'admin.status.reserved' },
    RENTED: { bg: 'bg-slate-100 dark:bg-slate-700/50', text: 'text-slate-700 dark:text-slate-300', key: 'admin.status.rented' },
    REJECTED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', key: 'admin.status.rejected' },
    ACTIVE: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', key: 'admin.status.active' },
    PAUSED: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', key: 'admin.status.paused' },
    PAID: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', key: 'admin.status.paid' },
    FAILED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', key: 'admin.status.failed' },
    REFUNDED: { bg: 'bg-slate-100 dark:bg-slate-700/50', text: 'text-slate-700 dark:text-slate-300', key: 'admin.status.refunded' },
    FLAGGED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', key: 'admin.status.flagged' },
  };
  const s = map[status] || map.PENDING;
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>{t(s.key, status)}</span>;
};

// ─── Role Badge ─────────────────────────────────────────────────────
const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const map: Record<string, { bg: string; text: string }> = {
    ADMIN: { bg: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300', text: '' },
    PROPRIETAIRE: { bg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', text: '' },
    LOCATAIRE: { bg: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300', text: '' },
  };
  const r = map[role] || map.LOCATAIRE;
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.bg}`}>{role}</span>;
};

// ─── Sidebar Item ───────────────────────────────────────────────────
const SidebarItem: React.FC<{
  icon: LucideIcon;
  label: string;
  tab: AdminTab;
  active: boolean;
  onClick: () => void;
  badge?: number;
  isDark?: boolean;
}> = ({ icon: Icon, label, active, onClick, badge, isDark }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
      active
        ? 'bg-teal-600 text-white shadow-md'
        : isDark
          ? 'text-slate-400 hover:text-white hover:bg-white/10'
          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
    }`}
  >
    <Icon size={18} />
    <span className="flex-1 text-start">{label}</span>
    {badge !== undefined && badge > 0 && (
      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${active ? 'bg-white text-teal-600' : 'bg-amber-500 text-white'}`}>
        {badge}
      </span>
    )}
  </button>
);

// ─── Chart Card ─────────────────────────────────────────────────────
const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
    <h3 className="font-bold text-slate-900 dark:text-white mb-4">{title}</h3>
    {children}
  </div>
);

// ─── Pagination Controls ────────────────────────────────────────────
const PaginationControls: React.FC<{
  page: number;
  setPage: (p: number) => void;
  total: number;
  pageSize: number;
  label?: string;
}> = ({ page, setPage, total, pageSize, label }) => {
  const { t } = useTranslation();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, total);
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-700">
      <span className="text-xs text-slate-500 dark:text-slate-400">
        {t('admin.pagination.range', '{{start}}-{{end}} sur {{total}} {{label}}', { start, end, total, label: label || t('admin.pagination.items', 'éléments') })}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPage(Math.max(0, page - 1))}
          disabled={page === 0}
          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition"
        >
          {t('admin.pagination.prev', 'Précédent')}
        </button>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {t('admin.pagination.page', 'Page {{page}} / {{total}}', { page: page + 1, total: totalPages })}
        </span>
        <button
          onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition"
        >
          {t('admin.pagination.next', 'Suivant')}
        </button>
      </div>
    </div>
  );
};

// ─── MAIN ADMIN COMPONENT ───────────────────────────────────────────
export const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { isAdmin, logout } = useAuth();
  const { showToast } = useToast();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const isRTL = document.dir === 'rtl' || i18n.dir() === 'rtl';
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data states
  const [stats, setStats] = useState<EnhancedPlatformStats | null>(null);
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [eventLogs, setEventLogs] = useState<EventLogEntry[]>([]);
  const [eventSummary, setEventSummary] = useState<any>(null);
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [topViewed, setTopViewed] = useState<any[]>([]);

  // New data states
  const [ads, setAds] = useState<AdminAd[]>([]);
  const [pendingAds, setPendingAds] = useState<AdminAd[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [flaggedReviews, setFlaggedReviews] = useState<AdminReview[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [analytics, setAnalytics] = useState<AdminAnalyticsDTO | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyPoint[]>([]);
  const [yearlyData, setYearlyData] = useState<YearlyPoint[]>([]);

  // Chart data
  const [dauData, setDauData] = useState<ChartDataPoint[]>([]);
  const [viewsData, setViewsData] = useState<ChartDataPoint[]>([]);
  const [revenueData, setRevenueData] = useState<ChartDataPoint[]>([]);
  const [fraudStats, setFraudStats] = useState<{ analyses: number; mediumAlerts: number; highAlerts: number }>({ analyses: 0, mediumAlerts: 0, highAlerts: 0 });

  // Filters
  const [propertyFilter, setPropertyFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [propStatusFilter, setPropStatusFilter] = useState('all');
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Pagination state
  const [propPage, setPropPage] = useState(0);
  const [userPage, setUserPage] = useState(0);
  const [adPage, setAdPage] = useState(0);
  const [reviewPage, setReviewPage] = useState(0);
  const [flaggedPage, setFlaggedPage] = useState(0);
  const [propTotal, setPropTotal] = useState(0);
  const [userTotal, setUserTotal] = useState(0);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [flaggedTotal, setFlaggedTotal] = useState(0);
  const PAGE_SIZE = 20;

  // Settings UI state — synced with backend
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [featureFlags, setFeatureFlags] = useState({
    aiChat: true,
    voiceSearch: true,
    ads: true,
    reviews: true,
    payments: true,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Track which tabs have already loaded their data
  const [tabLoaded, setTabLoaded] = useState<Record<AdminTab, boolean>>({
    dashboard: false,
    properties: false,
    ads: false,
    users: false,
    reviews: false,
    transactions: false,
    analytics: false,
    trust: false,
    settings: false,
  });

  useEffect(() => {
    if (!isAdmin) { navigate('/home'); return; }
    loadTab('dashboard');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, navigate]);

  // Load data when the active tab changes
  useEffect(() => {
    if (!isAdmin) return;
    loadTab(activeTab);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Server-side pagination for properties
  useEffect(() => {
    if (!isAdmin || !tabLoaded.properties) return;
    loadProperties();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propPage]);

  // Server-side pagination for users
  useEffect(() => {
    if (!isAdmin || !tabLoaded.users) return;
    loadUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPage]);

  // Server-side pagination for reviews
  useEffect(() => {
    if (!isAdmin || !tabLoaded.reviews) return;
    loadReviews();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewPage, flaggedPage]);

  const markTabLoaded = (tab: AdminTab) => {
    setTabLoaded(prev => ({ ...prev, [tab]: true }));
  };

  const loadTab = async (tab: AdminTab, force = false) => {
    if (!isAdmin) return;
    if (!force && tabLoaded[tab]) return;
    setLoading(true);
    try {
      switch (tab) {
        case 'dashboard':
          await loadDashboardData();
          break;
        case 'properties':
          await loadProperties();
          break;
        case 'ads':
          await loadAds();
          break;
        case 'users':
          await loadUsers();
          break;
        case 'reviews':
          await loadReviews();
          break;
        case 'transactions':
          await loadTransactions();
          break;
        case 'analytics':
          await loadAnalyticsData();
          break;
        case 'trust':
          await loadTrustData();
          break;
        case 'settings':
          await loadSettingsData();
          break;
      }
      markTabLoaded(tab);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Admin tab load error:', err);
      showToast(t('admin.error.load', 'Erreur chargement admin'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    const [
      statsRes, analyticsRes, dailyRes, topRes,
      dauRes, viewsRes, revRes, monthlyRes, yearlyRes,
    ] = await Promise.all([
      adminApi.getEnhancedStats().catch(() => null),
      adminApi.getAdminAnalytics().catch(() => null),
      adminApi.getDailyPropertyStats(30).catch(() => null),
      adminApi.getTopViewedProperties(7, 10).catch(() => null),
      analyticsApi.getDailyActiveUsers(30).catch(() => null),
      analyticsApi.getPropertyViewsTrend(30).catch(() => null),
      analyticsApi.getRevenueTrend(30).catch(() => null),
      adminApi.getMonthlyAnalytics().catch(() => null),
      adminApi.getYearlyAnalytics().catch(() => null),
    ]);

    if (statsRes) setStats(statsRes.data);
    if (analyticsRes) setAnalytics(analyticsRes.data);
    if (dailyRes) setDailyStats(Array.isArray(dailyRes.data) ? dailyRes.data : []);
    if (topRes) setTopViewed(Array.isArray(topRes.data) ? topRes.data : []);
    if (dauRes) setDauData(Array.isArray(dauRes.data) ? dauRes.data : []);
    if (viewsRes) setViewsData(Array.isArray(viewsRes.data) ? viewsRes.data : []);
    if (revRes) setRevenueData(Array.isArray(revRes.data) ? revRes.data : []);
    if (monthlyRes) setMonthlyData(Array.isArray(monthlyRes.data) ? monthlyRes.data : []);
    if (yearlyRes) setYearlyData(Array.isArray(yearlyRes.data) ? yearlyRes.data : []);

    // Lightweight badge counts for the sidebar
    const [pendingAdsRes, pendingReviewsRes] = await Promise.all([
      adminApi.getPendingAds().catch(() => null),
      adminApi.getPendingReviews(0, 5).catch(() => null),
    ]);
    if (pendingAdsRes) setPendingAds(Array.isArray(pendingAdsRes.data) ? pendingAdsRes.data : []);
    if (pendingReviewsRes) {
      const data = pendingReviewsRes.data?.content || pendingReviewsRes.data || [];
      setReviews(Array.isArray(data) ? data : []);
      setReviewTotal(pendingReviewsRes.data?.totalElements ?? data.length ?? 0);
    }
  };

  const loadProperties = async () => {
    const propRes = await adminApi.getAllProperties(undefined, propPage, PAGE_SIZE).catch(() => null);
    if (propRes) {
      const data = propRes.data?.content || propRes.data || [];
      setProperties(Array.isArray(data) ? data : []);
      setPropTotal(propRes.data?.totalElements || data.length || 0);
    }
  };

  const loadUsers = async () => {
    const userRes = await adminApi.getUsers(userPage, PAGE_SIZE).catch(() => null);
    if (userRes) {
      const data = userRes.data?.content || userRes.data || [];
      setUsers(Array.isArray(data) ? data : []);
      setUserTotal(userRes.data?.totalElements || data.length || 0);
    }
  };

  const loadAds = async () => {
    const [adsRes, pendingAdsRes, paymentsRes] = await Promise.all([
      adminApi.getAllAds().catch(() => null),
      adminApi.getPendingAds().catch(() => null),
      adminApi.getAdPayments().catch(() => null),
    ]);
    if (adsRes) setAds(Array.isArray(adsRes.data) ? adsRes.data : []);
    if (pendingAdsRes) setPendingAds(Array.isArray(pendingAdsRes.data) ? pendingAdsRes.data : []);
    if (paymentsRes) {
      const data = paymentsRes.data?.content || paymentsRes.data || [];
      setPayments(Array.isArray(data) ? data : []);
    }
  };

  const loadReviews = async () => {
    const [reviewsRes, flaggedRes] = await Promise.all([
      adminApi.getPendingReviews(reviewPage, PAGE_SIZE).catch(() => null),
      adminApi.getFlaggedReviews(flaggedPage, PAGE_SIZE).catch(() => null),
    ]);
    if (reviewsRes) {
      const data = reviewsRes.data?.content || reviewsRes.data || [];
      setReviews(Array.isArray(data) ? data : []);
      setReviewTotal(reviewsRes.data?.totalElements ?? data.length ?? 0);
    }
    if (flaggedRes) {
      const data = flaggedRes.data?.content || flaggedRes.data || [];
      setFlaggedReviews(Array.isArray(data) ? data : []);
      setFlaggedTotal(flaggedRes.data?.totalElements ?? data.length ?? 0);
    }
  };

  const loadTransactions = async () => {
    const [paymentsRes, analyticsRes] = await Promise.all([
      adminApi.getAdPayments().catch(() => null),
      adminApi.getAdminAnalytics().catch(() => null),
    ]);
    if (paymentsRes) {
      const data = paymentsRes.data?.content || paymentsRes.data || [];
      setPayments(Array.isArray(data) ? data : []);
    }
    if (analyticsRes) setAnalytics(analyticsRes.data);
  };

  const loadAnalyticsData = async () => {
    await ensureValidToken();
    const [
      analyticsRes, dauRes, viewsRes, revRes,
      dailyRes, topRes, monthlyRes, yearlyRes,
    ] = await Promise.all([
      adminApi.getAdminAnalytics().catch(() => null),
      analyticsApi.getDailyActiveUsers(30).catch(() => null),
      analyticsApi.getPropertyViewsTrend(30).catch(() => null),
      analyticsApi.getRevenueTrend(30).catch(() => null),
      adminApi.getDailyPropertyStats(30).catch(() => null),
      adminApi.getTopViewedProperties(7, 10).catch(() => null),
      adminApi.getMonthlyAnalytics().catch(() => null),
      adminApi.getYearlyAnalytics().catch(() => null),
    ]);
    if (analyticsRes) setAnalytics(analyticsRes.data);
    if (dauRes) setDauData(Array.isArray(dauRes.data) ? dauRes.data : []);
    if (viewsRes) setViewsData(Array.isArray(viewsRes.data) ? viewsRes.data : []);
    if (revRes) setRevenueData(Array.isArray(revRes.data) ? revRes.data : []);
    if (dailyRes) setDailyStats(Array.isArray(dailyRes.data) ? dailyRes.data : []);
    if (topRes) setTopViewed(Array.isArray(topRes.data) ? topRes.data : []);
    if (monthlyRes) setMonthlyData(Array.isArray(monthlyRes.data) ? monthlyRes.data : []);
    if (yearlyRes) setYearlyData(Array.isArray(yearlyRes.data) ? yearlyRes.data : []);
  };

  const loadTrustData = async () => {
    const [eventsRes, eventSumRes, fraudRes] = await Promise.all([
      adminApi.getEventLogs().catch(() => null),
      adminApi.getEventSummary().catch(() => null),
      adminApi.getFraudDashboard().catch(() => null),
    ]);
    if (eventsRes) {
      const data = eventsRes.data?.content || eventsRes.data || [];
      setEventLogs(Array.isArray(data) ? data : []);
    }
    if (eventSumRes) setEventSummary(eventSumRes.data);
    if (fraudRes?.data?.data) {
      const fd = fraudRes.data.data;
      setFraudStats({
        analyses: fd.totalAnalyses || fd.totalChecks || 0,
        mediumAlerts: fd.mediumRiskCount || fd.mediumAlerts || 0,
        highAlerts: fd.highRiskCount || fd.highAlerts || 0,
      });
    }
  };

  const loadSettingsData = async () => {
    const settingsRes = await adminApi.getSettings().catch(() => null);
    if (settingsRes?.data) {
      const s = settingsRes.data;
      setMaintenanceMode(s.maintenance_mode === 'true');
      setFeatureFlags({
        aiChat: s.feature_ai_chat !== 'false',
        voiceSearch: s.feature_voice_search !== 'false',
        ads: s.feature_ads !== 'false',
        reviews: s.feature_reviews !== 'false',
        payments: s.feature_payments !== 'false',
      });
    }
  };

  // ─── Property Actions ─────────────────────────────────────────────
  const handleApproveProperty = async (id: number) => {
    setProcessingId(id);
    try {
      await adminApi.approveProperty(id);
      setProperties(prev => prev.map(p => p.id === id ? { ...p, status: 'APPROVED' } : p));
      showToast(t('admin.property.approved', 'Propriété approuvée'), 'success');
    } catch {
      showToast(t('admin.error.generic', 'Erreur'), 'error');
    } finally { setProcessingId(null); }
  };

  const handleRejectProperty = async (id: number) => {
    const reason = prompt(t('admin.property.rejectReason', 'Motif du rejet ?'));
    if (!reason) return;
    setProcessingId(id);
    try {
      await adminApi.rejectProperty(id, reason);
      setProperties(prev => prev.map(p => p.id === id ? { ...p, status: 'REJECTED' } : p));
      showToast(t('admin.property.rejected', 'Propriété rejetée'), 'success');
    } catch {
      showToast(t('admin.error.generic', 'Erreur'), 'error');
    } finally { setProcessingId(null); }
  };

  const handleDeleteProperty = async (id: number) => {
    if (!confirm(t('admin.confirm.delete', 'Supprimer définitivement ?'))) return;
    try {
      await adminApi.deleteProperty(id);
      setProperties(prev => prev.filter(p => p.id !== id));
      showToast(t('admin.deleted', 'Supprimé'), 'success');
    } catch {
      showToast(t('admin.error.generic', 'Erreur'), 'error');
    }
  };

  const handleClassifyProperty = async (id: number, classification: 'verified' | 'premium' | 'normal') => {
    try {
      await adminApi.classifyProperty(id, classification);
      setProperties(prev => prev.map(p => p.id === id ? { ...p, isVerified: classification !== 'normal' } : p));
      showToast(t('admin.property.classified', 'Classifié').replace('{{type}}', classification), 'success');
    } catch {
      showToast(t('admin.error.generic', 'Erreur'), 'error');
    }
  };

  // ─── User Actions ─────────────────────────────────────────────────
  const handleVerifyUser = async (id: number) => {
    try {
      await adminApi.verifyUser(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isVerified: true } : u));
      showToast(t('admin.user.verified', 'Utilisateur vérifié'), 'success');
    } catch {
      showToast(t('admin.error.generic', 'Erreur'), 'error');
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm(t('admin.confirm.deleteUser', 'Supprimer cet utilisateur ?'))) return;
    try {
      await adminApi.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      showToast(t('admin.user.deleted', 'Utilisateur supprimé'), 'success');
    } catch {
      showToast(t('admin.error.generic', 'Erreur'), 'error');
    }
  };

  // ─── Ad Actions ───────────────────────────────────────────────────
  const handleApproveAd = async (id: number) => {
    try {
      await adminApi.approveAd(id);
      setPendingAds(prev => prev.filter(a => a.id !== id));
      setAds(prev => prev.map(a => a.id === id ? { ...a, status: 'APPROVED' } : a));
      showToast(t('admin.ad.approved', 'Annonce approuvée'), 'success');
    } catch {
      showToast(t('admin.error.generic', 'Erreur'), 'error');
    }
  };

  const handleRejectAd = async (id: number) => {
    const reason = prompt(t('admin.ad.rejectReason', 'Motif du rejet ?'));
    if (!reason) return;
    try {
      await adminApi.rejectAd(id, reason);
      setPendingAds(prev => prev.filter(a => a.id !== id));
      setAds(prev => prev.map(a => a.id === id ? { ...a, status: 'REJECTED' } : a));
      showToast(t('admin.ad.rejected', 'Annonce rejetée'), 'success');
    } catch {
      showToast(t('admin.error.generic', 'Erreur'), 'error');
    }
  };

  const handleDeleteAd = async (id: number) => {
    if (!confirm(t('admin.confirm.delete', 'Supprimer ?'))) return;
    try {
      await adminApi.deleteAd(id);
      setAds(prev => prev.filter(a => a.id !== id));
      showToast(t('admin.deleted', 'Supprimé'), 'success');
    } catch {
      showToast(t('admin.error.generic', 'Erreur'), 'error');
    }
  };

  // ─── Review Actions ───────────────────────────────────────────────
  const handleModerateReview = async (reviewId: number, action: string) => {
    try {
      await adminApi.moderateReview(reviewId, action);
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      setFlaggedReviews(prev => prev.filter(r => r.id !== reviewId));
      showToast(t('admin.review.moderated', 'Avis modéré'), 'success');
    } catch {
      showToast(t('admin.error.generic', 'Erreur'), 'error');
    }
  };

  // ─── Payment Actions ──────────────────────────────────────────────
  const handleRefundPayment = async (id: number) => {
    const reason = prompt(t('admin.payment.refundReason', 'Motif du remboursement ?'));
    if (!reason) return;
    try {
      await adminApi.refundPayment(id, reason);
      setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'REFUNDED' } : p));
      showToast(t('admin.payment.refunded', 'Remboursé'), 'success');
    } catch {
      showToast(t('admin.error.generic', 'Erreur'), 'error');
    }
  };

  // ─── Filters ──────────────────────────────────────────────────────
  const filteredProperties = useMemo(() => {
    return properties.filter(p => {
      if (propStatusFilter !== 'all' && p.status !== propStatusFilter) return false;
      if (propertyFilter) {
        const q = propertyFilter.toLowerCase();
        return p.title?.toLowerCase().includes(q) || p.city?.toLowerCase().includes(q) || p.ownerName?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [properties, propertyFilter, propStatusFilter]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (userFilter) {
        const q = userFilter.toLowerCase();
        return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.city?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [users, userFilter]);

  // ─── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'dark bg-slate-900' : 'bg-slate-50'}`}>
        <Loader2 size={32} className="animate-spin text-teal-600" />
      </div>
    );
  }

  // ─── Sidebar tabs config ──────────────────────────────────────────
  const tabs: { id: AdminTab; label: string; icon: LucideIcon; badge?: number }[] = [
    { id: 'dashboard', label: t('admin.tab.dashboard', 'Dashboard'), icon: LayoutDashboard },
    { id: 'properties', label: t('admin.tab.properties', 'Propriétés'), icon: Building2, badge: stats?.pendingProperties },
    { id: 'ads', label: t('admin.tab.ads', 'Annonces'), icon: Megaphone, badge: pendingAds.length },
    { id: 'users', label: t('admin.tab.users', 'Utilisateurs'), icon: Users },
    { id: 'reviews', label: t('admin.tab.reviews', 'Avis'), icon: Star, badge: (reviewTotal || 0) + (flaggedTotal || 0) },
    { id: 'transactions', label: t('admin.tab.transactions', 'Transactions'), icon: DollarSign },
    { id: 'analytics', label: t('admin.tab.analytics', 'Analytics'), icon: BarChart3 },
    { id: 'trust', label: t('admin.tab.trust', 'Trust & Sécurité'), icon: ShieldCheck },
    { id: 'settings', label: t('admin.tab.settings', 'Paramètres'), icon: Settings },
  ];

  return (
    <div className={`min-h-screen flex ${isDark ? 'dark bg-slate-900' : 'bg-slate-50'}`}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-64 flex flex-col fixed top-0 bottom-0 z-40 transition-transform duration-300 ${
          isRTL ? 'right-0' : 'left-0'
        } lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full'
        } ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900 border-r border-slate-200'}`}
      >
        <div className="p-6 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Crown size={24} className="text-amber-400" />
              <h1 className="text-lg font-black">{t('admin.title', 'Platform Owner')}</h1>
            </div>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('admin.subtitle', "Panneau d'administration")}</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className={`lg:hidden p-2 rounded-lg ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          <nav className="px-3 space-y-1 pb-2">
          {tabs.map(t => (
            <SidebarItem
              key={t.id}
              icon={t.icon}
              label={t.label}
              tab={t.id}
              active={activeTab === t.id}
              onClick={() => { setActiveTab(t.id); setSidebarOpen(false); }}
              badge={t.badge}
              isDark={isDark}
            />
          ))}
          </nav>
        </div>

        <div className={`p-3 border-t shrink-0 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition ${
              isDark
                ? 'text-slate-400 hover:text-white hover:bg-white/10'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <LogOut size={18} />
            {t('auth.logout', 'Déconnexion')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-h-screen ${isRTL ? 'lg:mr-64' : 'lg:ml-64'}`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300"
              >
                <Menu size={20} />
              </button>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                {activeTab === 'dashboard' && t('admin.tab.dashboard', 'Dashboard')}
                {activeTab === 'properties' && t('admin.header.properties', 'Gestion des propriétés')}
                {activeTab === 'ads' && t('admin.header.ads', 'Gestion des annonces')}
                {activeTab === 'users' && t('admin.header.users', 'Gestion des utilisateurs')}
                {activeTab === 'reviews' && t('admin.header.reviews', 'Modération des avis')}
                {activeTab === 'transactions' && t('admin.header.transactions', 'Transactions')}
                {activeTab === 'analytics' && t('admin.header.analytics', 'Analytics avancées')}
                {activeTab === 'trust' && t('admin.header.trust', 'Trust & Sécurité')}
                {activeTab === 'settings' && t('admin.header.settings', 'Paramètres système')}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {new Date().toLocaleDateString(i18n.language === 'ar' ? 'ar-MA' : i18n.language === 'en' ? 'en-US' : 'fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <button
              onClick={() => loadTab(activeTab, true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              <RefreshCw size={14} /> {t('admin.refresh', 'Actualiser')}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {/* ═══════════════════════════════════════════════════════════
                DASHBOARD
            ═══════════════════════════════════════════════════════════ */}
            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                {stats && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      <StatCard icon={Users} label={t('admin.tab.users', 'Utilisateurs')} value={stats?.totalUsers?.toLocaleString?.() || '0'} color="bg-blue-500" trend="up" />
                      <StatCard icon={Building2} label={t('admin.tab.properties', 'Propriétés')} value={stats?.totalProperties?.toLocaleString?.() || '0'} color="bg-teal-600" />
                      <StatCard icon={Clock} label={t('admin.status.pending', 'En attente')} value={stats?.pendingProperties?.toLocaleString?.() || '0'} color="bg-amber-500" />
                      <StatCard icon={MessageCircle} label={t('admin.stats.messages', 'Messages')} value={stats?.totalMessages?.toLocaleString?.() || '0'} color="bg-violet-500" />
                      <StatCard icon={Heart} label={t('admin.stats.favorites', 'Favoris')} value={stats?.totalFavorites?.toLocaleString?.() || '0'} color="bg-rose-500" />
                      <StatCard icon={Activity} label={t('admin.stats.visits', 'Visites')} value={stats?.totalVisits?.toLocaleString?.() || '0'} color="bg-emerald-500" />
                    </div>

                    <div className="grid lg:grid-cols-2 gap-6">
                      <ChartCard title={t('admin.chart.distribution', 'Distribution des propriétés')}>
                        <div className="space-y-3">
                          <ProgressBar label={t('admin.status.approved', 'Approuvées')} value={stats?.approvedProperties || 0} total={stats?.totalProperties || 1} color="bg-emerald-500" />
                          <ProgressBar label={t('admin.status.available', 'Disponibles')} value={stats?.availableProperties || 0} total={stats?.totalProperties || 1} color="bg-blue-500" />
                          <ProgressBar label={t('admin.status.pending', 'En attente')} value={stats?.pendingProperties || 0} total={stats?.totalProperties || 1} color="bg-amber-500" />
                          <ProgressBar label={t('admin.chart.others', 'Autres')} value={(stats?.totalProperties || 0) - (stats?.approvedProperties || 0) - (stats?.availableProperties || 0) - (stats?.pendingProperties || 0)} total={stats?.totalProperties || 1} color="bg-slate-300 dark:bg-slate-600" />
                        </div>
                      </ChartCard>

                      <ChartCard title={t('admin.chart.topCities', 'Top villes')}>
                        <div className="space-y-2">
                          {stats.topCities?.slice(0, 8).map((city: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                              <div className="flex items-center gap-3">
                                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>{i + 1}</span>
                                <span className="text-sm text-slate-700 dark:text-slate-300">{city.name}</span>
                              </div>
                              <span className="text-sm font-medium text-slate-900 dark:text-white">{city.count}</span>
                            </div>
                          ))}
                        </div>
                      </ChartCard>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-6">
                      <ChartCard title={t('admin.chart.usersByRole', 'Utilisateurs par rôle')}>
                        <div className="flex gap-4">
                          {Object.entries(stats.usersByRole || {}).map(([role, count]) => (
                            <div key={role} className="flex-1 text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                              <p className="text-2xl font-black text-slate-900 dark:text-white">{count as number}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{role}</p>
                            </div>
                          ))}
                        </div>
                      </ChartCard>
                      <ChartCard title={t('admin.chart.conversion', 'Taux de conversion')}>
                        <div className="flex items-center gap-4">
                          <div className="relative w-24 h-24">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                              <path className="text-slate-100 dark:text-slate-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                              <path className="text-teal-500" strokeDasharray={`${Math.min(stats.conversionRate * 100, 100)}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-lg font-black text-slate-900 dark:text-white">{((stats?.conversionRate || 0) * 100).toFixed(1)}%</span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-slate-600 dark:text-slate-300">{t('admin.chart.conversionLabel', 'Visites → Contacts')}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t('admin.chart.conversionSub', '{{visits}} visites pour {{properties}} propriétés', { visits: stats?.totalVisits || 0, properties: stats?.totalProperties || 0 })}</p>
                          </div>
                        </div>
                      </ChartCard>
                    </div>

                    {/* Quick charts */}
                    {dauData.length > 0 && (
                      <ChartCard title={t('admin.chart.dau', 'Utilisateurs actifs (30 jours)')}>
                        <ResponsiveContainer width="100%" height={250}>
                          <AreaChart data={dauData}>
                            <defs>
                              <linearGradient id="colorDau" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-primary-500)" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="var(--color-primary-500)" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'var(--color-gray-700)' : 'var(--color-gray-200)'} />
                            <XAxis dataKey="date" tick={{ fontSize: 12, fill: isDark ? 'var(--color-gray-400)' : 'var(--color-gray-500)' }} />
                            <YAxis tick={{ fontSize: 12, fill: isDark ? 'var(--color-gray-400)' : 'var(--color-gray-500)' }} />
                            <Tooltip contentStyle={{ borderRadius: 12, backgroundColor: isDark ? 'var(--color-gray-800)' : 'var(--color-bg)', border: `1px solid ${isDark ? 'var(--color-gray-700)' : 'var(--color-gray-200)'}`, color: isDark ? 'var(--color-gray-50)' : 'var(--color-gray-900)' }} />
                            <Area type="monotone" dataKey="value" stroke="var(--color-primary-500)" fillOpacity={1} fill="url(#colorDau)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </ChartCard>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                PROPERTIES
            ═══════════════════════════════════════════════════════════ */}
            {activeTab === 'properties' && (
              <motion.div key="properties" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder={t('admin.search.property', 'Rechercher propriété, ville, propriétaire...')}
                      value={propertyFilter}
                      onChange={e => setPropertyFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-teal-500 dark:text-white"
                    />
                  </div>
                  <select
                    value={propStatusFilter}
                    onChange={e => setPropStatusFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm dark:text-white"
                  >
                    <option value="all">{t('admin.filter.all', 'Tous les statuts')}</option>
                    <option value="PENDING">{t('admin.status.pending', 'En attente')}</option>
                    <option value="APPROVED">{t('admin.status.approved', 'Approuvées')}</option>
                    <option value="AVAILABLE">{t('admin.status.available', 'Disponibles')}</option>
                    <option value="REJECTED">{t('admin.status.rejected', 'Rejetées')}</option>
                  </select>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">ID</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('admin.table.property', 'Propriété')}</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('admin.table.city', 'Ville')}</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('admin.table.price', 'Prix')}</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('admin.table.status', 'Statut')}</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('admin.table.views', 'Vues')}</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('admin.table.owner', 'Propriétaire')}</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('admin.table.actions', 'Actions')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredProperties.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{p.id}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {p.images?.[0] && (
                                  <img src={fixMediaUrl(p.images[0])} alt="" className="w-8 h-8 rounded-lg object-cover" />
                                )}
                                <span className="font-medium text-slate-900 dark:text-white truncate max-w-[150px]">{p.title}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{p.city}</td>
                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{p.price?.toLocaleString?.() || '0'} DH</td>
                            <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{p.viewCount || 0}</td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{p.ownerName}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                {p.status === 'PENDING' && (
                                  <>
                                    <button onClick={() => handleApproveProperty(p.id)} disabled={processingId === p.id} className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition" title={t('admin.action.approve', 'Approuver')}>
                                      {processingId === p.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                    </button>
                                    <button onClick={() => handleRejectProperty(p.id)} disabled={processingId === p.id} className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 transition" title={t('admin.action.reject', 'Rejeter')}>
                                      <XCircle size={14} />
                                    </button>
                                  </>
                                )}
                                <button onClick={() => handleClassifyProperty(p.id, p.isVerified ? 'normal' : 'verified')} className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 transition" title={p.isVerified ? t('admin.badge.normal', 'Normal') : t('admin.action.verify', 'Vérifier')}>
                                  {p.isVerified ? <Star size={14} className="fill-amber-500" /> : <Star size={14} />}
                                </button>
                                <button onClick={() => navigate(`/property/${p.id}`)} className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition" title={t('admin.action.view', 'Voir')}>
                                  <Eye size={14} />
                                </button>
                                <button onClick={() => handleDeleteProperty(p.id)} className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 transition" title={t('admin.action.delete', 'Supprimer')}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredProperties.length === 0 && (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">{t('admin.empty.properties', 'Aucune propriété trouvée')}</div>
                  )}
                  <PaginationControls page={propPage} setPage={setPropPage} total={propTotal} pageSize={PAGE_SIZE} label={t('admin.label.properties', 'propriétés')} />
                </div>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                ADS
            ═══════════════════════════════════════════════════════════ */}
            {activeTab === 'ads' && (
              <motion.div key="ads" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                {/* Pending Ads */}
                {pendingAds.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-500" />
                        {t('admin.ads.pending', 'Annonces en attente')} ({pendingAds?.length || 0})
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">ID</th>
                            <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('admin.table.title', 'Titre')}</th>
                            <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('admin.table.type', 'Type')}</th>
                            <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('admin.table.plan', 'Plan')}</th>
                            <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('admin.table.budget', 'Budget')}</th>
                            <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('admin.table.actions', 'Actions')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {pendingAds.map(a => (
                            <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                              <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{a.id}</td>
                              <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{a.title}</td>
                              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{a.type}</td>
                              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{a.plan}</td>
                              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{a.budget?.toLocaleString?.() || '0'} DH</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  <button onClick={() => handleApproveAd(a.id)} className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition" title={t('admin.action.approve', 'Approuver')}>
                                    <CheckCircle2 size={14} />
                                  </button>
                                  <button onClick={() => handleRejectAd(a.id)} className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 transition" title={t('admin.action.reject', 'Rejeter')}>
                                    <XCircle size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* All Ads */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="font-bold text-slate-900 dark:text-white">{t('admin.ads.all', 'Toutes les annonces')} ({ads?.length || 0})</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">ID</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('admin.table.title', 'Titre')}</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('admin.table.status', 'Statut')}</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('admin.table.views', 'Vues')}</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('admin.table.clicks', 'Clics')}</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('admin.table.actions', 'Actions')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {ads?.slice(adPage * PAGE_SIZE, (adPage + 1) * PAGE_SIZE).map(a => (
                          <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{a.id}</td>
                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{a.title}</td>
                            <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{a.views || 0}</td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{a.clicks || 0}</td>
                            <td className="px-4 py-3">
                              <button onClick={() => handleDeleteAd(a.id)} className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 transition" title={t('admin.action.delete', 'Supprimer')}>
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {ads?.length === 0 && (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">{t('admin.empty.ads', 'Aucune annonce')}</div>
                  )}
                  <PaginationControls page={adPage} setPage={setAdPage} total={ads?.length || 0} pageSize={PAGE_SIZE} label={t('admin.label.ads', 'annonces')} />
                </div>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                USERS
            ═══════════════════════════════════════════════════════════ */}
            {activeTab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="relative max-w-md">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder={t('admin.search.user', 'Rechercher utilisateur...')}
                    value={userFilter}
                    onChange={e => setUserFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-teal-500 dark:text-white"
                  />
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">ID</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('admin.table.name', 'Nom')}</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('admin.table.email')}</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('admin.table.role', 'Rôle')}</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('admin.table.city', 'Ville')}</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('admin.table.verified', 'Vérifié')}</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('admin.table.actions', 'Actions')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredUsers.map(u => (
                          <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{u.id}</td>
                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{u.name}</td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{u.email}</td>
                            <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{u.city || '-'}</td>
                            <td className="px-4 py-3">
                              {u.isVerified ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                                  <CheckCircle2 size={12} /> {t('common.yes', 'Oui')}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 text-xs">
                                  <Clock size={12} /> {t('common.no', 'Non')}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                {!u.isVerified && (
                                  <button onClick={() => handleVerifyUser(u.id)} className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition" title={t('admin.action.verify', 'Vérifier')}>
                                    <ShieldCheck size={14} />
                                  </button>
                                )}
                                <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 transition" title={t('admin.action.delete', 'Supprimer')}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">{t('admin.empty.users', 'Aucun utilisateur trouvé')}</div>
                  )}
                  <PaginationControls page={userPage} setPage={setUserPage} total={userTotal} pageSize={PAGE_SIZE} label={t('admin.label.users', 'utilisateurs')} />
                </div>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                REVIEWS
            ═══════════════════════════════════════════════════════════ */}
            {activeTab === 'reviews' && (
              <motion.div key="reviews" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                {/* Pending Reviews */}
                {reviews?.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                      <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Clock size={16} className="text-amber-500" />
                        {t('admin.reviews.pending', 'Avis en attente')} ({reviewTotal || 0})
                      </h3>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                      {reviews?.map(r => (
                        <div key={r.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-yellow-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                                <span className="text-sm font-medium text-slate-900 dark:text-white">{r.userName}</span>
                                <span className="text-xs text-slate-400">{r.propertyTitle}</span>
                              </div>
                              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{r.comment}</p>
                              {r.sentimentLabel && (
                                <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                                  {r.sentimentLabel} ({(r.sentimentScore || 0).toFixed(2)})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 ml-4">
                              <button onClick={() => handleModerateReview(r.id, 'APPROVE')} className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition" title={t('admin.action.approve', 'Approuver')}>
                                <CheckCircle2 size={14} />
                              </button>
                              <button onClick={() => handleModerateReview(r.id, 'REJECT')} className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 transition" title={t('admin.action.reject', 'Rejeter')}>
                                <XCircle size={14} />
                              </button>
                              <button onClick={() => handleModerateReview(r.id, 'FLAG')} className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 transition" title={t('admin.action.flag', 'Signaler')}>
                                <Flag size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <PaginationControls page={reviewPage} setPage={setReviewPage} total={reviewTotal} pageSize={PAGE_SIZE} label={t('admin.label.reviews', 'avis')} />
                  </div>
                )}

                {/* Flagged Reviews */}
                {flaggedReviews.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                      <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Flag size={16} className="text-red-500" />
                        {t('admin.reviews.flagged', 'Avis signalés')} ({flaggedTotal || 0})
                      </h3>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                      {flaggedReviews.map(r => (
                        <div key={r.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-yellow-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                                <span className="text-sm font-medium text-slate-900 dark:text-white">{r.userName}</span>
                                <span className="text-xs text-red-500 font-bold">{t('admin.reviews.signals', '{{count}} signalements', { count: r.reportCount })}</span>
                              </div>
                              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{r.comment}</p>
                            </div>
                            <div className="flex items-center gap-1 ml-4">
                              <button onClick={() => handleModerateReview(r.id, 'APPROVE')} className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition" title={t('admin.action.approve', 'Approuver')}>
                                <CheckCircle2 size={14} />
                              </button>
                              <button onClick={() => handleModerateReview(r.id, 'REJECT')} className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 transition" title={t('admin.action.reject', 'Rejeter')}>
                                <XCircle size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <PaginationControls page={flaggedPage} setPage={setFlaggedPage} total={flaggedTotal} pageSize={PAGE_SIZE} label={t('admin.label.reviews', 'avis')} />
                  </div>
                )}

                {reviews?.length === 0 && flaggedReviews?.length === 0 && (
                  <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <Star size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{t('admin.empty.reviews', 'Aucun avis à modérer')}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                TRANSACTIONS
            ═══════════════════════════════════════════════════════════ */}
            {activeTab === 'transactions' && (
              <motion.div key="transactions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard icon={DollarSign} label={t('admin.stats.totalRevenue', 'Revenu total')} value={analytics?.totalRevenue?.toLocaleString() || '0'} color="bg-emerald-500" sub="MAD" />
                  <StatCard icon={TrendingUp} label={t('admin.stats.revenueThisMonth', 'Ce mois')} value={analytics?.revenueThisMonth?.toLocaleString() || '0'} color="bg-teal-600" sub="MAD" />
                  <StatCard icon={CheckCircle2} label={t('admin.stats.paid', 'Payés')} value={(payments || []).filter(p => p.status === 'PAID').length.toString()} color="bg-blue-500" />
                  <StatCard icon={AlertTriangle} label={t('admin.stats.failed', 'Échoués')} value={(payments || []).filter(p => p.status === 'FAILED').length.toString()} color="bg-red-500" />
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="font-bold text-slate-900 dark:text-white">{t('admin.payments.title', 'Paiements')} ({payments?.length || 0})</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">ID</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('admin.table.amount', 'Montant')}</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('admin.table.status', 'Statut')}</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('admin.table.user', 'Utilisateur')}</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('admin.table.date', 'Date')}</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('admin.table.actions', 'Actions')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {payments?.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{p.id}</td>
                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{p.amount?.toLocaleString?.() || '0'} {p.currency || 'MAD'}</td>
                            <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{p.userId}</td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{new Date(p.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-MA' : i18n.language === 'en' ? 'en-US' : 'fr-FR')}</td>
                            <td className="px-4 py-3">
                              {p.status === 'PAID' && (
                                <button onClick={() => handleRefundPayment(p.id)} className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 transition" title={t('admin.action.refund', 'Rembourser')}>
                                  <DollarSign size={14} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {payments?.length === 0 && (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">{t('admin.empty.payments', 'Aucun paiement')}</div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                ANALYTICS
            ═══════════════════════════════════════════════════════════ */}
            {activeTab === 'analytics' && (
              <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                {/* Analytics Stats */}
                {analytics && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard icon={Users} label={t('admin.stats.newUsers', 'Nouveaux utilisateurs')} value={analytics?.newUsersThisMonth?.toLocaleString?.() || '0'} color="bg-blue-500" trend="up" />
                    <StatCard icon={Building2} label={t('admin.stats.newProperties', 'Nouvelles propriétés')} value={analytics?.newPropertiesThisMonth?.toLocaleString?.() || '0'} color="bg-teal-600" />
                    <StatCard icon={Megaphone} label={t('admin.stats.activeAds', 'Annonces actives')} value={analytics?.activeAds?.toLocaleString?.() || '0'} color="bg-violet-500" />
                    <StatCard icon={Star} label={t('admin.stats.avgRating', 'Note moyenne')} value={(analytics?.averagePropertyRating || 0).toFixed(1)} color="bg-amber-500" />
                  </div>
                )}

                {/* Charts */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {dauData.length > 0 && (
                    <ChartCard title={t('admin.chart.dau', 'Utilisateurs actifs journaliers')}>
                      <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={dauData}>
                          <defs>
                            <linearGradient id="gradDau" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--color-primary-500)" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="var(--color-primary-500)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'var(--color-gray-700)' : 'var(--color-gray-200)'} />
                          <XAxis dataKey="date" tick={{ fontSize: 12, fill: isDark ? 'var(--color-gray-400)' : 'var(--color-gray-500)' }} />
                          <YAxis tick={{ fontSize: 12, fill: isDark ? 'var(--color-gray-400)' : 'var(--color-gray-500)' }} />
                          <Tooltip contentStyle={{ borderRadius: 12, backgroundColor: isDark ? 'var(--color-gray-800)' : 'var(--color-bg)', border: `1px solid ${isDark ? 'var(--color-gray-700)' : 'var(--color-gray-200)'}`, color: isDark ? 'var(--color-gray-50)' : 'var(--color-gray-900)' }} />
                          <Area type="monotone" dataKey="value" stroke="var(--color-primary-500)" fill="url(#gradDau)" name="DAU" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  )}

                  {viewsData.length > 0 && (
                    <ChartCard title={t('admin.chart.propertyViews', 'Vues de propriétés')}>
                      <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={viewsData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'var(--color-gray-700)' : 'var(--color-gray-200)'} />
                          <XAxis dataKey="date" tick={{ fontSize: 12, fill: isDark ? 'var(--color-gray-400)' : 'var(--color-gray-500)' }} />
                          <YAxis tick={{ fontSize: 12, fill: isDark ? 'var(--color-gray-400)' : 'var(--color-gray-500)' }} />
                          <Tooltip contentStyle={{ borderRadius: 12, backgroundColor: isDark ? 'var(--color-gray-800)' : 'var(--color-bg)', border: `1px solid ${isDark ? 'var(--color-gray-700)' : 'var(--color-gray-200)'}`, color: isDark ? 'var(--color-gray-50)' : 'var(--color-gray-900)' }} />
                          <Line type="monotone" dataKey="value" stroke="var(--color-gold-400)" strokeWidth={2} dot={false} name="Vues" />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  )}

                  {revenueData.length > 0 && (
                    <ChartCard title={t('admin.chart.revenue', 'Revenus')}>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={revenueData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'var(--color-gray-700)' : 'var(--color-gray-200)'} />
                          <XAxis dataKey="date" tick={{ fontSize: 12, fill: isDark ? 'var(--color-gray-400)' : 'var(--color-gray-500)' }} />
                          <YAxis tick={{ fontSize: 12, fill: isDark ? 'var(--color-gray-400)' : 'var(--color-gray-500)' }} />
                          <Tooltip contentStyle={{ borderRadius: 12, backgroundColor: isDark ? 'var(--color-gray-800)' : 'var(--color-bg)', border: `1px solid ${isDark ? 'var(--color-gray-700)' : 'var(--color-gray-200)'}`, color: isDark ? 'var(--color-gray-50)' : 'var(--color-gray-900)' }} />
                          <Bar dataKey="value" fill="var(--color-primary-500)" name="Revenu (MAD)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  )}

                  {/* Daily Properties Bar Chart */}
                  {dailyStats.length > 0 && (
                    <ChartCard title={t('admin.chart.daily', 'Publications par jour (30 jours)')}>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={dailyStats}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'var(--color-gray-700)' : 'var(--color-gray-200)'} />
                          <XAxis dataKey="date" tick={{ fontSize: 11, fill: isDark ? 'var(--color-gray-400)' : 'var(--color-gray-500)' }} angle={-45} textAnchor="end" height={60} />
                          <YAxis tick={{ fontSize: 12, fill: isDark ? 'var(--color-gray-400)' : 'var(--color-gray-500)' }} />
                          <Tooltip contentStyle={{ borderRadius: 12, backgroundColor: isDark ? 'var(--color-gray-800)' : 'var(--color-bg)', border: `1px solid ${isDark ? 'var(--color-gray-700)' : 'var(--color-gray-200)'}`, color: isDark ? 'var(--color-gray-50)' : 'var(--color-gray-900)' }} />
                          <Bar dataKey="count" fill="var(--color-info-500)" name="Publications" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  )}
                </div>

                {/* Monthly Trends */}
                {monthlyData.length > 0 && (
                  <ChartCard title={t('admin.chart.monthly', 'Tendances mensuelles')}>
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'var(--color-gray-700)' : 'var(--color-gray-200)'} />
                        <XAxis dataKey="monthLabel" tick={{ fontSize: 12, fill: isDark ? 'var(--color-gray-400)' : 'var(--color-gray-500)' }} />
                        <YAxis yAxisId="left" tick={{ fontSize: 12, fill: isDark ? 'var(--color-gray-400)' : 'var(--color-gray-500)' }} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: isDark ? 'var(--color-gray-400)' : 'var(--color-gray-500)' }} />
                        <Tooltip contentStyle={{ borderRadius: 12, backgroundColor: isDark ? 'var(--color-gray-800)' : 'var(--color-bg)', border: `1px solid ${isDark ? 'var(--color-gray-700)' : 'var(--color-gray-200)'}`, color: isDark ? 'var(--color-gray-50)' : 'var(--color-gray-900)' }} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="users" fill="var(--color-info-500)" name={t('admin.stats.newUsers', 'Utilisateurs')} radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="left" dataKey="properties" fill="var(--color-primary-500)" name={t('admin.stats.newProperties', 'Propriétés')} radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="left" dataKey="reviews" fill="var(--color-warning-500)" name={t('admin.stats.reviews', 'Avis')} radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="right" dataKey="revenue" fill="var(--color-success-500)" name={t('admin.stats.revenue', 'Revenu')} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                )}

                {/* Yearly Trends */}
                {yearlyData.length > 0 && (
                  <ChartCard title={t('admin.chart.yearly', 'Tendances annuelles')}>
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={yearlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'var(--color-gray-700)' : 'var(--color-gray-200)'} />
                        <XAxis dataKey="year" tick={{ fontSize: 12, fill: isDark ? 'var(--color-gray-400)' : 'var(--color-gray-500)' }} />
                        <YAxis yAxisId="left" tick={{ fontSize: 12, fill: isDark ? 'var(--color-gray-400)' : 'var(--color-gray-500)' }} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: isDark ? 'var(--color-gray-400)' : 'var(--color-gray-500)' }} />
                        <Tooltip contentStyle={{ borderRadius: 12, backgroundColor: isDark ? 'var(--color-gray-800)' : 'var(--color-bg)', border: `1px solid ${isDark ? 'var(--color-gray-700)' : 'var(--color-gray-200)'}`, color: isDark ? 'var(--color-gray-50)' : 'var(--color-gray-900)' }} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="users" fill="var(--color-info-500)" name={t('admin.stats.newUsers', 'Utilisateurs')} radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="left" dataKey="properties" fill="var(--color-primary-500)" name={t('admin.stats.newProperties', 'Propriétés')} radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="left" dataKey="reviews" fill="var(--color-warning-500)" name={t('admin.stats.reviews', 'Avis')} radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="right" dataKey="revenue" fill="var(--color-success-500)" name={t('admin.stats.revenue', 'Revenu')} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                )}

                {/* Top Viewed */}
                <ChartCard title={t('admin.chart.topViewed', 'Propriétés les plus vues (7 jours)')}>
                  <div className="space-y-2">
                    {topViewed.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                        <div className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>{i + 1}</span>
                          <span className="text-sm text-slate-700 dark:text-slate-300">{t('admin.topViewed.property', 'Propriété #{{id}}', { id: item.propertyId })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye size={14} className="text-slate-400" />
                          <span className="text-sm font-medium text-slate-900 dark:text-white">{t('admin.topViewed.views', '{{count}} vues', { count: item.views })}</span>
                        </div>
                      </div>
                    ))}
                    {topViewed.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">{t('admin.empty.data', 'Aucune donnée')}</p>}
                  </div>
                </ChartCard>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                TRUST & SECURITY
            ═══════════════════════════════════════════════════════════ */}
            {activeTab === 'trust' && (
              <motion.div key="trust" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                {/* Event Summary */}
                {eventSummary && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 text-center">
                      <p className="text-2xl font-black text-slate-900 dark:text-white">{eventSummary.uniqueUsers?.toLocaleString() || 0}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{t('admin.stats.uniqueUsers', 'Utilisateurs uniques (7j)')}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 text-center">
                      <p className="text-2xl font-black text-slate-900 dark:text-white">{eventSummary.totalEvents?.toLocaleString() || 0}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{t('admin.stats.totalEvents', 'Événements (7j)')}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 text-center">
                      <p className="text-2xl font-black text-slate-900 dark:text-white">{eventSummary.sessions?.toLocaleString() || 0}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{t('admin.stats.sessions', 'Sessions (7j)')}</p>
                    </div>
                  </div>
                )}

                {/* Event Logs */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileText size={16} className="text-slate-400" />
                      {t('admin.activityLog', "Journal d'activité")}
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{eventLogs?.length || 0} {t('admin.entries', 'entrées')}</span>
                  </div>
                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-700/50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-slate-500 dark:text-slate-400">{t('admin.table.time', 'Heure')}</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-500 dark:text-slate-400">{t('admin.table.type', 'Type')}</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-500 dark:text-slate-400">{t('admin.table.user')}</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-500 dark:text-slate-400">IP</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-500 dark:text-slate-400">{t('admin.table.device', 'Appareil')}</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-500 dark:text-slate-400">{t('admin.table.city', 'Ville')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {eventLogs.slice(0, 100).map((log, i) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                            <td className="px-4 py-2 text-slate-500 dark:text-slate-400 whitespace-nowrap">{new Date(log.serverTimestamp).toLocaleString(i18n.language === 'ar' ? 'ar-MA' : i18n.language === 'en' ? 'en-US' : 'fr-FR')}</td>
                            <td className="px-4 py-2">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">{log.eventType}</span>
                            </td>
                            <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{log.userId || '-'}</td>
                            <td className="px-4 py-2 text-slate-500 dark:text-slate-400 font-mono">{log.ipAddress || '-'}</td>
                            <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{log.deviceType || '-'}</td>
                            <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{log.city || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Fraud Detection */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-emerald-600" />
                    {t('admin.fraud.title', 'Détection de fraude')}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                    {t('admin.fraud.description', 'Analysez automatiquement les propriétés suspectes. Le système détecte les prix anormaux, les doublons, et les comptes suspects.')}
                  </p>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {[
                      { label: t('admin.fraud.analyses', 'Analyses effectuées'), value: String(fraudStats.analyses), color: 'text-blue-600' },
                      { label: t('admin.fraud.mediumAlerts', 'Alertes moyennes'), value: String(fraudStats.mediumAlerts), color: 'text-amber-600' },
                      { label: t('admin.fraud.highAlerts', 'Alertes hautes'), value: String(fraudStats.highAlerts), color: 'text-red-600' },
                    ].map(s => (
                      <div key={s.label} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                        <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                SETTINGS
            ═══════════════════════════════════════════════════════════ */}
            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                {/* Maintenance Mode */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{t('admin.settings.maintenance', 'Mode maintenance')}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('admin.settings.maintenanceDesc', 'Rendre le site inaccessible aux visiteurs')}</p>
                    </div>
                    <button
                      onClick={async () => {
                        const newVal = !maintenanceMode;
                        setMaintenanceMode(newVal);
                        try {
                          setSavingSettings(true);
                          await adminApi.updateSettings({ maintenance_mode: String(newVal) });
                          showToast(t('admin.settings.saved', 'Paramètres sauvegardés'), 'success');
                        } catch {
                          showToast(t('admin.settings.saveError', 'Erreur sauvegarde'), 'error');
                        } finally { setSavingSettings(false); }
                      }}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${maintenanceMode ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>

                {/* Feature Toggles */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4">{t('admin.settings.features', 'Fonctionnalités')}</h3>
                  <div className="space-y-4">
                    {[
                      { key: 'aiChat' as const, label: t('admin.settings.aiChat', 'Chatbot IA'), desc: t('admin.settings.aiChatDesc', 'Assistant intelligent pour les visiteurs') },
                      { key: 'voiceSearch' as const, label: t('admin.settings.voiceSearch', 'Recherche vocale'), desc: t('admin.settings.voiceSearchDesc', 'Recherche par commande vocale') },
                      { key: 'ads' as const, label: t('admin.settings.ads', 'Système d\'annonces'), desc: t('admin.settings.adsDesc', 'Publicités et promotions') },
                      { key: 'reviews' as const, label: t('admin.settings.reviews', 'Système d\'avis'), desc: t('admin.settings.reviewsDesc', 'Avis et notation des propriétés') },
                      { key: 'payments' as const, label: t('admin.settings.payments', 'Paiements en ligne'), desc: t('admin.settings.paymentsDesc', 'CMI et Stripe') },
                    ].map(feature => (
                      <div key={feature.key} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{feature.label}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{feature.desc}</p>
                        </div>
                        <button
                          onClick={async () => {
                            const newFlags = { ...featureFlags, [feature.key]: !featureFlags[feature.key] };
                            setFeatureFlags(newFlags);
                            try {
                              setSavingSettings(true);
                              const payload: Record<string, string> = {};
                              payload[`feature_${feature.key}`] = String(newFlags[feature.key]);
                              await adminApi.updateSettings(payload);
                              showToast(t('admin.settings.saved', 'Paramètres sauvegardés'), 'success');
                            } catch {
                              showToast(t('admin.settings.saveError', 'Erreur sauvegarde'), 'error');
                            } finally { setSavingSettings(false); }
                          }}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${featureFlags[feature.key] ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                        >
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${featureFlags[feature.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* API Config placeholder */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4">{t('admin.settings.api', 'Configuration API')}</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('admin.settings.stripeWebhook')}</label>
                      <input readOnly value="/api/v1/ads/stripe/webhook" className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-600 dark:text-slate-300" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('admin.settings.cmiCallback')}</label>
                      <input readOnly value="/api/v1/payments/cmi/callback/success" className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-600 dark:text-slate-300" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default Admin;
