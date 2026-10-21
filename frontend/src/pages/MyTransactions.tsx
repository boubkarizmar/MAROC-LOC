import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, CreditCard, Home, Tag, XCircle, Loader2 } from 'lucide-react';
import { reservationApi, PropertyReservation } from '../api/reservationApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { fixMediaUrl } from '../utils/imageUtils';

const statusColor: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  CONFIRMED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  EXPIRED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  REFUNDED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

export const MyTransactions: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<PropertyReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadTransactions();
  }, [isAuthenticated]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const res = await reservationApi.getMyReservations();
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setItems(list);
    } catch (err) {
      showToast(t('transactions.loadError', 'Unable to load transactions'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm(t('transactions.confirmCancel', 'Cancel this transaction?'))) return;
    setCancellingId(id);
    try {
      await reservationApi.cancel(id);
      showToast(t('transactions.cancelSuccess', 'Transaction cancelled'), 'success');
      loadTransactions();
    } catch (err) {
      showToast(t('transactions.cancelError', 'Cancellation failed'), 'error');
    } finally {
      setCancellingId(null);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-morocco-royal transition"
        >
          <ArrowLeft size={20} />
          {t('common.back')}
        </button>

        <h1 className="text-2xl md:text-3xl font-black text-morocco-charcoal dark:text-slate-100 mb-6">
          {t('transactions.title', 'My reservations & purchases')}
        </h1>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-morocco-royal" size={32} />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-12 text-center shadow-lg">
            <Home size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-slate-600 dark:text-slate-400">
              {t('transactions.empty', 'You have no reservations or purchases yet.')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-lg flex flex-col md:flex-row gap-5"
              >
                <div className="h-32 w-full md:w-48 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {item.propertyImageUrl ? (
                    <img
                      src={fixMediaUrl(item.propertyImageUrl)}
                      alt={item.propertyTitle}
                      className="h-full w-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/images/no-image.svg'; }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">
                      <Home size={32} />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link
                        to={`/property/${item.propertyId}`}
                        className="text-lg font-bold text-morocco-charcoal dark:text-slate-100 hover:text-morocco-royal transition"
                      >
                        {item.propertyTitle || `#${item.propertyId}`}
                      </Link>
                      <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                        <Tag size={14} />
                        {t(`property.types.${item.transactionType}`, item.transactionType)}
                        {item.propertyCity && <> · {item.propertyCity}</>}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase ${statusColor[item.status] || 'bg-slate-100 text-slate-600'}`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <CreditCard size={16} className="text-morocco-gold" />
                      <span className="font-semibold text-morocco-charcoal dark:text-slate-200">
                        {new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(item.amount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Calendar size={16} className="text-morocco-gold" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {item.status === 'PENDING' && (
                    <button
                      onClick={() => handleCancel(item.id)}
                      disabled={cancellingId === item.id}
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      {cancellingId === item.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <XCircle size={14} />
                      )}
                      {t('transactions.cancel', 'Cancel')}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
