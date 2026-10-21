import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, BadgeCheck, Quote, Send } from 'lucide-react';
import { usePlatformReviewStats, useVerifiedReviews } from '../../hooks/useHomepageData';
import { useSiteReviews, useSiteReviewStats, useSubmitSiteReview } from '../../hooks/useSiteReviews';
import { fixMediaUrl } from '../../utils/imageUtils';

const containerVariants = {
  hidden: { opacity: 0.01 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0.01, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const GRADIENTS = [
  'from-teal-500 to-emerald-500',
  'from-blue-500 to-indigo-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-violet-500 to-purple-500',
  'from-cyan-500 to-sky-500',
];

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={14}
        className={i < rating ? 'text-gold-400 fill-gold-400' : 'text-slate-300 dark:text-slate-600'}
      />
    ))}
  </div>
);

const DistributionBar: React.FC<{
  stars: number;
  count: number;
  total: number;
}> = ({ stars, count, total }) => {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-3 font-bold text-slate-600 dark:text-slate-300">{stars}</span>
      <Star size={12} className="text-gold-400 fill-gold-400 -ml-1.5" />
      <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-gold-400 to-amber-500"
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
      </div>
      <span className="w-10 text-right text-xs text-slate-500 dark:text-slate-400">
        {count}
      </span>
    </div>
  );
};

const ReviewSkeleton: React.FC = () => (
  <div className="flex-shrink-0 w-[300px] sm:w-[340px] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
      <div className="space-y-2">
        <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    </div>
    <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded mb-2" />
    <div className="h-3 w-4/5 bg-slate-200 dark:bg-slate-700 rounded" />
  </div>
);

