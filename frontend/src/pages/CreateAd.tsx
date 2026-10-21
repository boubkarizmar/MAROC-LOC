import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Megaphone, Upload, X, Loader2, CheckCircle2, AlertCircle,
  ArrowLeft, DollarSign, Calendar, Link2, Type, FileText, Image as ImageIcon,
  CreditCard, Banknote, Smartphone, Sparkles, Building2, Package
} from 'lucide-react';
import { advertisementApi, BackendAdvertisementPlan } from '../api/advertisementApi';
import { propertyApi } from '../api/propertyApi';
import { Property } from '../types';
import { useToast } from '../components/ui/Toast';

const AD_TYPES = [
  { value: 'BANNER', labelKey: 'advertisement.adTypeBanner', descKey: 'advertisement.adTypeBannerDesc', icon: ImageIcon },
  { value: 'FEATURED', labelKey: 'advertisement.adTypeFeatured', descKey: 'advertisement.adTypeFeaturedDesc', icon: Sparkles },
  { value: 'SPONSOR', labelKey: 'advertisement.adTypeSponsor', descKey: 'advertisement.adTypeSponsorDesc', icon: Megaphone },
];

const PAYMENT_METHODS = [
  { key: 'cmi', label: 'CMI', icon: CreditCard },
  { key: 'stripe', label: 'Stripe / Carte', icon: CreditCard },
  { key: 'bank', labelKey: 'common.bankTransfer', label: 'Bank transfer', icon: Banknote },
  { key: 'cash', labelKey: 'common.cash', label: 'Cash', icon: Smartphone },
];

