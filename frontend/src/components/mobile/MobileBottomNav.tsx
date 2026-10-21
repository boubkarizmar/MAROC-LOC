import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Home, Search, Heart, MessageSquare, User, Plus, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { path: '/home', icon: Home, label: 'Accueil', labelAr: 'الرئيسية' },
  { path: '/search', icon: Search, label: 'Recherche', labelAr: 'بحث' },
  { path: '/favorites', icon: Heart, label: 'Favoris', labelAr: 'المفضلة' },
  { path: '/messages', icon: MessageSquare, label: 'Messages', labelAr: 'الرسائل' },
  { path: '/dashboard', icon: User, label: 'Profil', labelAr: 'حسابي' },
];

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const { isAuthenticated, user, logout } = useAuth();

  // Only show on mobile
  return (
    <>
      {/* FAB for property creation (owner only) */}
      {isAuthenticated && user?.role === 'PROPRIETAIRE' && (
        <Link
          to="/property/create"
          className="md:hidden fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-slate-950 shadow-gold flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
        >
          <Plus size={24} strokeWidth={2.5} />
        </Link>
      )}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[color:var(--color-surface)]/90 backdrop-blur-xl border-t border-[color:var(--color-border)] safe-area-pb shadow-top-soft">
        <div className="flex items-center justify-around py-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path === '/home' && location.pathname === '/');
            const Icon = item.icon;

            if (item.path !== '/home' && !isAuthenticated) {
              return (
                <Link
                  key={item.path}
                  to="/login"
                  className="flex flex-col items-center gap-0.5 py-1.5 px-3 text-[color:var(--color-text-disabled)]"
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex flex-col items-center gap-0.5 py-1.5 px-3 transition-colors ${
                  isActive ? 'text-gold-500' : 'text-[color:var(--color-text-tertiary)]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute -top-0.5 w-10 h-0.5 bg-gradient-to-r from-gold-400 to-gold-600 rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-gold-400/10' : ''}`}>
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[10px] font-semibold">{item.label}</span>
              </Link>
            );
          })}
          {isAuthenticated && (
            <button
              onClick={logout}
              className="relative flex flex-col items-center gap-0.5 py-1.5 px-3 text-semantic-error-500"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-[10px] font-semibold">{t('auth.logout')}</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
};
