import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { authApi, RegisterPayload } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Phone, Eye, EyeOff, AlertTriangle, CheckCircle2, User, MapPin, Loader, UserPlus } from 'lucide-react';

const cities = [
  'Casablanca', 'Rabat', 'Marrakech', 'Fes', 'Tangier', 'Agadir', 'Meknes', 'Oujda', 'Kenitra',
  'Tetouan', 'Safi', 'El Jadida', 'Nador', 'Khenifra', 'Berrechid', 'Taza', 'Settat',
  'Khouribga', 'Beni Mellal', 'Larache', 'Inezgane', 'Ouarzazate', 'Tata', 'Tan-Tan', 'Other',
];

const namePattern = /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ '\-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/;
const phonePattern = /^(?:\+212|0)(?:6|7)\d{8}$/;
const emailPattern = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&*!?&]).{8,}$/;

// Liste élargie des emails jetables
const disposableDomains = new Set([
  'mailinator.com',
  '10minutemail.com',
  'tempmail.com',
  'trashmail.com',
  'dispostable.com',
  'yopmail.com',
  'guerrillamail.com',
  'maildrop.cc',
  'fakeinbox.com',
  'throwaway.email',
  'temp-mail.org',
  'guerrillamail.net',
  'mailnator.com',
  'tempemail.net',
  'throwawaymail.com',
  'spamgourmet.com',
  'trash2009.com',
  'mt2009.com',
  'trashymail.com',
  'mailmetrash.com',
]);

const getCityOptions = () => cities;

// Composant pour l'indicateur de force du mot de passe
const PasswordStrengthIndicator: React.FC<{ password: string; t: any }> = ({ password, t }) => {
  const strength = useMemo(() => {
    const checks = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /\d/.test(password),
      /[@#$%^&*!?&]/.test(password),
    ];
    const score = checks.filter(Boolean).length;
    if (score < 3) {
      return { score, label: t('password.weak', 'Weak'), color: 'bg-rose-500', width: '20%' };
    }
    if (score < 5) {
      return { score, label: t('password.fair', 'Fair'), color: 'bg-amber-400', width: '60%' };
    }
    return { score, label: t('password.strong', 'Strong'), color: 'bg-emerald-500', width: '100%' };
  }, [password, t]);

  if (!password) return null;

  return (
    <div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('password.strength', 'Password strength')}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">{strength.label}</p>
        </div>
        <div className="h-2 w-36 overflow-hidden rounded-full bg-gray-200">
          <div
            className={`${strength.color} h-2 rounded-full transition-all duration-300`}
            style={{ width: strength.width }}
          />
        </div>
      </div>
    </div>
  );
};

