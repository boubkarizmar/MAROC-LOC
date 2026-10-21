import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, ArrowLeft, Home } from 'lucide-react';
import { cmiPaymentApi } from '../api/cmiPaymentApi';
import { useToast } from '../components/ui/Toast';
import { LiveRegion } from '../components/ux/AccessibilityUtils';

export const PaymentCallback: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'fail' | 'unknown'>('loading');
  const [orderId, setOrderId] = useState<string>('');
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const oid = searchParams.get('oid') || '';
    const cmiStatus = searchParams.get('status') || '';
    setOrderId(oid);

    if (!oid) {
      setStatus('unknown');
      return;
    }

    // Poll backend for final transaction status
    const checkStatus = async () => {
      try {
        const res = await cmiPaymentApi.getStatus(oid);
        const statusData = res.data || res;
        const txStatus = statusData.status?.toUpperCase();
        if (txStatus === 'COMPLETED' || txStatus === 'SUCCESS') {
          setStatus('success');
          showToast(t('payment.confirmedToast'), 'success');
        } else if (txStatus === 'FAILED' || cmiStatus === 'fail') {
          setStatus('fail');
        } else {
          setStatus('unknown');
        }
      } catch (err) {
        // If backend status endpoint not available, infer from URL param
        if (cmiStatus === 'success') {
          setStatus('success');
        } else if (cmiStatus === 'fail') {
          setStatus('fail');
        } else {
          setStatus('unknown');
        }
      }
    };

    checkStatus();
  }, [searchParams, showToast]);

  const liveMessage =
    status === 'loading'
      ? t('payment.verifying')
      : status === 'success'
      ? t('payment.success.title')
      : status === 'fail'
      ? t('payment.fail.title')
      : t('payment.unknown.title');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
      <LiveRegion message={liveMessage} priority={status === 'fail' ? 'assertive' : 'polite'} />
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={prefersReducedMotion ? {} : undefined}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center"
      >
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={48} className="animate-spin text-teal-600" />
            <h2 className="text-xl font-bold text-slate-900">{t('payment.verifying')}</h2>
            <p className="text-sm text-slate-500">{t('payment.order', { orderId })}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <motion.div
              initial={prefersReducedMotion ? { scale: 1 } : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={prefersReducedMotion ? {} : { type: 'spring', stiffness: 200 }}
            >
              <CheckCircle size={64} className="text-emerald-500" />
            </motion.div>
            <h2 className="text-2xl font-black text-slate-900">{t('payment.success.title')}</h2>
            <p className="text-sm text-slate-500">
              {t('payment.success.message')}
            </p>
            <p className="text-xs text-slate-400 font-mono">{t('payment.order', { orderId })}</p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition"
              >
                <Home size={16} />
                {t('payment.success.dashboard')}
              </button>
            </div>
          </div>
        )}

        {status === 'fail' && (
          <div className="flex flex-col items-center gap-4">
            <XCircle size={64} className="text-red-500" />
            <h2 className="text-2xl font-black text-slate-900">{t('payment.fail.title')}</h2>
            <p className="text-sm text-slate-500">
              {t('payment.fail.message')}
            </p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition"
              >
                <ArrowLeft size={16} />
                {t('payment.fail.retry')}
              </button>
            </div>
          </div>
        )}

        {status === 'unknown' && (
          <div className="flex flex-col items-center gap-4">
            <XCircle size={64} className="text-amber-500" />
            <h2 className="text-2xl font-black text-slate-900">{t('payment.unknown.title')}</h2>
            <p className="text-sm text-slate-500">
              {t('payment.unknown.message')}
            </p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition"
              >
                <Home size={16} />
                {t('payment.unknown.dashboard')}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
