import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { visitApi } from '../api/visitApi';
import { useToast } from '../components/ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Calendar, Clock, User, MapPin, Home, CheckCircle2, XCircle,
  Loader2, Filter, Search, ChevronRight, Phone, Mail, MessageCircle,
  AlertCircle, Check, X
} from 'lucide-react';

interface Visit {
  id: number;
  propertyId: number;
  propertyTitle: string;
  propertyCity: string;
  visitorId: number;
  visitorName: string;
  visitorPhone?: string;
  visitorEmail?: string;
  visitDate: string;
  visitTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string;
  createdAt: string;
}

export const OwnerVisits: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isProprietaire } = useAuth();
  const { showToast } = useToast();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);

  const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    PENDING: { label: t('visit.status.pending'), color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
    CONFIRMED: { label: t('visit.status.confirmed'), color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
    COMPLETED: { label: t('visit.status.completed'), color: 'text-blue-600', bg: 'bg-blue-50', icon: Check },
    CANCELLED: { label: t('visit.status.cancelled'), color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
    NO_SHOW: { label: t('visit.status.noShow'), color: 'text-slate-600', bg: 'bg-slate-50', icon: X },
  };

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (!isProprietaire) { navigate('/home'); return; }
    loadVisits();
  }, [user, isProprietaire, navigate]);

  const loadVisits = async () => {
    setLoading(true);
    try {
      const res = await visitApi.getOwnerVisits();
      const data = res.data?.data || res.data || [];
      setVisits(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast(t('visit.loadError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (visitId: number) => {
    setProcessingId(visitId);
    try {
      await visitApi.updateStatus(visitId, 'CONFIRMED');
      showToast(t('visit.confirmed'), 'success');
      setVisits(prev => prev.map(v => v.id === visitId ? { ...v, status: 'CONFIRMED' } : v));
    } catch (err) {
      showToast('Erreur', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (visitId: number) => {
    if (!confirm(t('visit.cancelConfirm'))) return;
    setProcessingId(visitId);
    try {
      await visitApi.cancelVisit(visitId);
      showToast(t('visit.cancelled'), 'success');
      setVisits(prev => prev.map(v => v.id === visitId ? { ...v, status: 'CANCELLED' } : v));
    } catch (err) {
      showToast('Erreur', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleComplete = async (visitId: number) => {
    setProcessingId(visitId);
    try {
      await visitApi.updateStatus(visitId, 'COMPLETED');
      showToast(t('visit.completed'), 'success');
      setVisits(prev => prev.map(v => v.id === visitId ? { ...v, status: 'COMPLETED' } : v));
    } catch (err) {
      showToast('Erreur', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredVisits = visits.filter(v => {
    if (filter !== 'all' && v.status !== filter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        v.propertyTitle?.toLowerCase().includes(q) ||
        v.propertyCity?.toLowerCase().includes(q) ||
        v.visitorName?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stats = {
    total: visits.length,
    pending: visits.filter(v => v.status === 'PENDING').length,
    confirmed: visits.filter(v => v.status === 'CONFIRMED').length,
    completed: visits.filter(v => v.status === 'COMPLETED').length,
    cancelled: visits.filter(v => v.status === 'CANCELLED').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition">
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">{t('common.back')}</span>
          </button>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Calendar size={24} className="text-teal-600" />
            {t('visit.title')}
          </h1>
          <button
            onClick={loadVisits}
            className="p-2 rounded-lg hover:bg-slate-100 transition"
            title={t('common.refresh')}
          >
            <Loader2 size={16} className={`text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {[
            { label: t('visit.stats.total'), value: stats.total, color: 'bg-slate-600' },
            { label: t('visit.status.pending'), value: stats.pending, color: 'bg-amber-500' },
            { label: t('visit.status.confirmed'), value: stats.confirmed, color: 'bg-emerald-500' },
            { label: t('visit.status.completed'), value: stats.completed, color: 'bg-blue-500' },
            { label: t('visit.status.cancelled'), value: stats.cancelled, color: 'bg-red-500' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-3 text-center shadow-sm border border-slate-100">
              <p className="text-lg font-black text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t('visit.searchPlaceholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-teal-500 transition"
            />
          </div>
          <div className="flex gap-1 bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
            {[
              { key: 'all', label: t('common.all') },
              { key: 'PENDING', label: t('visit.status.pending') },
              { key: 'CONFIRMED', label: t('visit.status.confirmed') },
              { key: 'COMPLETED', label: t('visit.status.completed') },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  filter === f.key
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Visits List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={28} className="animate-spin text-teal-600" />
          </div>
        ) : filteredVisits.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-100">
            <Calendar size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">{t('visit.empty')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredVisits.map((visit) => {
                const status = statusConfig[visit.status] || statusConfig.PENDING;
                const StatusIcon = status.icon;
                const isProcessing = processingId === visit.id;

                return (
                  <motion.div
                    key={visit.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                            <StatusIcon size={12} />
                            {status.label}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(visit.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900">{visit.propertyTitle}</h3>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-500">
                          <span className="flex items-center gap-1"><MapPin size={12} className="text-amber-500" />{visit.propertyCity}</span>
                          <span className="flex items-center gap-1"><Calendar size={12} className="text-teal-500" />{visit.visitDate}</span>
                          <span className="flex items-center gap-1"><Clock size={12} className="text-blue-500" />{visit.visitTime}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                          <span className="flex items-center gap-1 text-slate-600"><User size={12} />{visit.visitorName || 'Anonyme'}</span>
                          {visit.visitorPhone && (
                            <span className="flex items-center gap-1 text-slate-600"><Phone size={12} />{visit.visitorPhone}</span>
                          )}
                          {visit.visitorEmail && (
                            <span className="flex items-center gap-1 text-slate-600"><Mail size={12} />{visit.visitorEmail}</span>
                          )}
                        </div>
                        {visit.notes && (
                          <p className="mt-2 text-xs text-slate-500 bg-slate-50 rounded-lg p-2">
                            {visit.notes}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {visit.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleConfirm(visit.id)}
                              disabled={isProcessing}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition disabled:opacity-50"
                            >
                              {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                              {t('visit.confirm')}
                            </button>
                            <button
                              onClick={() => handleCancel(visit.id)}
                              disabled={isProcessing}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition disabled:opacity-50"
                            >
                              <X size={12} />
                              {t('visit.decline')}
                            </button>
                          </>
                        )}
                        {visit.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleComplete(visit.id)}
                            disabled={isProcessing}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition disabled:opacity-50"
                          >
                            {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                            {t('visit.complete')}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerVisits;