export const Register: React.FC = () => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    fullName: '',
    city: '',
    otherCity: '',
    phone: '',
    email: '',
    password: '',
    type: 'LOCATAIRE' as 'LOCATAIRE' | 'PROPRIETAIRE',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fullNameEdited, setFullNameEdited] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Auto-génération du nom complet
  useEffect(() => {
    if (!fullNameEdited) {
      const generated = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
      setFormData((prev) => ({ ...prev, fullName: generated }));
    }
  }, [formData.firstName, formData.lastName, fullNameEdited]);

  const actualCity = formData.city === 'Other' ? formData.otherCity.trim() : formData.city;

  // Validation du formulaire
  const validateForm = useCallback(() => {
    const nextErrors: Record<string, string> = {};
    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();
    const fullName = formData.fullName.trim();
    const email = formData.email.trim();
    const phone = formData.phone.trim();
    const city = actualCity;

    // Prénom
    if (!firstName) {
      nextErrors.firstName = t('validation.required', 'This field is required');
    } else if (firstName.length < 2) {
      nextErrors.firstName = t('validation.firstName_min', 'First name must contain at least 2 letters');
    } else if (!namePattern.test(firstName)) {
      nextErrors.firstName = t('validation.firstName_invalid', 'First name may only include letters, spaces, apostrophes or hyphens');
    }

    // Nom
    if (!lastName) {
      nextErrors.lastName = t('validation.required', 'This field is required');
    } else if (lastName.length < 2) {
      nextErrors.lastName = t('validation.lastName_min', 'Last name must contain at least 2 letters');
    } else if (!namePattern.test(lastName)) {
      nextErrors.lastName = t('validation.lastName_invalid', 'Last name may only include letters, spaces, apostrophes or hyphens');
    }

    // Nom complet
    if (!fullName) {
      nextErrors.fullName = t('validation.required', 'This field is required');
    } else if (fullName.length < 5) {
      nextErrors.fullName = t('validation.fullName_min', 'Full name must be at least 5 characters');
    } else if (!fullName.toLowerCase().includes(firstName.toLowerCase()) ||
               !fullName.toLowerCase().includes(lastName.toLowerCase())) {
      nextErrors.fullName = t('validation.fullName_mismatch', 'Full name must include both first and last name');
    }

    // Ville
    if (!city) {
      nextErrors.city = t('validation.required', 'This field is required');
    } else if (formData.city === 'Other' && city.length < 2) {
      nextErrors.city = t('validation.city_invalid', 'Please enter a valid city name');
    }

    // Téléphone
    if (!phone) {
      nextErrors.phone = t('validation.required', 'This field is required');
    } else if (!phonePattern.test(phone)) {
      nextErrors.phone = t('validation.phone_invalid', 'Phone must be a valid Moroccan number (+2126 or 06...)');
    }

    // Email
    if (!email) {
      nextErrors.email = t('validation.required', 'This field is required');
    } else if (!emailPattern.test(email)) {
      nextErrors.email = t('validation.email_invalid', 'Enter a valid email address');
    } else {
      const domain = email.split('@')[1]?.toLowerCase() || '';
      if (disposableDomains.has(domain)) {
        nextErrors.email = t('validation.email_disposable', 'Disposable email addresses are not allowed');
      }
    }

    // Mot de passe
    if (!formData.password) {
      nextErrors.password = t('validation.required', 'This field is required');
    } else if (!passwordPattern.test(formData.password)) {
      nextErrors.password = t('validation.password_weak', 'Password must include upper and lower letters, a number, and a special character');
    }

    // Type d'utilisateur
    if (!formData.type) {
      nextErrors.type = t('validation.required', 'This field is required');
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [formData, actualCity, t]);

  // Validation en temps réel
  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      validateForm();
    }
  }, [formData, touched, validateForm]);

  // Vérification si le formulaire est valide
  const isFormValid = useMemo(() => {
    const hasRequiredFields = Boolean(
      formData.firstName.trim() &&
      formData.lastName.trim() &&
      formData.fullName.trim() &&
      formData.city &&
      formData.phone.trim() &&
      formData.email.trim() &&
      formData.password &&
      formData.type
    );

    const hasValidCity = formData.city !== 'Other' || formData.otherCity.trim();
    const hasNoErrors = Object.keys(errors).length === 0;

    return hasRequiredFields && hasValidCity && hasNoErrors;
  }, [formData, errors]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value } as typeof prev));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleCityChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = event.target;
    setFormData((prev) => ({
      ...prev,
      city: value,
      otherCity: value === 'Other' ? prev.otherCity : '',
    }));
  };

  // const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
  //   event.preventDefault();

  //   // Empêcher les doubles soumissions
  //   if (isSubmitting || loading) return;

  //   setGeneralError('');
  //   setSuccessMessage('');
  //   setErrors({});

  //   // Marquer tous les champs comme touchés
  //   const allTouched = {
  //     firstName: true,
  //     lastName: true,
  //     fullName: true,
  //     city: true,
  //     phone: true,
  //     email: true,
  //     password: true,
  //     type: true,
  //   };
  //   setTouched(allTouched);

  //   if (!validateForm()) {
  //     setGeneralError(t('register.fix_errors', 'Please fix the highlighted fields'));
  //     return;
  //   }

  //   const payload: RegisterPayload = {
  //     firstName: formData.firstName.trim(),
  //     lastName: formData.lastName.trim(),
  //     fullName: formData.fullName.trim(),
  //     city: actualCity,
  //     phone: formData.phone.trim(),
  //     email: formData.email.trim().toLowerCase(),
  //     password: formData.password,
  //     role: formData.type,
  //   };

  //   console.log('Register payload:', payload);
  //   setLoading(true);
  //   setIsSubmitting(true);

  //   try {
  //     const response = await authApi.register(payload);
  //     login(response.data.token, {
  //       id: response.data.userId,
  //       name: response.data.name,
  //       email: response.data.email,
  //       role: response.data.role as 'ADMIN' | 'LOCATAIRE' | 'PROPRIETAIRE',
  //     });
  //     setSuccessMessage(t('register.success', 'Registration successful. Redirecting to dashboard...'));
  //     setTimeout(() => navigate('/home'), 1200);
  //   } catch (err: any) {
  //     // Gestion des erreurs réseau
  //     if (err?.code === 'ECONNABORTED' || err?.message?.includes('Network Error') || err?.message?.includes('fetch')) {
  //       setGeneralError(t('register.network_error', 'Network error. Please check your connection.'));
  //     } else {
  //       const responseData = err?.response?.data;
  //       if (responseData?.errors && typeof responseData.errors === 'object') {
  //         setErrors(responseData.errors as Record<string, string>);
  //         setGeneralError(t('register.correct_fields', 'Please correct the highlighted registration fields'));
  //       } else if (responseData?.message) {
  //         setGeneralError(responseData.message);
  //       } else if (responseData?.error) {
  //         setGeneralError(responseData.error);
  //       } else {
  //         setGeneralError(t('register.failed', 'Registration failed. Please try again'));
  //       }
  //     }
  //   } finally {
  //     setLoading(false);
  //     setIsSubmitting(false);
  //   }
  // };
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  if (isSubmitting || loading) return;

  setGeneralError('');
  setSuccessMessage('');
  setErrors({});

  const allTouched = {
    firstName: true,
    lastName: true,
    fullName: true,
    city: true,
    phone: true,
    email: true,
    password: true,
    type: true,
  };
  setTouched(allTouched);

  if (!validateForm()) {
    setGeneralError(t('register.fix_errors', 'Please fix the highlighted fields'));
    return;
  }

  const payload: RegisterPayload = {
    firstName: formData.firstName.trim(),
    lastName: formData.lastName.trim(),
    fullName: formData.fullName.trim(),
    city: actualCity,
    phone: formData.phone.trim(),
    email: formData.email.trim().toLowerCase(),
    password: formData.password,
    role: formData.type,
  };

  if (import.meta.env.DEV) {
    console.log('Register payload:', payload);
  }
  setLoading(true);
  setIsSubmitting(true);

  try {
    const response = await authApi.register(payload);
    // ✅ CORRECTION ICI : response.data.accessToken au lieu de response.data.token
    login(response.data.accessToken, {
      id: response.data.userId,
      name: response.data.name,
      email: response.data.email,
      role: response.data.role as 'ADMIN' | 'LOCATAIRE' | 'PROPRIETAIRE',
    }, response.data.refreshToken);
    setSuccessMessage(t('register.success', 'Registration successful. Redirecting to dashboard...'));
    setTimeout(() => navigate('/home'), 1200);
  } catch (err: any) {
    if (err?.code === 'ECONNABORTED' || err?.message?.includes('Network Error') || err?.message?.includes('fetch')) {
      setGeneralError(t('register.network_error', 'Network error. Please check your connection.'));
    } else {
      const responseData = err?.response?.data;
      if (responseData?.errors && typeof responseData.errors === 'object') {
        setErrors(responseData.errors as Record<string, string>);
        setGeneralError(t('register.correct_fields', 'Please correct the highlighted registration fields'));
      } else if (responseData?.message) {
        setGeneralError(responseData.message);
      } else if (responseData?.error) {
        setGeneralError(responseData.error);
      } else {
        setGeneralError(t('register.failed', 'Registration failed. Please try again'));
      }
    }
  } finally {
    setLoading(false);
    setIsSubmitting(false);
  }
};

  // Liste des règles de mot de passe
  const passwordRules = [
    { rule: t('password.chars', '8+ chars'), check: formData.password.length >= 8 },
    { rule: t('password.uppercase', 'Uppercase'), check: /[A-Z]/.test(formData.password) },
    { rule: t('password.lowercase', 'Lowercase'), check: /[a-z]/.test(formData.password) },
    { rule: t('password.number', 'Number'), check: /\d/.test(formData.password) },
    { rule: t('password.special', 'Special'), check: /[@#$%^&*!?&]/.test(formData.password) },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-20 px-4">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 p-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl flex items-center justify-center mb-5 shadow-md">
            <img src="/images/logo.png" alt="MAROC-LOC" className="h-10 w-auto object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-1">
            {t('register.title', 'Create your account')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {t('register.subtitle', 'Join MAROC-LOC and start your journey')}
          </p>
        </div>

        {/* Error Alert */}
        {generalError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3" role="alert">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{generalError}</p>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-start gap-3" role="alert">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700 dark:text-green-300">{successMessage}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Name Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('register.firstName', 'First Name')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  value={formData.firstName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 ${
                    errors.firstName && touched.firstName
                      ? 'border-red-300 focus:ring-red-500'
                      : touched.firstName && !errors.firstName && formData.firstName
                      ? 'border-green-300 focus:ring-green-500'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                  placeholder={t('register.firstNamePlaceholder', 'Mohammed')}
                  aria-invalid={!!errors.firstName}
                  aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                  disabled={isSubmitting}
                />
                {touched.firstName && !errors.firstName && formData.firstName && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
              {errors.firstName && touched.firstName && (
                <p id="firstName-error" className="mt-2 text-sm text-red-600 flex items-center gap-1" role="alert">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.firstName}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('register.lastName', 'Last Name')} *
              </label>
              <div className="relative">
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  value={formData.lastName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`block w-full px-3 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 ${
                    errors.lastName && touched.lastName
                      ? 'border-red-300 focus:ring-red-500'
                      : touched.lastName && !errors.lastName && formData.lastName
                      ? 'border-green-300 focus:ring-green-500'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                  placeholder={t('register.lastNamePlaceholder', 'Ali')}
                  aria-invalid={!!errors.lastName}
                  aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                  disabled={isSubmitting}
                />
                {touched.lastName && !errors.lastName && formData.lastName && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
              {errors.lastName && touched.lastName && (
                <p id="lastName-error" className="mt-2 text-sm text-red-600 flex items-center gap-1" role="alert">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.lastName}
                </p>
              )}
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('register.fullName', 'Full Name')} *
            </label>
            <div className="relative">
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                value={formData.fullName}
                onChange={(e) => {
                  setFullNameEdited(true);
                  handleChange(e);
                }}
                onBlur={handleBlur}
                className={`block w-full px-3 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 ${
                  errors.fullName && touched.fullName
                    ? 'border-red-300 focus:ring-red-500'
                    : touched.fullName && !errors.fullName && formData.fullName
                    ? 'border-green-300 focus:ring-green-500'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
                placeholder={t('register.fullNamePlaceholder', 'Mohammed Ali')}
                aria-invalid={!!errors.fullName}
                aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                disabled={isSubmitting}
              />
              {touched.fullName && !errors.fullName && formData.fullName && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
              {t('register.fullNameHint', 'Auto-generated from first and last name, but you may adjust it')}
            </p>
            {errors.fullName && touched.fullName && (
              <p id="fullName-error" className="mt-2 text-sm text-red-600 flex items-center gap-1" role="alert">
                <AlertTriangle className="w-4 h-4" />
                {errors.fullName}
              </p>
            )}
          </div>

          {/* City and User Type */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('register.city', 'City')} *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
                <select
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleCityChange}
                  onBlur={handleBlur}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 ${
                    errors.city && touched.city
                      ? 'border-red-300 focus:ring-red-500'
                      : touched.city && !errors.city && formData.city
                      ? 'border-green-300 focus:ring-green-500'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                  aria-invalid={!!errors.city}
                  aria-describedby={errors.city ? 'city-error' : undefined}
                  disabled={isSubmitting}
                >
                  <option value="">{t('register.selectCity', 'Select a city')}</option>
                  {getCityOptions().map((cityOption) => (
                    <option key={cityOption} value={cityOption}>{cityOption}</option>
                  ))}
                </select>
              </div>
              {formData.city === 'Other' && (
                <input
                  type="text"
                  name="otherCity"
                  value={formData.otherCity}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="mt-3 block w-full px-3 py-3 border border-slate-300 dark:border-slate-600 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                  placeholder={t('register.enterCity', 'Enter your city')}
                  disabled={isSubmitting}
                />
              )}
              {errors.city && touched.city && (
                <p id="city-error" className="mt-2 text-sm text-red-600 flex items-center gap-1" role="alert">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.city}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('register.userType', 'User Type')} *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`block w-full px-3 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 ${
                  errors.type && touched.type
                    ? 'border-red-300 focus:ring-red-500'
                    : touched.type && !errors.type
                    ? 'border-green-300 focus:ring-green-500'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
                aria-invalid={!!errors.type}
                aria-describedby={errors.type ? 'type-error' : undefined}
                disabled={isSubmitting}
              >
                <option value="LOCATAIRE">{t('register.locataire', 'Locataire')}</option>
                <option value="PROPRIETAIRE">{t('register.proprietaire', 'Propriétaire')}</option>
              </select>
              {errors.type && touched.type && (
                <p id="type-error" className="mt-2 text-sm text-red-600 flex items-center gap-1" role="alert">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.type}
                </p>
              )}
            </div>
          </div>

          {/* Phone and Email */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('register.phone', 'Phone')} *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 ${
                    errors.phone && touched.phone
                      ? 'border-red-300 focus:ring-red-500'
                      : touched.phone && !errors.phone && formData.phone
                      ? 'border-green-300 focus:ring-green-500'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                  placeholder={t('register.phonePlaceholder', '+2126XXXXXXXX or 06XXXXXXXX or +2127XXXXXXXX or 07XXXXXXXX')}
                  dir="ltr"
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                  disabled={isSubmitting}
                />
                {touched.phone && !errors.phone && formData.phone && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
              {errors.phone && touched.phone && (
                <p id="phone-error" className="mt-2 text-sm text-red-600 flex items-center gap-1" role="alert">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.phone}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('register.email', 'Email')} *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 ${
                    errors.email && touched.email
                      ? 'border-red-300 focus:ring-red-500'
                      : touched.email && !errors.email && formData.email
                      ? 'border-green-300 focus:ring-green-500'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                  placeholder={t('register.emailPlaceholder', 'you@example.com')}
                  dir="ltr"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  disabled={isSubmitting}
                />
                {touched.email && !errors.email && formData.email && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
              {errors.email && touched.email && (
                <p id="email-error" className="mt-2 text-sm text-red-600 flex items-center gap-1" role="alert">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('register.password', 'Password')} *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400 dark:text-slate-500" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`block w-full pl-10 pr-12 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 ${
                  errors.password && touched.password
                    ? 'border-red-300 focus:ring-red-500'
                    : touched.password && !errors.password && formData.password
                    ? 'border-green-300 focus:ring-green-500'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
                placeholder={t('register.passwordPlaceholder', 'Create a strong password')}
                dir="ltr"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? t('register.hidePassword', 'Hide password') : t('register.showPassword', 'Show password')}
                disabled={isSubmitting}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-400" />
                ) : (
                  <Eye className="h-5 w-5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-400" />
                )}
              </button>
            </div>

            {/* Password Requirements */}
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {passwordRules.map(({ rule, check }) => (
                <div key={rule} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className={check ? 'text-green-600' : 'text-slate-400 dark:text-slate-500'}>
                    {check ? '✓' : '○'}
                  </span>
                  <span>{rule}</span>
                </div>
              ))}
            </div>

            {/* Password Strength Indicator */}
            <PasswordStrengthIndicator password={formData.password} t={t} />

            {errors.password && touched.password && (
              <p id="password-error" className="mt-2 text-sm text-red-600 flex items-center gap-1" role="alert">
                <AlertTriangle className="w-4 h-4" />
                {errors.password}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || loading}
            className={`w-full flex items-center justify-center px-6 py-3 text-base font-medium rounded-xl text-white transition-all duration-200 shadow-lg ${
              isFormValid && !isSubmitting && !loading
                ? 'bg-gradient-to-r from-morocco-royal via-morocco-emerald to-morocco-atlas hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer'
                : 'bg-gray-300 cursor-not-allowed opacity-50'
            }`}
            aria-describedby={isSubmitting || loading ? 'loading-status' : undefined}
          >
            {isSubmitting || loading ? (
              <>
                <Loader className="animate-spin -ml-1 mr-3 h-5 w-5" />
                <span id="loading-status">{t('register.loading', 'Creating account...')}</span>
              </>
            ) : (
              t('register.submit', 'Create account')
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400">
            {t('register.hasAccount', 'Already have an account?')}{' '}
            <Link
              to="/login"
              className="font-medium text-teal-600 hover:text-teal-600 transition-colors"
            >
              {t('register.loginLink', 'Sign in')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
