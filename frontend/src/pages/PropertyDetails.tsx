import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Property, Review } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { useSimilarProperties } from '../hooks/useRecommendations';
import { usePropertyComparison } from '../hooks/usePropertyComparison';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { propertyApi } from '../api/propertyApi';
import { messageApi } from '../api/messageApi';
import { favoriteApi } from '../api/favoriteApi';
import { reviewApi } from '../api/reviewApi';
import { visitApi } from '../api/visitApi';
import { propertyTransactionApi } from '../api/propertyTransactionApi';
import { PropertyFeatures } from '../components/PropertyFeatures';
import { PropertyCard } from '../components/PropertyCard';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { fixMediaUrl, getAllImages, getVideoUrl } from '../utils/imageUtils';
import { safeParseId } from '../utils/validation';
import {
  MapPin, User, Calendar, Phone, MessageCircle,
  CheckCircle, Heart, Share2, Eye, ArrowLeft, ChevronLeft,
  ChevronRight, Star, Shield, Wifi, Car, Waves, Wind,
  Bed, Bath, Home, Building, TreePine, Tag,
  X, Maximize2, Play, Pause, Volume2, VolumeX, Crown, Sparkles, Users, ArrowRight,
  Send, Mail, Clock, CheckCheck, Award, TrendingUp, ThumbsUp, MessageSquare,
  CreditCard, Scale, Info
} from 'lucide-react';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 0,
  }).format(price || 0);

const getFinalPrice = (property: Property) =>
  property.price + (property.additionalFees || 0) - (property.price * (property.discountPercentage || 0)) / 100;

// ===== Composant Modal pour la galerie plein écran =====
const FullscreenGallery: React.FC<{
  images: string[];
  videos: string[];
  initialIndex: number;
  onClose: () => void;
}> = ({ images, videos, initialIndex, onClose }) => {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const totalMedia = images.length + videos.length;

  const handlePrev = () => setCurrentIndex((prev) => (prev === 0 ? totalMedia - 1 : prev - 1));
  const handleNext = () => setCurrentIndex((prev) => (prev === totalMedia - 1 ? 0 : prev + 1));

  const isVideo = currentIndex >= images.length;
  const currentVideo = isVideo ? videos[currentIndex - images.length] : null;
  const currentImage = !isVideo ? images[currentIndex] : null;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, onClose]);

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0 }}
      transition={prefersReducedMotion ? {} : undefined}
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <button onClick={onClose} aria-label={t('common.close')} className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition">
        <X size={24} aria-hidden="true" />
      </button>
      <button onClick={handlePrev} aria-label={t('a11y.previousImage')} className="absolute left-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition">
        <ChevronLeft size={32} aria-hidden="true" />
      </button>
      <button onClick={handleNext} aria-label={t('a11y.nextImage')} className="absolute right-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition">
        <ChevronRight size={32} aria-hidden="true" />
      </button>

      <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
        {isVideo && currentVideo ? (
          <div className="relative">
            <video
              src={fixMediaUrl(currentVideo)}
              controls
              autoPlay={isPlaying}
              muted={isMuted}
              className="max-h-[85vh] max-w-[85vw] rounded-lg"
            />
            <div className="absolute bottom-4 right-4 flex gap-2">
              <button onClick={() => setIsPlaying(!isPlaying)} aria-label={isPlaying ? t('a11y.pause') : t('a11y.play')} className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition">
                {isPlaying ? <Pause size={20} aria-hidden="true" /> : <Play size={20} aria-hidden="true" />}
              </button>
              <button onClick={() => setIsMuted(!isMuted)} aria-label={isMuted ? t('a11y.unmute') : t('a11y.mute')} className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition">
                {isMuted ? <VolumeX size={20} aria-hidden="true" /> : <Volume2 size={20} aria-hidden="true" />}
              </button>
            </div>
          </div>
        ) : (
          <img src={fixMediaUrl(currentImage)} alt={t('property.image', 'Image')} className="max-h-[85vh] max-w-[85vw] object-contain rounded-lg" onError={(e) => { (e.target as HTMLImageElement).src = '/images/no-image.svg'; }} loading="lazy" />
        )}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
          {currentIndex + 1} / {totalMedia}
        </div>
      </div>
    </motion.div>
  );
};

