import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  X, Rocket, Crown, Gem, Zap, Check, CreditCard, Banknote, Smartphone,
  ArrowRight, Loader2, Star, TrendingUp, Eye, Calendar
} from 'lucide-react';
import { advertisementApi, AdvertisementPlan } from '../../api/advertisementApi';
import { cmiPaymentApi, submitCMIPaymentForm, CMI_GATEWAY_URL } from '../../api/cmiPaymentApi';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../context/AuthContext';

interface PromotionModalProps {
  propertyId?: number;
  propertyTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PromotionModal: React.FC<PromotionModalProps> = ({
  propertyId,
  propertyTitle,
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [plans, setPlans] = useState<AdvertisementPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<'cmi' | 'bank' | 'cash'>('cmi');
  const [loading, setLoading] = useState(false);
  const [plansLoading, setPlansLoading] = useState(false);
  const { showToast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setPlansLoading(true);
      advertisementApi.getPlans()
        .then(res => {
          const raw = res.data.data || res.data || [];
          // Map backend plan format to frontend expected format
          const mapped = raw.map((plan: any) => ({
            tier: plan.name || plan.tier || 'UNKNOWN',
            name: plan.displayName || plan.name || 'Plan',
            description: plan.description || '',
            monthlyPrice: plan.amountMinorUnits ? plan.amountMinorUnits / 100 : (plan.monthlyPrice || 0),
            yearlyPrice: plan.yearlyPrice || 0,
            features: [
              ...(plan.maxProperties > 0 && plan.maxProperties < 1000 ? [`${plan.maxProperties} propriété(s)`] : plan.maxProperties >= 1000 ? ['Propriétés illimitées'] : []),
              ...(plan.maxImages > 0 && plan.maxImages < 1000 ? [`Jusqu'à ${plan.maxImages} images`] : plan.maxImages >= 1000 ? ['Images illimitées'] : []),
              ...(plan.videoAllowed ? ['Vidéo incluse'] : []),
              ...(plan.homepagePlacement ? ['Homepage'] : []),
              ...(plan.featuredBadge ? ['Badge Featured'] : []),
              ...(plan.supportsAdvancedTargeting ? ['Ciblage avancé'] : []),
              ...(plan.durationDays ? [`${plan.durationDays} jours`] : []),
            ],
            limits: [
              ...(plan.maxProperties > 0 && plan.maxProperties < 1000 ? [`${plan.maxProperties} propriété(s) max`] : []),
              ...(plan.durationDays ? [`Durée ${plan.durationDays} jours`] : []),
            ],
            current: plan.current || false,
          }));
          setPlans(mapped.length > 0 ? mapped : []);
        })
        .catch(() => {
          // Fallback plans if API fails
          setPlans([
            {
              tier: 'BOOST_7',
              name: t('promotion.plan.boost7.name'),
              description: t('promotion.plan.boost7.description'),
              monthlyPrice: 49,
              yearlyPrice: 0,
              features: [t('promotion.plan.boost7.feature1'), t('promotion.plan.boost7.feature2'), t('promotion.plan.boost7.feature3')],
              limits: [t('promotion.plan.boost7.limit1')],
              current: false,
            },
            {
              tier: 'PREMIUM',
              name: t('promotion.plan.premium.name'),
              description: t('promotion.plan.premium.description'),
              monthlyPrice: 99,
              yearlyPrice: 990,
              features: [t('promotion.plan.premium.feature1'), t('promotion.plan.premium.feature2'), t('promotion.plan.premium.feature3'), t('promotion.plan.premium.feature4')],
              limits: [t('promotion.plan.premium.limit1')],
              current: false,
            },
            {
              tier: 'FEATURED',
              name: t('promotion.plan.featured.name'),
              description: t('promotion.plan.featured.description'),
              monthlyPrice: 299,
              yearlyPrice: 2990,
              features: [t('promotion.plan.featured.feature1'), t('promotion.plan.featured.feature2'), t('promotion.plan.featured.feature3'), t('promotion.plan.featured.feature4'), t('promotion.plan.featured.feature5')],
              limits: [],
              current: false,
            },
          ]);
        })
        .finally(() => setPlansLoading(false));
    }
  }, [isOpen]);

  const getPlanPrice = (plan: AdvertisementPlan | undefined) => {
    if (!plan) return 0;
    if (billingCycle === 'yearly' && plan.yearlyPrice > 0) {
      return plan.yearlyPrice;
    }
    return plan.monthlyPrice;
  };

