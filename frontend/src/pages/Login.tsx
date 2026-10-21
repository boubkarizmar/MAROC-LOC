import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { fadeInUp, fadeInScale, staggerContainer, staggerItem, EASE, DURATION } from '../design-system/animations/motion';
import { RADIUS } from '../design-system/radius';
import { SHADOW } from '../design-system/shadows';

export const Login: React.FC = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();
  const { login } = useAuth();

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };
    switch (name) {
      case 'email':
        if (!value) newErrors.email = t('validation.required');
        else if (!/\S+@\S+\.\S+/.test(value)) newErrors.email = t('validation.email');
        else delete newErrors.email;
        break;
      case 'password':
        if (!value) newErrors.password = t('validation.required');
        else if (value.length < 6) newErrors.password = t('validation.password_min');
        else delete newErrors.password;
        break;
    }
    setErrors(newErrors);
  };

  const validateAll = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!formData.email) {
      newErrors.email = t('validation.required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('validation.email');
    }
    if (!formData.password) {
      newErrors.password = t('validation.required');
    } else if (formData.password.length < 6) {
      newErrors.password = t('validation.password_min');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    if (touched[name]) validateField(name, value);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(p => ({ ...p, [name]: true }));
    validateField(name, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    const isValid = validateAll();
    if (!isValid) return;

    setLoading(true);
    try {
      const response = await authApi.login(formData.email, formData.password);
      const data = response.data;
      login(data.accessToken, {
        id: data.userId,
        name: data.name,
        email: data.email,
        role: data.role as 'ADMIN' | 'LOCATAIRE' | 'PROPRIETAIRE',
      }, data.refreshToken);
      navigate('/home');
    } catch (err: any) {
      setErrors({ submit: err?.response?.data?.message || t('auth.login.error') });
    } finally {
      setLoading(false);
    }
  };

  const inputBase = `block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100`;
  const inputError = 'border-red-300 focus:ring-red-500';
  const inputSuccess = 'border-green-300 focus:ring-green-500';
  const inputDefault = 'border-slate-200 dark:border-slate-600';

  const getInputClass = (field: string) => {
    if (errors[field] && touched[field]) return `${inputBase} ${inputError}`;
    if (touched[field] && !errors[field] && formData[field as keyof typeof formData]) return `${inputBase} ${inputSuccess}`;
    return `${inputBase} ${inputDefault}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-20 px-4">
      <motion.div
        className={`w-full max-w-md bg-white dark:bg-slate-800 ${RADIUS.md} ${SHADOW.lg} border border-slate-100 dark:border-slate-700 p-8 space-y-6`}
        variants={fadeInScale}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div className="text-center" variants={staggerContainer} initial="hidden" animate="visible">
          <motion.div
            className="mx-auto w-16 h-16 bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl flex items-center justify-center mb-5 shadow-md"
            variants={staggerItem}
            whileHover={{ scale: 1.05, rotate: 3 }}
          >
            <img src="/images/logo.png" alt="MAROC-LOC" className="h-10 w-auto object-contain" />
          </motion.div>
          <motion.h1 variants={staggerItem} className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-1">
            {t('auth.login.title', 'Welcome back')}
          </motion.h1>
          <motion.p variants={staggerItem} className="text-slate-500 dark:text-slate-400">
            {t('auth.login.subtitle', 'Sign in to your account')}
          </motion.p>
        </motion.div>

        {/* Submit Error */}
        {errors.submit && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{errors.submit}</p>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {t('auth.login.email', 'Email')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                name="email" type="email" autoComplete="email" required
                value={formData.email} onChange={handleChange} onBlur={handleBlur}
                className={getInputClass('email')}
                placeholder={t('auth.login.emailPlaceholder', 'you@example.com')}
                dir="ltr"
              />
              {touched.email && !errors.email && formData.email && (
                <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
              )}
            </div>
            {errors.email && touched.email && (
              <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />{errors.email}
              </p>
            )}
          </motion.div>

          <motion.div variants={fadeInUp} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {t('auth.login.password', 'Password')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required
                value={formData.password} onChange={handleChange} onBlur={handleBlur}
                className={`${getInputClass('password')} pr-12`}
                placeholder={t('auth.login.passwordPlaceholder', '••••••••')}
                dir="ltr"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && touched.password && (
              <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />{errors.password}
              </p>
            )}
          </motion.div>

          <motion.div variants={fadeInUp} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
            <motion.button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold rounded-xl text-white bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <><Loader className="animate-spin h-5 w-5" />{t('auth.login.loading', 'Signing in...')}</>
              ) : (
                t('auth.login.submit', 'Sign in')
              )}
            </motion.button>
          </motion.div>
        </form>

        {/* Footer */}
        <motion.p
          className="text-center text-slate-600 dark:text-slate-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {t('auth.login.noAccount', "Don't have an account?")}{' '}
          <Link to="/register" className="font-medium text-teal-600 hover:text-teal-700 transition-colors">
            {t('auth.login.registerLink', 'Sign up')}
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
};
