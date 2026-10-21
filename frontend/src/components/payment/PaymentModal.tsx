import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, CreditCard, Lock, CheckCircle, Shield, Smartphone, Building2, Loader2 } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { cmiPaymentApi, submitCMIPaymentForm, CMI_GATEWAY_URL } from '../../api/cmiPaymentApi';
import { useAuth } from '../../context/AuthContext';

interface PaymentModalProps {
  amount: number;
  description: string;
  orderId?: string;
  propertyId?: number;
  transactionType?: 'RESERVATION' | 'PURCHASE';
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type PaymentMethod = 'cmi' | 'bank' | 'cash';

export const PaymentModal: React.FC<PaymentModalProps> = ({
  amount,
  description,
  orderId: externalOrderId,
  propertyId,
  transactionType,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [method, setMethod] = useState<PaymentMethod>('cmi');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  const formatCurrency = (a: number) =>
    new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(a);

  const formatCardNumber = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const generateOrderId = () => {
    return externalOrderId || `MAROC-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  };

  const handlePay = async () => {
    if (method === 'cmi') {
      setLoading(true);
      try {
        const oid = generateOrderId();
        const res = await cmiPaymentApi.initiate({
          orderId: oid,
          amount,
          currency: '504', // MAD
          lang: 'fr',
          email: user?.email || 'guest@maroc-loc.ma',
          propertyId,
          transactionType,
        });

        const paymentParams = res.data || res;
        if (paymentParams && paymentParams.hash) {
          showToast(t('payment.redirectingCmi'), 'info');
          submitCMIPaymentForm(paymentParams, CMI_GATEWAY_URL);
        } else {
          showToast(t('payment.initError'), 'error');
        }
      } catch (err: any) {
        showToast(err?.message || t('payment.cmiError'), 'error');
        setLoading(false);
      }
      return;
    }

    // Bank transfer or cash: mock flow for now (no real gateway)
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setStep(3);
    showToast(t('payment.requestSuccess'), 'success');
    onSuccess?.();
  };

  const reset = () => {
    setStep(1);
    setMethod('cmi');
    setCardNumber('');
    setExpiry('');
    setCvv('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => { reset(); onClose(); }}
          />
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
            transition={prefersReducedMotion ? {} : undefined}
            className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-morocco-royal to-morocco-emerald p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-lg">{t('payment.title')}</h2>
                    <p className="text-white/70 text-sm">{description}</p>
                  </div>
                </div>
                <button onClick={() => { reset(); onClose(); }} aria-label={t('common.close')} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition">
                  <X className="w-5 h-5 text-white" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="p-5">
              {step === 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="text-center py-2">
                    <p className="text-3xl font-black text-slate-900 dark:text-slate-50">{formatCurrency(amount)}</p>
                    <p className="text-sm text-slate-500">{t('payment.totalAmount')}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('payment.chooseMethod')}</p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { key: 'cmi' as const, label: 'CMI', icon: CreditCard, desc: t('payment.method.cmi') },
                        { key: 'bank' as const, label: t('payment.method.bank'), icon: Building2, desc: t('payment.method.bankDesc') },
                        { key: 'cash' as const, label: t('payment.method.cash'), icon: Smartphone, desc: t('payment.method.cashDesc') },
                      ].map((m) => (
                        <button
                          key={m.key}
                          onClick={() => setMethod(m.key)}
                          className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition ${
                            method === m.key
                              ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <m.icon size={22} className={method === m.key ? 'text-teal-600' : 'text-slate-400'} />
                          <span className={`text-xs font-semibold ${method === m.key ? 'text-teal-700' : 'text-slate-600'}`}>{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-morocco-royal to-morocco-emerald text-white font-bold hover:shadow-lg transition"
                  >
                    {t('payment.continue')}
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  {method === 'cmi' && (
                    <>
                      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10" />
                        <div className="relative">
                          <div className="flex items-center gap-2 mb-4">
                            <CreditCard size={20} className="text-gold-400" />
                            <span className="text-xs text-white/60">{t('payment.cmiSecure')}</span>
                          </div>
                          <p className="text-lg font-mono tracking-widest mb-3">
                            {cardNumber || '•••• •••• •••• ••••'}
                          </p>
                          <div className="flex justify-between text-xs text-white/60">
                            <span>{name || 'NOM PRÉNOM'}</span>
                            <span>{expiry || 'MM/AA'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">{t('payment.cardNumber')}</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                              placeholder="1234 5678 9012 3456"
                              className="w-full mt-1 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
                            />
                            <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">{t('payment.expiryDate')}</label>
                            <input
                              type="text"
                              value={expiry}
                              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                              placeholder="MM/AA"
                              className="w-full mt-1 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">{t('payment.cvv')}</label>
                            <input
                              type="password"
                              value={cvv}
                              onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                              placeholder="123"
                              className="w-full mt-1 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">{t('payment.cardHolder')}</label>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value.toUpperCase())}
                            placeholder="NOM PRÉNOM"
                            className="w-full mt-1 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Shield size={14} className="text-teal-500" />
                        <span>{t('payment.secureNote')}</span>
                      </div>
                    </>
                  )}

                  {method === 'bank' && (
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-3">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('payment.bankTransfer')}</p>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-slate-500">{t('payment.bank')}:</span> {t('payment.bankName')}</p>
                        <p><span className="text-slate-500">{t('payment.rib')}:</span> 007 810 000 123 456 7890 12</p>
                        <p><span className="text-slate-500">{t('payment.beneficiary')}:</span> MAROC-LOC SARL</p>
                        <p className="text-xs text-slate-400 mt-2">{t('payment.transferHint')}</p>
                      </div>
                    </div>
                  )}

                  {method === 'cash' && (
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-3">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('payment.cash')}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {t('payment.cashHint')}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition"
                    >
                      {t('common.back')}
                    </button>
                    <button
                      onClick={handlePay}
                      disabled={loading || (method === 'cmi' && (!cardNumber || !expiry || !cvv))}
                      className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-morocco-royal to-morocco-emerald text-white font-bold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <><Loader2 size={18} className="animate-spin" /> {t('payment.processing')}</>
                      ) : (
                        <>{t('payment.payAmount', { amount: formatCurrency(amount) })}</>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                    <CheckCircle size={32} className="text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">{t('payment.successTitle')}</h3>
                    <p className="text-sm text-slate-500 mt-1">{formatCurrency(amount)} — {description}</p>
                  </div>
                  <p className="text-xs text-slate-400">
                    {t('payment.successReceipt')}
                  </p>
                  <button
                    onClick={() => { reset(); onClose(); }}
                    className="px-6 py-2.5 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 transition"
                  >
                    {t('payment.finish')}
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
