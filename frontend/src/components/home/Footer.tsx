import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  MapPin,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Send,
  Crown,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useCityStatsDetailed } from '../../hooks/useHomepageData';

export const Footer: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentYear = new Date().getFullYear();
  const isRTL = i18n.dir() === 'rtl';
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const { data: cityStats } = useCityStatsDetailed();

  const exploreLinks = [
    { label: t('nav.home', 'Accueil'), href: '/home' },
    { label: t('nav.properties', 'Biens'), href: '/home#properties' },
    { label: t('nav.categories', 'Catégories'), href: '/home#categories' },
    { label: t('nav.owners', 'Propriétaires'), href: '/home#owners' },
    { label: t('nav.favorites', 'Favoris'), href: '/favorites' },
    { label: t('nav.messages', 'Messages'), href: '/messages' },
    { label: t('nav.dashboard', 'Espace propriétaire'), href: '/dashboard' },
  ];

  const legalLinks = [
    { label: t('footer.terms', "Conditions d'utilisation"), href: '/terms' },
    { label: t('footer.privacy', 'Confidentialité'), href: '/privacy' },
    { label: t('footer.cookies', 'Cookies'), href: '/cookies' },
  ];

  const cities = (Array.isArray(cityStats) ? cityStats : [])
    .sort((a, b) => b.propertyCount - a.propertyCount)
    .slice(0, 8);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 3000);
  };

  return (
    <footer className="relative overflow-hidden bg-[color:var(--color-bg-secondary)] border-t border-[color:var(--color-border)]">
      {/* Top decorative line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/50 to-transparent" />

      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.02] pattern-gold" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        {/* Newsletter Section */}
        <motion.div
          className="mb-12 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-6 sm:p-8"
          initial={{ opacity: 0.01, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="text-center lg:text-left">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-50">
                {t('footer.newsletter.title', 'Restez informé')}
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {t('footer.newsletter.subtitle', 'Recevez nos meilleures annonces et conseils immobiliers')}
              </p>
            </div>
            <form
              onSubmit={handleSubscribe}
              className={`flex w-full lg:w-auto gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('footer.newsletter.placeholder', 'Votre adresse e-mail')}
                className="flex-1 lg:w-72 h-12 px-4 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-600 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 outline-none transition-all"
                required
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-slate-950 font-bold hover:shadow-gold-sm transition-all active:scale-[0.98]"
              >
                <Send size={16} />
                <span className="hidden sm:inline">
                  {t('footer.newsletter.subscribe', "S'abonner")}
                </span>
              </button>
            </form>
          </div>
          {subscribed && (
            <motion.p
              initial={{ opacity: 0.01, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 text-sm text-center lg:text-left text-teal-600 dark:text-teal-400 font-semibold"
            >
              {t('footer.newsletter.success', 'Merci pour votre inscription !')}
            </motion.p>
          )}
        </motion.div>

        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3">
              <img
                src="/images/logo.png"
                alt={t('common.appName')}
                className="h-12 w-auto object-contain"
              />
              <div>
                <span className="text-lg font-black tracking-wider text-[color:var(--color-text-primary)]">
                  {t('common.appName')}
                </span>
                <span className="block text-[10px] font-medium tracking-[0.2em] text-gold-700 dark:text-gold-300">
                  {t('footer.tagline')}
                </span>
              </div>
            </div>
            <p className="mt-5 text-sm leading-7 text-[color:var(--color-text-secondary)]">
              {t('footer.description', 'Plateforme PropTech marocaine pour louer, acheter et valoriser des biens haut de gamme avec une expérience rapide, claire et internationale.')}
            </p>

            {/* Social links */}
            <div className="mt-6 flex items-center gap-3">
              {[
                { Icon: Instagram, label: 'Instagram', href: 'https://instagram.com' },
                { Icon: Facebook, label: 'Facebook', href: 'https://facebook.com' },
                { Icon: Twitter, label: 'X (Twitter)', href: 'https://x.com' },
                { Icon: Linkedin, label: 'LinkedIn', href: 'https://linkedin.com' },
              ].map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-[color:var(--color-bg-tertiary)] text-[color:var(--color-text-tertiary)] hover:text-gold-600 dark:hover:text-gold-400 hover:bg-gold-400/10 transition-colors"
                  aria-label={label}
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Explore Column */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-gold-700 dark:text-gold-300">
              {t('footer.explore', 'Explorer')}
            </h3>
            <div className="mt-5 grid gap-3">
              {exploreLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-sm text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text-primary)] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Cities Column */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-gold-700 dark:text-gold-300">
              {t('footer.cities', 'Villes')}
            </h3>
            <div className="mt-5 grid gap-3">
              {cities.length === 0
                ? ['Casablanca', 'Rabat', 'Marrakech', 'Tanger', 'Fès', 'Agadir'].map((city) => (
                    <Link
                      key={city}
                      to={`/home?city=${city}`}
                      className="flex items-center gap-2 text-sm text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text-primary)] transition-colors"
                    >
                      <MapPin size={14} className="text-gold-400/50" />
                      {city}
                    </Link>
                  ))
                : cities.map((city) => (
                    <Link
                      key={city.slug}
                      to={`/home?city=${city.name}`}
                      className="flex items-center gap-2 text-sm text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text-primary)] transition-colors"
                    >
                      <MapPin size={14} className="text-gold-400/50" />
                      {city.name}
                    </Link>
                  ))}
            </div>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-gold-700 dark:text-gold-300">
              {t('footer.contact', 'Contact')}
            </h3>
            <div className="mt-5 grid gap-4">
              <a href="tel:+212522000000" className="flex items-center gap-3 text-sm text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text-primary)] transition-colors">
                <div className="p-2 rounded-lg bg-[color:var(--color-bg-tertiary)]">
                  <Phone size={14} className="text-gold-400" />
                </div>
                +212 5XX-XXXXXX
              </a>
              <a href="mailto:contact@maroc-loc.ma" className="flex items-center gap-3 text-sm text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text-primary)] transition-colors">
                <div className="p-2 rounded-lg bg-[color:var(--color-bg-tertiary)]">
                  <Mail size={14} className="text-gold-400" />
                </div>
                contact@maroc-loc.ma
              </a>
            </div>

            {/* Legal */}
            <div className="mt-8 pt-6 border-t border-[color:var(--color-border)]">
              <div className="grid gap-2">
                {legalLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="text-xs text-[color:var(--color-text-tertiary)] hover:text-[color:var(--color-text-secondary)] transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-[color:var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[color:var(--color-text-tertiary)]">
            © {currentYear} MAROC-LOC. {t('footer.rights', 'Tous droits réservés.')}
          </p>
          <div className="flex items-center gap-2">
            <Crown size={14} className="text-gold-400" />
            <span className="text-xs text-[color:var(--color-text-tertiary)]">
              {t('footer.madeInMorocco', 'Conçu avec fierté au Maroc')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