export const CreateAd: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'BANNER' | 'FEATURED' | 'SPONSOR'>('FEATURED');
  const [budget, setBudget] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cmi' | 'stripe' | 'bank' | 'cash'>('cmi');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // New fields required by backend
  const [plans, setPlans] = useState<BackendAdvertisementPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | ''>('');
  const [fetchingData, setFetchingData] = useState(true);

  // ==================== ✅ LOCAL DRAFT ====================
  const DRAFT_KEY = 'marocloc-draft-create-ad';

  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (parsed.title) setTitle(parsed.title);
      if (parsed.description) setDescription(parsed.description);
      if (parsed.type) setType(parsed.type);
      if (parsed.budget) setBudget(parsed.budget);
      if (parsed.targetUrl !== undefined) setTargetUrl(parsed.targetUrl);
      if (parsed.startDate) setStartDate(parsed.startDate);
      if (parsed.endDate) setEndDate(parsed.endDate);
      if (parsed.paymentMethod) setPaymentMethod(parsed.paymentMethod);
      if (parsed.selectedPlan) setSelectedPlan(parsed.selectedPlan);
      if (parsed.selectedPropertyId !== undefined) setSelectedPropertyId(parsed.selectedPropertyId);
      showToast(t('advertisement.draftRestored', 'Brouillon restauré automatiquement'), 'info');
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        title, description, type, budget, targetUrl, startDate, endDate,
        paymentMethod, selectedPlan, selectedPropertyId,
      }));
    }, 1000);
    return () => clearTimeout(timer);
  }, [title, description, type, budget, targetUrl, startDate, endDate, paymentMethod, selectedPlan, selectedPropertyId]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [plansRes, propsRes] = await Promise.all([
          advertisementApi.getPlans(),
          propertyApi.getMyProperties(0, 100),
        ]);
        setPlans(plansRes.data);
        if (plansRes.data.length > 0) setSelectedPlan(plansRes.data[0].name);
        const props = propsRes.data.content || propsRes.data || [];
        setProperties(props);
        if (props.length > 0) setSelectedPropertyId(props[0].id);
      } catch (err) {
        showToast(t('advertisement.errors.loading'), 'error');
      } finally {
        setFetchingData(false);
      }
    };
    loadData();
  }, []);

  const validate = (): boolean => {
    const errs: string[] = [];
    if (!title.trim()) errs.push(t('advertisement.errors.titleRequired'));
    if (!description.trim()) errs.push(t('advertisement.errors.descriptionRequired'));
    if (!selectedPlan) errs.push(t('advertisement.errors.planRequired'));
    if (!selectedPropertyId) errs.push(t('advertisement.errors.propertyRequired'));
    if (!budget || Number(budget) < 100) errs.push(t('advertisement.errors.budgetMin'));
    if (!startDate) errs.push(t('advertisement.errors.startDateRequired'));
    if (!endDate) errs.push(t('advertisement.errors.endDateRequired'));
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      errs.push(t('advertisement.errors.endDateAfterStart'));
    }
    setErrors(errs);
    return errs.length === 0;
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast(t('advertisement.errors.imageRequired'), 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast(t('advertisement.errors.imageSize'), 'error');
      return;
    }
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      let imageUrl: string | undefined;
      if (image) {
        imageUrl = await fileToBase64(image);
      }

      const payload = {
        title,
        description,
        type,
        plan: selectedPlan,
        propertyIds: [Number(selectedPropertyId)],
        propertyId: Number(selectedPropertyId),
        budget: Number(budget),
        startDate,
        endDate,
        currency: 'MAD',
        ...(imageUrl && { imageUrl }),
        ...(targetUrl && { targetUrl }),
      };

      if (paymentMethod === 'stripe') {
        const res = await advertisementApi.createCheckoutSession({
          plan: selectedPlan,
          propertyIds: [Number(selectedPropertyId)],
          durationMonths: 1,
          successUrl: `${window.location.origin}/payment/cmi/callback?status=success`,
          cancelUrl: `${window.location.origin}/payment/cmi/callback?status=cancel`,
        });
        if (res.data.checkoutUrl) {
          localStorage.removeItem(DRAFT_KEY);
          window.location.href = res.data.checkoutUrl;
          return;
        }
      }

      await advertisementApi.submitAdRequest(payload);
      localStorage.removeItem(DRAFT_KEY);
      showToast(t('advertisement.success'), 'success');
      navigate('/dashboard');
    } catch (err: any) {
      showToast(err.message || t('advertisement.errors.submitError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition mb-4"
          >
            <ArrowLeft size={16} />
            {t('advertisement.backToDashboard')}
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
              <Megaphone size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-50">
                {t('advertisement.title')}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                {t('advertisement.subtitle')}
              </p>
            </div>
          </div>
        </motion.div>

        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 p-4"
          >
            <div className="flex items-center gap-2 text-red-800 dark:text-red-300 font-semibold text-sm">
              <AlertCircle size={16} />
              {t('advertisement.errorsTitle')}
            </div>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              {errors.map((err, i) => (
                <li key={i} className="text-sm text-red-700 dark:text-red-400">{err}</li>
              ))}
            </ul>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type d'annonce */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-100 dark:border-slate-700"
          >
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2 mb-4">
              <Megaphone size={18} className="text-amber-500" />
              {t('advertisement.adType')}
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {AD_TYPES.map((adType) => {
                const Icon = adType.icon;
                const isSelected = type === adType.value;
                return (
                  <button
                    key={adType.value}
                    type="button"
                    onClick={() => setType(adType.value as any)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition text-left ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Icon size={24} className={isSelected ? 'text-teal-600' : 'text-slate-400'} />
                    <div className="text-center">
                      <p className={`text-sm font-semibold ${isSelected ? 'text-teal-700 dark:text-teal-400' : 'text-slate-700 dark:text-slate-300'}`}>
                        {t(adType.labelKey)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{t(adType.descKey)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Plan & Propriete */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-100 dark:border-slate-700"
          >
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2 mb-4">
              <Package size={18} className="text-amber-500" />
              {t('advertisement.plan')} & {t('advertisement.property')}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('advertisement.plan')} *</label>
                <select
                  value={selectedPlan}
                  onChange={e => setSelectedPlan(e.target.value)}
                  disabled={fetchingData}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-slate-100 focus:border-morocco-gold focus:ring-1 focus:ring-teal-500 outline-none transition"
                >
                  {plans.map(plan => (
                    <option key={plan.name} value={plan.name}>
                      {plan.displayName} — {(plan.amountMinorUnits / 100).toLocaleString()} DH
                    </option>
                  ))}
                </select>
                {selectedPlan && (
                  <p className="text-xs text-slate-500 mt-1">
                    {plans.find(p => p.name === selectedPlan)?.description}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('advertisement.property')} *</label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={selectedPropertyId}
                    onChange={e => setSelectedPropertyId(Number(e.target.value))}
                    disabled={fetchingData}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 pl-10 pr-4 py-3 text-slate-900 dark:text-slate-100 focus:border-morocco-gold focus:ring-1 focus:ring-teal-500 outline-none transition"
                  >
                    {properties.length === 0 && <option value="">{t('advertisement.noProperty')}</option>}
                    {properties.map(prop => (
                      <option key={prop.id} value={prop.id}>
                        {prop.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contenu */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-100 dark:border-slate-700"
          >
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2 mb-4">
              <Type size={18} className="text-amber-500" />
              {t('advertisement.content')}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('advertisement.titleLabel')} *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={t('advertisement.titlePlaceholder')}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-slate-100 focus:border-morocco-gold focus:ring-1 focus:ring-teal-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('advertisement.descriptionLabel')} *</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder={t('advertisement.descriptionPlaceholder')}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-slate-100 focus:border-morocco-gold focus:ring-1 focus:ring-teal-500 outline-none transition"
                />
              </div>
            </div>
          </motion.div>

          {/* Image upload */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-100 dark:border-slate-700"
          >
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2 mb-4">
              <ImageIcon size={18} className="text-amber-500" />
              {t('advertisement.visual')}
            </h2>
            {!imagePreview ? (
              <div
                onClick={() => fileRef.current?.click()}
                className="cursor-pointer rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 p-8 text-center hover:border-morocco-gold transition"
              >
                <Upload className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('advertisement.addImage')}</p>
                <p className="text-xs text-slate-400">{t('advertisement.imageFormats')}</p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-slate-200">
                <img src={imagePreview} alt={t('advertisement.preview', 'Preview')} className="w-full h-48 object-cover" />
                <button
                  type="button"
                  onClick={removeImage}
                  aria-label={t('a11y.removeImage')}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70 transition"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
            )}
          </motion.div>

          {/* Budget & Dates */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-100 dark:border-slate-700"
          >
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2 mb-4">
              <DollarSign size={18} className="text-amber-500" />
              {t('advertisement.budgetPeriod')}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('advertisement.budget')} *</label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    min="100"
                    value={budget}
                    onChange={e => setBudget(e.target.value)}
                    placeholder="1000"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 pl-10 pr-4 py-3 text-slate-900 dark:text-slate-100 focus:border-morocco-gold focus:ring-1 focus:ring-teal-500 outline-none transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('advertisement.targetUrl')}</label>
                <div className="relative">
                  <Link2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    value={targetUrl}
                    onChange={e => setTargetUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 pl-10 pr-4 py-3 text-slate-900 dark:text-slate-100 focus:border-morocco-gold focus:ring-1 focus:ring-teal-500 outline-none transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('advertisement.startDate')} *</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 pl-10 pr-4 py-3 text-slate-900 dark:text-slate-100 focus:border-morocco-gold focus:ring-1 focus:ring-teal-500 outline-none transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('advertisement.endDate')} *</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 pl-10 pr-4 py-3 text-slate-900 dark:text-slate-100 focus:border-morocco-gold focus:ring-1 focus:ring-teal-500 outline-none transition"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Payment method */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-100 dark:border-slate-700"
          >
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2 mb-4">
              <CreditCard size={18} className="text-amber-500" />
              {t('advertisement.paymentMethod')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.key}
                  type="button"
                  onClick={() => setPaymentMethod(method.key as any)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition ${
                    paymentMethod === method.key
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <method.icon size={18} className={paymentMethod === method.key ? 'text-teal-600' : 'text-slate-400'} />
                  <span className={`text-xs font-medium ${paymentMethod === method.key ? 'text-teal-700' : 'text-slate-600'}`}>
                    {method.labelKey ? t(method.labelKey, method.label) : method.label}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Submit */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-end"
          >
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-morocco-royal to-morocco-emerald text-white font-bold hover:opacity-90 transition disabled:opacity-50 shadow-md"
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> {t('advertisement.processing')}</>
              ) : (
                <><Megaphone size={18} /> {t('advertisement.submit')}</>
              )}
            </button>
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default CreateAd;