export const ReviewsSection: React.FC = () => {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: stats, isLoading: statsLoading } = usePlatformReviewStats();
  const { data: reviews, isLoading: reviewsLoading } = useVerifiedReviews();
  const { data: siteReviews } = useSiteReviews();
  const { data: siteStats } = useSiteReviewStats();
  const submitReview = useSubmitSiteReview();
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [newName, setNewName] = useState('');

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 360;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const verifiedReviews = (reviews || []).filter((r) => r.rating > 0).slice(0, 12);

  const distributionEntries = stats?.distribution
    ? Object.entries(stats.distribution)
        .map(([k, v]) => ({ stars: parseInt(k, 10), count: v }))
        .sort((a, b) => b.stars - a.stars)
    : [];

  const totalDist = distributionEntries.reduce((sum, d) => sum + d.count, 0);

  return (
    <section className="py-16 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-10 text-center"
          initial={{ opacity: 0.01, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
            {t('home.reviews.title', 'Avis vérifiés')}
          </h2>
          <p className="mt-3 text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            {t('home.reviews.subtitle', 'Ce que nos utilisateurs disent de leur expérience')}
          </p>
          <div className="mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-gold-400 to-teal-500 mx-auto" />
        </motion.div>

        {/* Platform Stats */}
        {statsLoading ? (
          <div className="mb-10 max-w-xl mx-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 animate-pulse">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="space-y-2">
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
            </div>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded" />
              ))}
            </div>
          </div>
        ) : stats ? (
          <motion.div
            className="mb-10 max-w-xl mx-auto rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-6 shadow-sm"
            initial={{ opacity: 0.01, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-center gap-6 mb-6">
              <div className="text-center">
                <div className="text-4xl font-black text-slate-900 dark:text-slate-50">
                  {stats.averageRating.toFixed(1)}
                </div>
                <StarRating rating={Math.round(stats.averageRating)} />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {t('home.reviews.globalScore', 'Note globale')}
                </p>
              </div>
              <div className="w-px h-12 bg-slate-200 dark:bg-slate-700" />
              <div className="text-center">
                <div className="text-4xl font-black text-slate-900 dark:text-slate-50">
                  {stats.totalReviews}
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {t('home.reviews.totalReviews', 'Avis vérifiés')}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {distributionEntries.map((entry) => (
                <DistributionBar
                  key={entry.stars}
                  stars={entry.stars}
                  count={entry.count}
                  total={totalDist}
                />
              ))}
            </div>
          </motion.div>
        ) : null}

        {/* Reviews carousel */}
        {reviewsLoading ? (
          <div className="flex gap-4 overflow-hidden pb-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ReviewSkeleton key={i} />
            ))}
          </div>
        ) : verifiedReviews.length === 0 ? (
          <p className="text-center text-slate-500 dark:text-slate-400 py-8">
            {t('home.reviews.empty', 'Aucun avis pour le moment')}
          </p>
        ) : (
          <div className="relative group">
            {/* Scroll buttons */}
            <div className="hidden sm:flex items-center justify-end gap-2 mb-4">
              <button
                onClick={() => scroll('left')}
                className="p-2.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label={t('common.previous', 'Précédent')}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="p-2.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label={t('common.next', 'Suivant')}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory scroll-smooth scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {verifiedReviews.map((review, index) => {
                const gradient = GRADIENTS[index % GRADIENTS.length];
                const initial = review.userName?.charAt(0).toUpperCase() || '?';

                return (
                  <motion.div
                    key={review.id}
                    variants={itemVariants}
                    className="flex-shrink-0 w-[300px] sm:w-[340px] snap-start rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-5 transition-all duration-300 hover:shadow-lg dark:hover:shadow-slate-900/50"
                  >
                    {/* Quote icon */}
                    <Quote size={20} className="text-teal-400/30 mb-3" />

                    {/* Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br ${gradient} text-white text-sm font-bold shrink-0`}
                      >
                        {review.userAvatar ? (
                          <img
                            src={fixMediaUrl(review.userAvatar)}
                            alt={review.userName}
                            className="w-full h-full rounded-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          initial
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                          {review.userName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{review.city}</p>
                      </div>
                      <div className="ml-auto flex items-center gap-1 rounded-full bg-teal-500/10 dark:bg-teal-500/10 px-2 py-0.5">
                        <BadgeCheck size={12} className="text-teal-500" />
                        <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400">
                          {t('home.reviews.verified', 'Vérifié')}
                        </span>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="mb-3">
                      <StarRating rating={review.rating} />
                    </div>

                    {/* Comment */}
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-4">
                      {review.comment}
                    </p>
                  </motion.div>
                );
              })}
            </div>

            {/* Fade edges */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-slate-50 dark:from-slate-900 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-slate-50 dark:from-slate-900 to-transparent" />
          </div>
        )}
        <motion.div
          className="mt-12 max-w-xl mx-auto rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-6 shadow-sm"
          initial={{ opacity: 0.01, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 text-center mb-4">
            {t('home.reviews.leaveReview', 'Laisser un avis')}
          </h3>

          {/* Star rating selector */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setNewRating(i + 1)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  size={28}
                  className={i < newRating ? 'text-gold-400 fill-gold-400' : 'text-slate-300 dark:text-slate-600'}
                />
              </button>
            ))}
          </div>

          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t('home.reviews.commentPlaceholder', 'Votre commentaire...')}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 mb-3"
            rows={3}
          />

          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t('home.reviews.namePlaceholder', 'Votre nom')}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 mb-4"
          />

          <button
            onClick={() => {
              if (newRating === 0 || !newComment.trim()) return;
              submitReview.mutate({
                rating: newRating,
                comment: newComment.trim(),
                userName: newName.trim() || undefined,
              }, {
                onSuccess: () => {
                  setNewRating(0);
                  setNewComment('');
                  setNewName('');
                }
              });
            }}
            disabled={submitReview.isPending || newRating === 0 || !newComment.trim()}
            className="w-full py-3 rounded-xl text-sm font-bold bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Send size={16} />
            {t('home.reviews.submit', 'Envoyer mon avis')}
          </button>
        </motion.div>
      </div>
    </section>
  );
};
