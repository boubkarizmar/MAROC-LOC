import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationApi, Notification, NotificationFilters, NotificationStats } from '../api/notificationApi';
import { LoadingSpinner } from '../components/LoadingComponents';
import { Bell, Trash2, LayoutDashboard, ArrowLeft, Search, Filter, RefreshCw } from 'lucide-react';

const NOTIFICATION_TYPES = [
  'ALL',
  'NEW_MESSAGE',
  'RESERVATION_CREATED',
  'PURCHASE_CREATED',
  'PROPERTY_APPROVED',
  'PROPERTY_REJECTED',
  'VISIT_SCHEDULED',
  'VISIT_CONFIRMED',
  'ADVERTISEMENT_APPROVED',
  'PAYMENT_CMI_SUCCESS',
  'PAYMENT_STRIPE_SUCCESS',
  'PAYMENT_FAILED',
  'AI_RECOMMENDATION',
  'SYSTEM_ANNOUNCEMENT',
];

const STATUS_OPTIONS = ['ALL', 'UNREAD', 'READ', 'ARCHIVED'] as const;
const ROLE_OPTIONS = ['ALL', 'ADMIN', 'PROPRIETAIRE', 'LOCATAIRE'] as const;

const getIcon = (type?: string) => {
  switch (type) {
    case 'NEW_MESSAGE':
    case 'NEW_CONVERSATION':
      return '💬';
    case 'PRICE_DROP':
      return '📉';
    case 'VISIT_REMINDER':
    case 'VISIT_SCHEDULED':
    case 'VISIT_CONFIRMED':
    case 'VISIT_CANCELLED':
      return '📅';
    case 'SUBSCRIPTION_EXPIRING':
    case 'ADVERTISEMENT_EXPIRING_SOON':
    case 'ADVERTISEMENT_EXPIRED':
      return '⏰';
    case 'PROPERTY_APPROVED':
    case 'ADVERTISEMENT_APPROVED':
    case 'REVIEW_APPROVED':
      return '✅';
    case 'PROPERTY_REJECTED':
    case 'ADVERTISEMENT_REJECTED':
    case 'REVIEW_REJECTED':
    case 'RESERVATION_REFUSED':
    case 'PURCHASE_FAILED':
    case 'PAYMENT_FAILED':
      return '❌';
    case 'FRAUD_FLAG':
    case 'SUSPICIOUS_LOGIN':
      return '🚨';
    case 'AI_RECOMMENDATION':
      return '🤖';
    case 'PAYMENT_CMI_SUCCESS':
    case 'PAYMENT_STRIPE_SUCCESS':
    case 'PURCHASE_PAID':
      return '💳';
    case 'RESERVATION_CREATED':
    case 'PURCHASE_CREATED':
      return '🏠';
    default:
      return '🔔';
  }
};

