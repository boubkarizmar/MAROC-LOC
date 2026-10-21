import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';

import { notificationApi, Notification, NotificationFilters, NotificationStats } from '../api/notificationApi';
import { LoadingSpinner } from '../components/LoadingComponents';
import { Bell, Trash2, Check, CheckCheck, Search, Filter, ArrowLeft } from 'lucide-react';

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

export const Notifications: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const { refreshNotifications } = useWebSocket(token);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [filters, setFilters] = useState<NotificationFilters>({ status: 'ALL', type: 'ALL', search: '', size: 20 });

  const fetchNotifications = useCallback(async (p = 0, currentFilters = filters) => {
    if (!token) return;
    setLoading(true);
    try {
      const apiFilters: NotificationFilters = {
        page: p,
        size: currentFilters.size,
        search: currentFilters.search || undefined,
      };
      if (currentFilters.status && currentFilters.status !== 'ALL') apiFilters.status = currentFilters.status;
      if (currentFilters.type && currentFilters.type !== 'ALL') apiFilters.type = currentFilters.type;

      const result = await notificationApi.getMyNotifications(apiFilters);
      setNotifications((prev) => (p === 0 ? result.content : [...prev, ...result.content]));
      setPage(result.number);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch (e) {
      if (import.meta.env.DEV) console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token, filters]);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const s = await notificationApi.getStats();
      setStats(s);
    } catch (e) {
      if (import.meta.env.DEV) console.error(e);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications(0);
    fetchStats();
  }, [fetchNotifications, fetchStats]);

  const handleFilterChange = (key: keyof NotificationFilters, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    fetchNotifications(0, next);
  };

  const handleMarkRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: 'READ' as const, readAt: new Date().toISOString() } : n))
      );
      refreshNotifications();
      fetchStats();
    } catch (e) {
      if (import.meta.env.DEV) console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, status: 'READ' as const, readAt: new Date().toISOString() })));
      refreshNotifications();
      fetchStats();
    } catch (e) {
      if (import.meta.env.DEV) console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await notificationApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      refreshNotifications();
      fetchStats();
    } catch (e) {
      if (import.meta.env.DEV) console.error(e);
    }
  };

  const handleItemClick = (notif: Notification) => {
    if (notif.status === 'UNREAD') {
      handleMarkRead(notif.id);
    }
    if (notif.actionUrl) {
      if (notif.actionUrl.startsWith('/') && !notif.actionUrl.startsWith('//')) {
        navigate(notif.actionUrl);
      } else {
        window.location.href = notif.actionUrl;
      }
    }
  };

  const unreadCount = stats?.unread ?? notifications.filter((n) => n.status === 'UNREAD').length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Bell className="w-6 h-6 text-blue-600" />
              {t('notifications.title')}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
              >
                <CheckCheck className="w-4 h-4" />
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder={t('notifications.searchPlaceholder') || 'Rechercher une notification...'}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{t(`notifications.status.${s.toLowerCase()}`) || s}</option>
                  ))}
                </select>
              </div>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {NOTIFICATION_TYPES.map((type) => (
                  <option key={type} value={type}>{t(`notifications.types.${type}`) || type}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
            <span>{t('notifications.total')}: <strong>{totalElements}</strong></span>
            <span>{t('notifications.unread')}: <strong>{stats?.unread ?? '-'}</strong></span>
            <span>{t('notifications.read')}: <strong>{stats?.read ?? '-'}</strong></span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
          {loading && notifications.length === 0 ? (
            <div className="py-16 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center text-gray-500 dark:text-gray-400">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{t('notifications.empty')}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-slate-700">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`group flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition ${
                    notif.status === 'UNREAD' ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''
                  }`}
                >
                  <button
                    onClick={() => handleItemClick(notif)}
                    className="text-2xl shrink-0"
                  >
                    {getIcon(notif.type)}
                  </button>
                  <button
                    onClick={() => handleItemClick(notif)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm font-semibold text-gray-900 dark:text-white ${notif.status === 'UNREAD' ? 'text-blue-900 dark:text-blue-100' : ''}`}>
                        {notif.title}
                      </h3>
                      {notif.status === 'UNREAD' && (
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notif.createdAt).toLocaleString('fr-FR', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </button>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    {notif.status === 'UNREAD' && (
                      <button
                        onClick={() => handleMarkRead(notif.id)}
                        className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700"
                        title={t('notifications.markAsRead')}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notif.id)}
                      className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-700"
                      title={t('notifications.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {page + 1 < totalPages && (
            <div className="p-4 border-t border-gray-100 dark:border-slate-700 text-center">
              <button
                onClick={() => fetchNotifications(page + 1)}
                disabled={loading}
                className="px-6 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition disabled:opacity-50"
              >
                {loading ? t('common.loading') : t('notifications.loadMore')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