  const handleCheckout = async () => {
    if (!selectedPlan) return;
    const plan = plans.find(p => p.tier === selectedPlan);
    const price = getPlanPrice(plan);

    if (paymentMethod === 'cmi') {
      setLoading(true);
      try {
        const orderId = `PLAN-${selectedPlan}-${Date.now()}`;
        const res = await cmiPaymentApi.initiate({
          orderId,
          amount: price,
          currency: '504',
          lang: 'fr',
          email: user?.email || 'guest@maroc-loc.ma',
        });
        const paymentParams = res.data || res;
        if (paymentParams?.hash) {
          submitCMIPaymentForm(paymentParams, CMI_GATEWAY_URL);
        } else {
          showToast(t('promotion.errors.init'), 'error');
          setLoading(false);
        }
      } catch (err: any) {
        showToast(err?.message || t('promotion.errors.cmi'), 'error');
        setLoading(false);
      }
      return;
    }

    // Stripe / Bank / Cash fallback: use Saga checkout API
    setLoading(true);
    try {
      const res = await advertisementApi.createCheckoutSession({
        plan: selectedPlan,
        propertyIds: propertyId ? [propertyId] : [],
        durationMonths: billingCycle === 'yearly' ? 12 : 1,
        successUrl: `${window.location.origin}/payment/cmi/callback?status=success`,
        cancelUrl: `${window.location.origin}/payment/cmi/callback?status=cancel`,
      });
      if (res.data.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      } else {
        showToast(t('promotion.success'), 'success');
        onClose();
      }
    } catch (err) {
      showToast(t('promotion.error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const planIcons: Record<string, React.ReactNode> = {
    BOOST_7: <Zap size={24} className="text-amber-500" />,
    PREMIUM: <Crown size={24} className="text-violet-500" />,
    FEATURED: <Gem size={24} className="text-emerald-500" />,
    FREE: <Star size={24} className="text-slate-400" />,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={prefersReducedMotion ? {} : undefined}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { scale: 0.9, opacity: 0, y: 20 }}
            transition={prefersReducedMotion ? {} : undefined}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-800 rounded-t-2xl border-b border-slate-100 p-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
                  <Rocket size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">{t('promotion.title')}</h2>
                  {propertyTitle && (
                    <p className="text-xs text-slate-500 truncate max-w-[200px]">{propertyTitle}</p>
                  )}
                </div>
              </div>
              <button onClick={onClose} aria-label={t('common.close')} className="p-2 rounded-lg hover:bg-slate-100 transition">
                <X size={20} className="text-slate-500" aria-hidden="true" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Stats preview */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Eye, label: t('promotion.views'), value: 'x3', color: 'text-blue-500' },
                  { icon: TrendingUp, label: t('promotion.leads'), value: '+150%', color: 'text-emerald-500' },
                  { icon: Calendar, label: t('promotion.duration'), value: '30j', color: 'text-violet-500' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-slate-50 dark:bg-slate-700 rounded-xl p-3 text-center">
                    <stat.icon size={16} className={`mx-auto mb-1 ${stat.color}`} />
                    <p className="text-lg font-black text-slate-900 dark:text-slate-50">{stat.value}</p>
                    <p className="text-xs text-slate-500">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Plans */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700">{t('promotion.choosePlan')}</p>
                {plansLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 size={20} className="animate-spin text-slate-400" />
                  </div>
                ) : (
                  plans.filter(p => p.tier !== 'FREE').map((plan) => (
                    <button
                      key={plan.tier}
                      onClick={() => setSelectedPlan(plan.tier)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition text-left ${
                        selectedPlan === plan.tier
                          ? 'border-teal-500 bg-teal-50/50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${selectedPlan === plan.tier ? 'bg-teal-100' : 'bg-slate-100'}`}>
                        {planIcons[plan.tier] || <Star size={24} className="text-slate-400" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-slate-900 dark:text-slate-50">{plan.name}</p>
                          <p className="font-bold text-teal-600">
                            {plan.monthlyPrice === 0 ? t('promotion.free') : `${plan.monthlyPrice} ${t('promotion.perMonth')}`}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500">{plan.description}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {plan.features?.slice(0, 3).map((f, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                      {selectedPlan === plan.tier && (
                        <Check size={18} className="text-teal-600 flex-shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Billing cycle */}
              {selectedPlan && plans.find(p => p.tier === selectedPlan)?.yearlyPrice > 0 && (
                <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1">
                  {(['monthly', 'yearly'] as const).map((cycle) => (
                    <button
                      key={cycle}
                      onClick={() => setBillingCycle(cycle)}
                      className={`flex-1 py-1.5 rounded-md text-xs font-medium transition ${
                        billingCycle === cycle
                          ? 'bg-white text-teal-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {cycle === 'monthly' ? t('promotion.monthly') : t('promotion.yearly')}
                    </button>
                  ))}
                </div>
              )}

              {/* Payment method */}
              {selectedPlan && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-700">{t('promotion.paymentMethod')}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'cmi', label: 'CMI', icon: CreditCard },
                      { key: 'bank', labelKey: 'common.bankTransfer', label: t('common.bankTransfer'), icon: Banknote },
                      { key: 'cash', labelKey: 'common.cash', label: t('common.cash'), icon: Smartphone },
                    ].map((method) => (
                      <button
                        key={method.key}
                        onClick={() => setPaymentMethod(method.key as any)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition ${
                          paymentMethod === method.key
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <method.icon size={18} className={paymentMethod === method.key ? 'text-teal-600' : 'text-slate-400'} />
                        <span className={`text-xs font-medium ${paymentMethod === method.key ? 'text-teal-700' : 'text-slate-600'}`}>
                          {method.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              {selectedPlan && (
                <motion.button
                  initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileTap={{ scale: prefersReducedMotion ? 1 : 0.98 }}
                  transition={prefersReducedMotion ? {} : undefined}
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-morocco-royal to-morocco-emerald text-white font-bold hover:shadow-lg transition disabled:opacity-50"
                >
                  {loading ? (
                    <><Loader2 size={18} className="animate-spin" /> {t('promotion.processing')}</>
                  ) : (
                    <>
                      {t('promotion.payAmount', { amount: getPlanPrice(plans.find(p => p.tier === selectedPlan)) })}
                      <ArrowRight size={16} />
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