export const AdminNotifications: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [filters, setFilters] = useState<NotificationFilters & { role?: string }>({
    status: 'ALL',
    type: 'ALL',
    role: 'ALL',
    search: '',
    size: 25,
  });

  const fetchNotifications = useCallback(async (p = 0, currentFilters = filters) => {
    setLoading(true);
    try {
      const apiFilters: NotificationFilters & { role?: string } = {
        page: p,
        size: currentFilters.size,
        search: currentFilters.search || undefined,
      };
      if (currentFilters.status && currentFilters.status !== 'ALL') apiFilters.status = currentFilters.status;
      if (currentFilters.type && currentFilters.type !== 'ALL') apiFilters.type = currentFilters.type;
      if (currentFilters.role && currentFilters.role !== 'ALL') apiFilters.role = currentFilters.role;

      const result = await notificationApi.getAllNotifications(apiFilters);
      setNotifications((prev) => (p === 0 ? result.content : [...prev, ...result.content]));
      setPage(result.number);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch (e) {
      if (import.meta.env.DEV) console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchStats = useCallback(async () => {
    try {
      const s = await notificationApi.getGlobalStats();
      setStats(s);
    } catch (e) {
      if (import.meta.env.DEV) console.error(e);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/home', { replace: true });
      return;
    }
    fetchNotifications(0);
    fetchStats();
  }, [fetchNotifications, fetchStats, isAdmin, navigate]);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    fetchNotifications(0, next);
  };

  const handleDelete = async (id: number) => {
    try {
      await notificationApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      fetchStats();
    } catch (e) {
      if (import.meta.env.DEV) console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100 flex">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-gold-400">MAROC-LOC Admin</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link
            to="/admin"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-slate-800 hover:text-white transition"
          >
            <LayoutDashboard className="w-5 h-5" />
            {t('admin.dashboard')}
          </Link>
          <Link
            to="/admin/notifications"
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800 text-white"
          >
            <Bell className="w-5 h-5" />
            {t('notifications.title')}
          </Link>
        </nav>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="p-4 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/admin')}
                className="p-2 rounded-full hover:bg-slate-800 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Bell className="w-6 h-6 text-gold-400" />
                {t('notifications.adminTitle') || 'Centre de notifications'}
              </h1>
            </div>
            <button
              onClick={() => { fetchNotifications(0); fetchStats(); }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-900 bg-gold-400 rounded-lg hover:bg-gold-300 transition"
            >
              <RefreshCw className="w-4 h-4" />
              {t('common.refresh')}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-sm text-gray-400">{t('notifications.total')}</p>
              <p className="text-2xl font-bold text-white">{stats?.total ?? totalElements}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-sm text-gray-400">{t('notifications.unread')}</p>
              <p className="text-2xl font-bold text-blue-400">{stats?.unread ?? '-'}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-sm text-gray-400">{t('notifications.read')}</p>
              <p className="text-2xl font-bold text-green-400">{stats?.read ?? '-'}</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder={t('notifications.searchPlaceholder') || 'Rechercher...'}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-700 bg-slate-950 text-gray-100 focus:ring-2 focus:ring-gold-400 outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="pl-9 pr-4 py-2 rounded-lg border border-slate-700 bg-slate-950 text-gray-100 focus:ring-2 focus:ring-gold-400 outline-none"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{t(`notifications.status.${s.toLowerCase()}`) || s}</option>
                    ))}
                  </select>
                </div>
                <select
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                  className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-950 text-gray-100 focus:ring-2 focus:ring-gold-400 outline-none"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>{t(`roles.${r.toLowerCase()}`) || r}</option>
                  ))}
                </select>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-950 text-gray-100 focus:ring-2 focus:ring-gold-400 outline-none"
                >
                  {NOTIFICATION_TYPES.map((type) => (
                    <option key={type} value={type}>{t(`notifications.types.${type}`) || type}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {loading && notifications.length === 0 ? (
              <div className="py-16 flex justify-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-16 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{t('notifications.empty')}</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="group flex items-start gap-4 p-4 hover:bg-slate-800/50 transition"
                  >
                    <span className="text-2xl shrink-0">{getIcon(notif.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">{notif.title}</h3>
                        {notif.status === 'UNREAD' && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                      </div>
                      <p className="text-sm text-gray-300 mt-0.5">{notif.message}</p>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                        <span>ID: {notif.id}</span>
                        <span>Type: {notif.type}</span>
                        {notif.userId && <span>User: {notif.userId}</span>}
                        {notif.role && <span>Role: {notif.role}</span>}
                        {notif.actionUrl && <span>URL: {notif.actionUrl}</span>}
                        <span>{new Date(notif.createdAt).toLocaleString('fr-FR')}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(notif.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-slate-800 transition"
                      title={t('notifications.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {page + 1 < totalPages && (
              <div className="p-4 border-t border-slate-800 text-center">
                <button
                  onClick={() => fetchNotifications(page + 1)}
                  disabled={loading}
                  className="px-6 py-2 text-sm font-medium text-gold-400 hover:bg-slate-800 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? t('common.loading') : t('notifications.loadMore')}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminNotifications;