// ===== Composant Modal pour envoyer un message =====
const MessageModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (message: string) => void;
  recipientName: string;
  isLoading: boolean;
}> = ({ isOpen, onClose, onSubmit, recipientName, isLoading }) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSubmit(message);
      setMessage('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-morocco-royal to-morocco-emerald p-4">
          <h3 className="text-white font-bold text-lg">{t('property.details.sendMessage')}</h3>
          <p className="text-white/80 text-sm">{t('property.details.messageTo', 'To: {{name}}', { name: recipientName })}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('property.details.messagePlaceholder', 'Your message...')}
            rows={4}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-slate-700 dark:text-slate-200 focus:border-morocco-gold focus:ring-1 focus:ring-morocco-gold outline-none transition"
            required
          />

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading || !message.trim()}
              className="flex-1 bg-morocco-royal text-white px-4 py-2 rounded-xl font-semibold hover:bg-morocco-royal/80 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Send size={16} />
                  {t('common.send')}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// ===== Composant pour sélectionner une note en étoiles =====
const StarRatingInput: React.FC<{
  value: number;
  onChange: (value: number) => void;
  size?: number;
}> = ({ value, onChange, size = 28 }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110 focus:outline-none"
        >
          <Star
            size={size}
            className={`transition-colors ${
              star <= (hover || value)
                ? 'text-morocco-gold fill-morocco-gold'
                : 'text-slate-300 dark:text-slate-600'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

// ===== Composant Modal pour planifier une visite =====
const VisitScheduleModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { visitDate: string; visitTime: string; visitorName: string; visitorPhone: string; visitorEmail: string; notes: string }) => void;
  isLoading: boolean;
}> = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    visitDate: '',
    visitTime: '',
    visitorName: '',
    visitorPhone: '',
    visitorEmail: '',
    notes: '',
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.visitDate && form.visitTime && form.visitorName && form.visitorPhone) {
      onSubmit(form);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-slate-700 dark:text-slate-200 focus:border-morocco-gold focus:ring-1 focus:ring-morocco-gold outline-none transition';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-morocco-emerald to-morocco-royal p-4">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <Calendar size={20} />
            {t('property.details.scheduleVisit')}
          </h3>
          <p className="text-white/80 text-sm">{t('property.details.scheduleVisitSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{t('booking.scheduleVisit.date')} *</label>
              <input type="date" name="visitDate" value={form.visitDate} onChange={handleChange} className={inputClass} required min={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{t('booking.scheduleVisit.time')} *</label>
              <input type="time" name="visitTime" value={form.visitTime} onChange={handleChange} className={inputClass} required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{t('booking.scheduleVisit.fullName')} *</label>
            <input type="text" name="visitorName" value={form.visitorName} onChange={handleChange} placeholder={t('register.fullNamePlaceholder')} className={inputClass} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{t('booking.scheduleVisit.phone')} *</label>
            <input type="tel" name="visitorPhone" value={form.visitorPhone} onChange={handleChange} placeholder={t('register.phonePlaceholder')} className={inputClass} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{t('booking.scheduleVisit.email')}</label>
            <input type="email" name="visitorEmail" value={form.visitorEmail} onChange={handleChange} placeholder={t('auth.login.emailPlaceholder')} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{t('common.notes')}</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} placeholder={t('booking.scheduleVisit.notesPlaceholder', 'Additional comments...')} rows={2} className={inputClass} />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-morocco-emerald text-white px-4 py-2 rounded-xl font-semibold hover:bg-morocco-emerald/80 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <CheckCircle size={16} />
                  {t('common.confirm')}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const TrustBadges: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      <div className="flex items-center gap-2 rounded-xl bg-morocco-beige/40 dark:bg-slate-800/60 px-3 py-2">
        <Shield size={16} className="text-morocco-emerald" />
        <span className="text-xs font-medium dark:text-slate-300">{t('property.details.verifiedBadge')}</span>
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-morocco-beige/40 dark:bg-slate-800/60 px-3 py-2">
        <Crown size={16} className="text-morocco-gold" />
        <span className="text-xs font-medium dark:text-slate-300">{t('property.details.premiumBadge')}</span>
      </div>
    </div>
  );
};

export const PaymentModal = React.lazy(() =>
  import('../components/payment/PaymentModal').then((m) => ({ default: m.PaymentModal }))
);

export const PropertyDetails: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showFullGallery, setShowFullGallery] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageSent, setMessageSent] = useState(false);

  // Payment / reservation states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentDescription, setPaymentDescription] = useState('');
  const [paymentOrderId, setPaymentOrderId] = useState('');
  const [paymentTransactionType, setPaymentTransactionType] = useState<'RESERVATION' | 'PURCHASE'>('RESERVATION');

  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [showRahnModal, setShowRahnModal] = useState(false);

  // Review form states
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Visit modal states
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [visitSubmitting, setVisitSubmitting] = useState(false);
  const [visitSuccess, setVisitSuccess] = useState(false);

  const propertyId = safeParseId(id);
  const { addToCompare, removeFromCompare, isInCompare, canAddMore } = usePropertyComparison();
  const { addToRecentlyViewed } = useRecentlyViewed();
  const { data: similarProperties } = useSimilarProperties(propertyId, 6);

  useEffect(() => {
    if (propertyId !== null) {
      loadProperty(propertyId);
      loadReviews(propertyId);
      loadAverageRating(propertyId);
      if (isAuthenticated) {
        favoriteApi.check(propertyId)
          .then(res => setIsFavorite(res.data))
          .catch(() => {});
      }
    }
    window.scrollTo(0, 0);
  }, [propertyId]);

  const loadProperty = async (propertyId: number) => {
    try {
      const response = await propertyApi.getById(propertyId);
      setProperty(response.data);
      if (response.data) {
        addToRecentlyViewed(response.data);
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Failed to load property');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async (propertyId: number) => {
    try {
      const response = await reviewApi.getByProperty(propertyId);
      setReviews(response.data);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Failed to load reviews');
      }
    }
  };

  const loadAverageRating = async (propertyId: number) => {
    try {
      const response = await reviewApi.getAverage(propertyId);
      setAverageRating(response.data);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Failed to load average rating');
      }
    }
  };

  const handleFavorite = async () => {
    if (!property) return;
    try {
      if (isFavorite) {
        await favoriteApi.remove(property.id);
        setIsFavorite(false);
      } else {
        await favoriteApi.add(property.id);
        setIsFavorite(true);
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Favorite toggle failed:', err);
      }
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: property?.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        showToast(t('property.details.linkCopied', 'Link copied to clipboard'), 'success');
      }
    } catch {
      // User cancelled share or clipboard failed — no toast needed
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!property?.ownerId) {
      if (import.meta.env.DEV) {
        console.error('Propriétaire inconnu');
      }
      return;
    }
    setSendingMessage(true);
    try {
      await messageApi.send({
        receiverId: property.ownerId,
        content: message,
        propertyId: property.id
      });
      // Keep a client-side conversation index for the inbox fallback
      import('../utils/conversationStore').then(({ conversationStore }) => {
        conversationStore.save({
          partnerId: property.ownerId,
          partnerName: property.ownerName || `User ${property.ownerId}`,
          propertyId: property.id,
          propertyTitle: property.title,
          lastMessage: message,
          lastMessageDate: new Date().toISOString(),
          unreadCount: 0,
        });
      });
      setMessageSent(true);
      setTimeout(() => setMessageSent(false), 3000);
      setShowMessageModal(false);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Erreur lors de l\'envoi du message', error);
      }
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId || reviewRating === 0) return;
    setReviewSubmitting(true);
    try {
      await reviewApi.create(propertyId, { rating: reviewRating, comment: reviewComment });
      setReviewSuccess(true);
      setReviewRating(0);
      setReviewComment('');
      loadReviews(propertyId);
      loadAverageRating(propertyId);
      setTimeout(() => setReviewSuccess(false), 4000);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Failed to submit review:', err);
      }
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleScheduleVisit = async (data: {
    visitDate: string;
    visitTime: string;
    visitorName: string;
    visitorPhone: string;
    visitorEmail: string;
    notes: string;
  }) => {
    if (!propertyId) return;
    setVisitSubmitting(true);
    try {
      await visitApi.schedule({ ...data, propertyId });
      setVisitSuccess(true);
      setShowVisitModal(false);
      setTimeout(() => setVisitSuccess(false), 4000);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Failed to schedule visit:', err);
      }
    } finally {
      setVisitSubmitting(false);
    }
  };

  const openTransactionFlow = async (type: 'RESERVATION' | 'PURCHASE') => {
    if (!isAuthenticated || !propertyId) {
      navigate('/login');
      return;
    }
    if (isCurrentUserOwner) {
      showToast(t('property.details.cannotTransactOwn', 'You cannot reserve your own property'), 'warning');
      return;
    }
    if (!isActiveForTransaction) {
      showToast(t('property.details.notAvailableForTransaction', 'This property is not available for transaction'), 'warning');
      return;
    }
    try {
      const response = type === 'RESERVATION'
          ? await propertyTransactionApi.reserve(propertyId)
          : await propertyTransactionApi.buy(propertyId);
      setPaymentAmount(Number(response.amount));
      setPaymentOrderId(response.orderId);
      setPaymentTransactionType(type);
      setPaymentDescription(
          `${type === 'RESERVATION' ? t('property.details.reserve') : t('property.details.buy')} — ${property?.title || ''}`
      );
      setShowPaymentModal(true);
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error(`Failed to initiate ${type}:`, err);
      }
      showToast(err?.message || t('payment.initError'), 'error');
    }
  };

  if (propertyId === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
        <Home size={64} className="text-slate-400" />
        <p className="text-xl text-slate-600 dark:text-slate-400">{t('property.errors.notFound', 'Property not found')}</p>
        <button
          onClick={() => navigate('/home')}
          className="rounded-full bg-morocco-royal px-6 py-3 text-white hover:bg-morocco-royal/80 transition shadow-lg"
        >
          {t('common.back', 'Retour à l\'accueil')}
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
        <div className="text-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-morocco-royal border-t-transparent mx-auto" />
          <p className="mt-4 text-slate-500 dark:text-slate-400">{t('common.loading', 'Chargement...')}</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
        <Home size={64} className="text-slate-400" />
        <p className="text-xl text-slate-600 dark:text-slate-400">{t('property.errors.notFound', 'Property not found')}</p>
        <button
          onClick={() => navigate('/home')}
          className="rounded-full bg-morocco-royal px-6 py-3 text-white hover:bg-morocco-royal/80 transition shadow-lg"
        >
          {t('common.back', 'Retour à l\'accueil')}
        </button>
      </div>
    );
  }

  const images = getAllImages(property);
  const videoUrl = getVideoUrl(property);
  const hasVideo = videoUrl !== null && !videoError;
  const allMedia = [...images, ...(hasVideo ? [videoUrl!] : [])];
  const hasDiscount = (property.discountPercentage || 0) > 0;
  const finalPrice = getFinalPrice(property);

  const whatsappText = t('property.details.whatsappMessage', 'Hello, I am interested in your property: {{title}} - {{url}}', {
    title: property.title,
    url: window.location.href,
  });
  const whatsappUrl = property.whatsappNumber
    ? `https://wa.me/${property.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappText)}`
    : undefined;

  const handleMediaClick = (index: number) => {
    setCurrentMediaIndex(index);
    setShowFullGallery(true);
  };

  const ownerScore = property.owner?.responseRate
    ? Math.round(property.owner.responseRate / 20)
    : null;

  const isActiveForTransaction =
    property.status === 'AVAILABLE' || property.status === 'APPROVED';
  const isCurrentUserOwner = isAuthenticated && user?.id === property.ownerId;
  const transactionDisabledReason = isCurrentUserOwner
    ? t('property.details.cannotTransactOwn', 'You cannot reserve your own property')
    : !isActiveForTransaction
    ? t('property.details.notAvailableForTransaction', 'This property is not available for transaction')
    : undefined;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
      >
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-morocco-royal dark:hover:text-morocco-gold transition-colors"
            >
              <ArrowLeft size={20} />
              {t('common.back')}
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Colonne principale */}
            <div className="lg:col-span-2 space-y-6">
              {/* Galerie média */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-lg"
              >
                {allMedia.length > 0 ? (
                  <>
                    <div className="relative h-96 overflow-hidden bg-slate-100 dark:bg-slate-800 group">
                      {currentMediaIndex < images.length ? (
                        <div className="relative h-full w-full">
                          <img
                            src={images[currentMediaIndex]}
                            alt={property.title}
                            className="h-full w-full object-cover cursor-pointer transition-transform duration-500 group-hover:scale-105"
                            onClick={() => handleMediaClick(currentMediaIndex)}
                            onError={(e) => { (e.target as HTMLImageElement).src = '/images/no-image.svg'; }}
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <video
                          src={videoUrl || undefined}
                          className="h-full w-full object-cover"
                          controls
                          autoPlay={false}
                          controlsList="nodownload"
                          onError={() => setVideoError(true)}
                        />
                      )}

                      {currentMediaIndex < images.length && (
                        <button
                          onClick={() => handleMediaClick(currentMediaIndex)}
                          className="absolute bottom-4 right-4 rounded-full bg-black/50 p-2 text-white opacity-0 group-hover:opacity-100 transition"
                        >
                          <Maximize2 size={18} />
                        </button>
                      )}

                      {allMedia.length > 1 && (
                        <>
                          <button
                            onClick={() => setCurrentMediaIndex(prev => prev === 0 ? allMedia.length - 1 : prev - 1)}
                            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
                          >
                            <ChevronLeft size={24} />
                          </button>
                          <button
                            onClick={() => setCurrentMediaIndex(prev => prev === allMedia.length - 1 ? 0 : prev + 1)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
                          >
                            <ChevronRight size={24} />
                          </button>
                        </>
                      )}

                      {allMedia.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                          {allMedia.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentMediaIndex(idx)}
                              className={`h-2 rounded-full transition ${
                                idx === currentMediaIndex ? 'bg-white w-4' : 'bg-white/50'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {allMedia.length > 1 && (
                      <div className="flex gap-2 p-4 overflow-x-auto">
                        {allMedia.map((media, idx) => {
                          const isVideoItem = idx >= images.length;
                          return (
                            <button
                              key={idx}
                              onClick={() => setCurrentMediaIndex(idx)}
                              className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg transition-all ${
                                idx === currentMediaIndex ? 'ring-2 ring-morocco-gold scale-95' : 'opacity-70 hover:opacity-100'
                              }`}
                            >
                              {isVideoItem ? (
                                <div className="flex h-full w-full items-center justify-center bg-slate-800">
                                  <Play size={24} className="text-white" />
                                </div>
                              ) : (
                                <img src={media} alt="" className="h-full w-full object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).src = '/images/no-image.svg'; }} />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex h-96 items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                    <Home size={64} className="text-slate-400" />
                  </div>
                )}
              </motion.div>

              <TrustBadges />

              {/* Titre + Score */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-lg"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-black text-morocco-charcoal dark:text-slate-100">{property.title}</h1>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <MapPin size={16} className="text-morocco-gold" />
                        <span>{property.address}, {property.city}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <Eye size={16} />
                        <span>{property.viewCount || 0} {t('property.details.views')}</span>
                      </div>
                      {averageRating !== null && averageRating > 0 && (
                        <div className="flex items-center gap-1 text-morocco-gold">
                          <Star size={16} className="fill-morocco-gold" />
                          <span className="font-bold">{averageRating.toFixed(1)}</span>
                          <span className="text-slate-400 dark:text-slate-500">({reviews.length} {t('property.details.reviews', 'reviews')})</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleFavorite}
                      className={`rounded-full p-3 transition-all ${
                        isFavorite
                          ? 'bg-morocco-terracotta text-white shadow-lg'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-morocco-terracotta'
                      }`}
                    >
                      <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={handleShare}
                      className="rounded-full bg-slate-100 dark:bg-slate-800 p-3 text-slate-600 dark:text-slate-400 transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      <Share2 size={20} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {property.isVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-sm font-semibold text-green-700 dark:text-green-400">
                      <CheckCircle size={14} />
                      {t('property.verified')}
                    </span>
                  )}
                  {hasDiscount && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/30 px-3 py-1 text-sm font-semibold text-red-700 dark:text-red-400">
                      <Tag size={14} />
                      -{property.discountPercentage}%
                    </span>
                  )}
                  {property.type === 'RENT' && (
                    <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400">{t('property.types.RENT')}</span>
                  )}
                  {property.type === 'BUY' && (
                    <span className="rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-sm font-semibold text-blue-700 dark:text-blue-400">{t('property.types.BUY', 'Buy')}</span>
                  )}
                  {property.type === 'MORTGAGE' && (
                    <span className="rounded-full bg-purple-100 dark:bg-purple-900/30 px-3 py-1 text-sm font-semibold text-purple-700 dark:text-purple-400">{t('property.types.MORTGAGE', 'Rahn')}</span>
                  )}
                  {property.category && (
                    <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 px-3 py-1 text-sm font-semibold text-amber-700 dark:text-amber-400">
                      {t(`property.categories.${property.category}`, property.category || '')}
                    </span>
                  )}
                </div>
              </motion.div>

              {/* Prix */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl bg-gradient-to-r from-morocco-royal to-morocco-emerald p-6 text-white shadow-lg"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-wide text-white/80">{t('common.price')}</p>
                    <p className="text-3xl md:text-4xl font-bold">{formatPrice(finalPrice)}</p>
                    {hasDiscount && (
                      <p className="mt-1 text-sm text-white/70 line-through">{formatPrice(property.price)}</p>
                    )}
                    {property.type === 'RENT' && <p className="text-sm text-white/80">{t('common.perMonth')}</p>}
                  </div>
                  {property.surface > 0 && (
                    <div className="text-right">
                      <p className="text-sm uppercase tracking-wide text-white/80">{t('common.pricePerSquareMeter')}</p>
                      <p className="text-2xl font-bold">{Math.round(finalPrice / property.surface).toLocaleString()} {t('common.currency')}</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Description */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-lg"
              >
                <h2 className="text-xl font-black text-morocco-charcoal dark:text-slate-100 mb-4">{t('common.description')}</h2>
                <p className="whitespace-pre-line text-slate-600 dark:text-slate-400 leading-relaxed">
                  {property.description}
                </p>
              </motion.div>

              {/* Avis + Formulaire */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-black text-morocco-charcoal dark:text-slate-100 flex items-center gap-2">
                    <Star size={20} className="text-morocco-gold" />
                    {t('property.details.reviewsCount', { count: reviews.length })}
                  </h2>
                  {averageRating !== null && averageRating > 0 && (
                    <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full">
                      <Star size={16} className="text-morocco-gold fill-morocco-gold" />
                      <span className="font-bold text-morocco-charcoal dark:text-slate-100">{averageRating.toFixed(1)}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{t('property.details.outOfFive')}</span>
                    </div>
                  )}
                </div>

                {/* Formulaire de création d'avis */}
                <form onSubmit={handleSubmitReview} className="mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('property.details.giveReview')}</h3>
                  <div className="mb-3">
                    <StarRatingInput value={reviewRating} onChange={setReviewRating} />
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder={t('property.details.reviewPlaceholder', 'Share your experience...')}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm text-slate-700 dark:text-slate-200 focus:border-morocco-gold focus:ring-1 focus:ring-morocco-gold outline-none transition mb-3"
                  />
                  <div className="flex items-center justify-between">
                    <button
                      type="submit"
                      disabled={reviewSubmitting || reviewRating === 0}
                      className="bg-morocco-royal text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-morocco-royal/80 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {reviewSubmitting ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <>
                          <ThumbsUp size={14} />
                          {t('property.details.publishReview')}
                        </>
                      )}
                    </button>
                    {reviewSuccess && (
                      <span className="text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-1 animate-pulse">
                        <CheckCheck size={14} />
                        {t('property.details.reviewPublished')}
                      </span>
                    )}
                  </div>
                </form>

                {reviews.length === 0 ? (
                  <p className="text-slate-500 dark:text-slate-400 text-sm">{t('property.details.noReviewsYet')}</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 pb-4 last:pb-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-morocco-gold to-morocco-emerald flex items-center justify-center text-white text-xs font-bold">
                              {review.userName?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{review.userName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                className={i < review.rating ? 'text-morocco-gold fill-morocco-gold' : 'text-slate-300 dark:text-slate-600'}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{review.comment}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          {new Date(review.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric', month: 'long', year: 'numeric'
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Caractéristiques complètes */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-lg"
              >
                <PropertyFeatures property={property} finalPrice={finalPrice} />
              </motion.div>

              {/* Propriétés similaires */}
              {similarProperties && similarProperties.length > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.45 }}
                  className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-lg"
                >
                  <h2 className="text-xl font-black text-morocco-charcoal dark:text-slate-100 mb-4 flex items-center gap-2">
                    <Sparkles size={20} className="text-morocco-gold" />
                    {t('property.details.similarProperties', 'Similar properties')}
                  </h2>
                  <div className="grid gap-6 md:grid-cols-2">
                    {similarProperties.slice(0, 4).map((p) => (
                      <PropertyCard
                        key={p.id}
                        id={p.id}
                        title={p.title}
                        location={`${p.city}${p.address ? `, ${p.address}` : ''}`}
                        price={p.price}
                        pricePerMeter={p.pricePerSquareMeter}
                        imageUrl={p.images?.[0]}
                        beds={p.bedrooms}
                        baths={p.bathrooms}
                        surface={p.surface}
                        type={p.type}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Colonne latérale - Contact & Infos */}
            <div className="space-y-6">
              {/* Carte propriétaire enrichie */}
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="sticky top-24 rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-lg"
              >
                <h2 className="text-lg font-black text-morocco-charcoal dark:text-slate-100 mb-4">{t('property.details.contactOwner')}</h2>

                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-morocco-gold to-morocco-emerald text-white font-black text-xl shadow-lg">
                    {property.ownerName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-morocco-charcoal dark:text-slate-100 truncate">{property.ownerName || t('property.owner')}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {property.isVerified && (
                        <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle size={12} />
                          {t('property.verified')}
                        </span>
                      )}
                      {property.owner?.isPro && (
                        <span className="inline-flex items-center gap-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                          <Award size={12} />
                          {t('common.pro')}
                        </span>
                      )}
                    </div>
                    {/* Score propriétaire */}
                    {(ownerScore !== null || property.owner?.propertiesCount !== undefined) && (
                      <div className="flex items-center gap-3 mt-1.5">
                        {ownerScore !== null && (
                          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <Star size={12} className="text-morocco-gold fill-morocco-gold" />
                            <span>{ownerScore}{t('property.details.outOfFive')}</span>
                          </div>
                        )}
                        {property.owner?.responseRate !== undefined && (
                          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <TrendingUp size={12} className="text-emerald-500" />
                            <span>{property.owner.responseRate}% {t('property.details.responseRate', 'response')}</span>
                          </div>
                        )}
                        {property.owner?.propertiesCount !== undefined && (
                          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <Home size={12} />
                            <span>{property.owner.propertiesCount} {t('property.details.propertiesCount', 'properties')}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Lien profil propriétaire */}
                {property.ownerId > 0 && (
                  <Link
                    to={`/owners/${property.ownerId}`}
                    className="mb-4 flex items-center justify-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-morocco-royal dark:text-morocco-gold transition hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <User size={16} />
                    {t('property.details.viewOwnerProfile', 'View owner profile')}
                  </Link>
                )}

                <div className="space-y-3">
                  {/* WhatsApp */}
                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-3 font-bold text-white transition hover:bg-green-600 shadow-lg"
                    >
                      <MessageCircle size={18} />
                      {t('common.whatsapp')}
                    </a>
                  )}

                  {/* Téléphone */}
                  {property.phoneNumber && (
                    <a
                      href={`tel:${property.phoneNumber}`}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-morocco-royal px-4 py-3 font-bold text-white transition hover:bg-morocco-royal/80 shadow-lg"
                    >
                      <Phone size={18} />
                      {t('property.details.call')}
                    </a>
                  )}

                  {/* Chat / Message */}
                  <button
                    onClick={() => setShowMessageModal(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-morocco-gold bg-white dark:bg-slate-800 px-4 py-3 font-bold text-morocco-charcoal dark:text-slate-100 transition hover:bg-morocco-beige/30 dark:hover:bg-slate-700 shadow-lg"
                  >
                    <Mail size={18} className="text-morocco-gold" />
                    {t('property.details.sendMessage')}
                  </button>

                  {/* Comparer */}
                  <button
                    onClick={() =>
                      isInCompare(property.id)
                        ? removeFromCompare(property.id)
                        : canAddMore
                        ? addToCompare(property)
                        : showToast(t('property.compare.limitReached', 'Compare list is full'), 'warning')
                    }
                    className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 font-bold transition shadow-lg ${
                      isInCompare(property.id)
                        ? 'border-slate-300 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        : 'border-morocco-gold bg-white text-morocco-charcoal hover:bg-morocco-beige/30 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Scale size={18} className={isInCompare(property.id) ? '' : 'text-morocco-gold'} />
                    {isInCompare(property.id)
                      ? t('property.compare.remove', 'Remove from compare')
                      : t('property.compare.add', 'Compare')}
                  </button>

                  {/* Planifier une visite */}
                  <button
                    onClick={() => setShowVisitModal(true)}
                    disabled={!isActiveForTransaction}
                    title={transactionDisabledReason}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-morocco-emerald/10 dark:bg-emerald-900/20 border-2 border-morocco-emerald/30 dark:border-emerald-700/50 px-4 py-3 font-bold text-morocco-emerald dark:text-emerald-400 transition hover:bg-morocco-emerald/20 dark:hover:bg-emerald-900/30 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Calendar size={18} />
                    {t('property.details.scheduleVisit')}
                  </button>

                  {/* Action principale selon le type */}
                  {property.type === 'RENT' && (
                    <button
                      onClick={() => openTransactionFlow('RESERVATION')}
                      disabled={!isActiveForTransaction}
                      title={transactionDisabledReason}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-morocco-royal bg-white dark:bg-slate-800 px-4 py-3 font-bold text-morocco-royal transition hover:bg-morocco-royal/10 dark:hover:bg-slate-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CreditCard size={18} />
                      {t('property.details.reserve', 'Réserver')}
                    </button>
                  )}

                  {property.type === 'BUY' && (
                    <button
                      onClick={() => openTransactionFlow('PURCHASE')}
                      disabled={!isActiveForTransaction}
                      title={transactionDisabledReason}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-morocco-royal px-4 py-3 font-bold text-white transition hover:bg-morocco-royal/80 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CreditCard size={18} />
                      {t('property.details.buy', 'Acheter')}
                    </button>
                  )}

                  {property.type === 'MORTGAGE' && (
                    <button
                      onClick={() => setShowRahnModal(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 font-bold text-white transition hover:bg-purple-700 shadow-lg"
                    >
                      <Info size={18} />
                      {t('property.details.rahn', 'Rahn')}
                    </button>
                  )}

                  {/* Confirmation message */}
                  {messageSent && (
                    <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm animate-pulse">
                      <CheckCheck size={16} />
                      {t('property.details.messageSent')}
                    </div>
                  )}
                  {visitSuccess && (
                    <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm animate-pulse">
                      <CheckCheck size={16} />
                      {t('property.details.visitScheduled')}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Informations */}
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-lg"
              >
                <h2 className="text-lg font-black text-morocco-charcoal dark:text-slate-100 mb-4">{t('property.details.information')}</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{t('property.details.reference')}</span>
                    <span className="font-bold text-morocco-charcoal dark:text-slate-100">#{property.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{t('property.details.publishedAt')}</span>
                    <span className="text-morocco-charcoal dark:text-slate-200">
                      {new Date(property.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </span>
                  </div>
                  {property.constructionYear && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">{t('common.constructionYear')}</span>
                      <span className="text-morocco-charcoal dark:text-slate-200">{property.constructionYear}</span>
                    </div>
                  )}
                  {property.surface && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">{t('common.surface')}</span>
                      <span className="text-morocco-charcoal dark:text-slate-200">{property.surface} {t('common.squareMeter')}</span>
                    </div>
                  )}
                  {property.paymentMethod && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">{t('common.payment')}</span>
                      <span className="text-morocco-charcoal dark:text-slate-200">
                        {t(`property.paymentMethods.${property.paymentMethod}`, property.paymentMethod)}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Localisation */}
              {property.latitude && property.longitude && (
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-lg"
                >
                  <h2 className="text-lg font-black text-morocco-charcoal dark:text-slate-100 mb-4">{t('common.location')}</h2>
                  <div className="aspect-video overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                    <iframe
                      title="Map"
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${property.longitude - 0.01}%2C${property.latitude - 0.01}%2C${property.longitude + 0.01}%2C${property.latitude + 0.01}&layer=mapnik&marker=${property.latitude}%2C${property.longitude}`}
                      allowFullScreen
                    />
                  </div>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${property.latitude}&mlon=${property.longitude}#map=15/${property.latitude}/${property.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 block text-center text-sm text-morocco-royal dark:text-morocco-gold hover:underline font-medium"
                  >
                    {t('property.details.viewOnMap')}
                  </a>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {showFullGallery && (
          <FullscreenGallery
            images={images}
            videos={hasVideo ? [videoUrl!] : []}
            initialIndex={currentMediaIndex}
            onClose={() => setShowFullGallery(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMessageModal && (
          <MessageModal
            isOpen={showMessageModal}
            onClose={() => setShowMessageModal(false)}
            onSubmit={handleSendMessage}
            recipientName={property.ownerName || 'Propriétaire'}
            isLoading={sendingMessage}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showVisitModal && (
          <VisitScheduleModal
            isOpen={showVisitModal}
            onClose={() => setShowVisitModal(false)}
            onSubmit={handleScheduleVisit}
            isLoading={visitSubmitting}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPaymentModal && (
          <PaymentModal
            amount={paymentAmount}
            description={paymentDescription}
            orderId={paymentOrderId}
            propertyId={propertyId || undefined}
            transactionType={paymentTransactionType}
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            onSuccess={() => {
              setShowPaymentModal(false);
              navigate('/payment/cmi/callback?status=success&oid=' + encodeURIComponent(paymentOrderId));
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRahnModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowRahnModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-black text-morocco-charcoal dark:text-slate-100 mb-2">
                {t('property.details.rahn', 'Rahn')}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                {t('property.details.rahnInfo', 'Rahn (mortgage) requests are handled directly with the owner. Please contact them by message, WhatsApp or phone.')}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRahnModal(false)}
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  {t('common.close')}
                </button>
                <button
                  onClick={() => {
                    setShowRahnModal(false);
                    setShowMessageModal(true);
                  }}
                  className="flex-1 px-4 py-2 rounded-xl bg-morocco-royal text-white font-semibold hover:bg-morocco-royal/80 transition"
                >
                  {t('property.details.sendMessage')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
