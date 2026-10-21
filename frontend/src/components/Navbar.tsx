import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Home,
  Search,
  Heart,
  MessageSquare,
  User,
  Menu,
  X,
  Moon,
  Sun,
  Crown,
  Building2,
  LayoutGrid,
  Users,
  Bot,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { NotificationBell } from "./notifications/NotificationBell";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Button } from "./ui/Button";

const navLinkPaths = [
  { path: "/home", key: "nav.home", icon: Home },
  { path: "/home#properties", key: "nav.properties", icon: Building2 },
  { path: "/home#categories", key: "nav.categories", icon: LayoutGrid },
  { path: "/home#owners", key: "nav.owners", icon: Users },
  { path: "/favorites", key: "nav.favorites", icon: Heart },
  { path: "/messages", key: "nav.messages", icon: MessageSquare },
];

export const Navbar: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = navLinkPaths.map((link) => ({ ...link, label: t(link.key) }));

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const darkMode = resolvedTheme === "dark";
  const isHome = location.pathname === "/home" || location.pathname === "/";

  const scrollToChatbot = () => {
    // Try to open the floating chatbot widget by clicking its toggle button
    const chatbotToggle = document.querySelector(
      '[aria-label="' + t("chatbot.open") + '"]'
    ) as HTMLButtonElement | null;
    if (chatbotToggle) {
      chatbotToggle.click();
      return;
    }
    // Fallback: scroll to bottom where the chatbot button is typically located
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const isActiveLink = (path: string) => {
    if (path.startsWith("#")) {
      return location.hash === path;
    }
    return location.pathname === path;
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled || !isHome
            ? "bg-[color:var(--color-surface)]/80 backdrop-blur-xl shadow-lg border-b border-[color:var(--color-border)]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to="/home" className="flex items-center gap-3 group">
              <div className="relative">
                <img
                  src="/images/logo.png"
                  alt={t('common.appName')}
                  className="h-10 w-auto object-contain"
                />
                {!scrolled && isHome && (
                  <div className="absolute -inset-2 bg-gold-400/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
              <div className="hidden sm:flex flex-col">
                <span
                  className={`text-sm font-black tracking-wider leading-none ${
                    scrolled || !isHome
                      ? "text-[color:var(--color-text-primary)]"
                      : "text-white"
                  }`}
                >
                  {t('common.appName')}
                </span>
                <span
                  className={`text-[10px] font-medium tracking-[0.2em] leading-none mt-0.5 ${
                    scrolled || !isHome
                      ? "text-[color:var(--color-text-tertiary)]"
                      : "text-white/60"
                  }`}
                >
                  {t('footer.tagline')}
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = isActiveLink(link.path);
                return (
                  <Link
                    key={link.key}
                    to={link.path}
                    className={`relative px-4 py-2 rounded-xl text-body-sm font-semibold transition-all duration-150 ${
                      isActive
                        ? "text-primary-600 bg-primary-50 dark:bg-primary-900/20"
                        : scrolled || !isHome
                          ? "text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-bg-secondary)]"
                          : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <motion.div
                        layoutId="navbar-indicator"
                        className="absolute bottom-0 left-3 right-3 h-0.5 bg-gold-400 rounded-full"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
              {/* Assistant */}
              <button
                onClick={scrollToChatbot}
                className={`relative px-4 py-2 rounded-xl text-body-sm font-semibold transition-all duration-150 ${
                  scrolled || !isHome
                    ? "text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-bg-secondary)]"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  {t("nav.chatbot")}
                </span>
              </button>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Language Switcher */}
              <LanguageSwitcher
                variant="navbar"
                scrolled={scrolled || !isHome}
                isHome={isHome}
              />

              {/* Dark mode toggle */}
              <button
                onClick={toggleTheme}
                className={`hidden sm:flex p-2.5 rounded-xl transition-colors ${
                  scrolled || !isHome
                    ? "text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-bg-secondary)]"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
                aria-label={darkMode ? t("theme.light") : t("theme.dark")}
              >
                {darkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>

              {/* Notifications */}
              {user && (
                <div className="hidden sm:block">
                  <NotificationBell token={localStorage.getItem("token")} />
                </div>
              )}

              {/* Auth */}
              {user ? (
                <div className="hidden lg:flex items-center gap-3">
                  {user.role === "PROPRIETAIRE" && (
                    <Link
                      to="/property/create"
                      className="hidden xl:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-slate-950 text-xs font-bold hover:shadow-gold-sm transition-shadow"
                    >
                      <Crown size={14} />
                      {t("nav.postListing")}
                    </Link>
                  )}
                  {user.role === "ADMIN" && (
                    <Link
                      to="/admin"
                      className="hidden xl:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-bold hover:shadow-primary-sm transition-shadow"
                    >
                      <Building2 size={14} />
                      {t("admin.title")}
                    </Link>
                  )}
                  <Link
                    to="/dashboard"
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
                      scrolled || !isHome
                        ? "hover:bg-[color:var(--color-bg-secondary)]"
                        : "hover:bg-white/10"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-slate-950 text-sm font-bold">
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <span
                      className={`text-body-sm font-semibold hidden xl:block ${
                        scrolled || !isHome
                          ? "text-[color:var(--color-text-primary)]"
                          : "text-white"
                      }`}
                    >
                      {user.name}
                    </span>
                  </Link>
                  <button
                    onClick={logout}
                    className={`p-2.5 rounded-xl transition-colors ${
                      scrolled || !isHome
                        ? "text-semantic-error-500 hover:bg-semantic-error-50"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    }`}
                    aria-label={t('auth.logout')}
                    title={t('auth.logout')}
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="hidden lg:flex items-center gap-2">
                  <Link to="/login">
                    <Button variant="ghost" size="sm">
                      {t("auth.login.submit")}
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-gold-500 to-gold-600 text-slate-950 hover:shadow-gold-sm"
                    >
                      {t("register.submit")}
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className={`lg:hidden p-2.5 rounded-xl transition-colors ${
                  scrolled || !isHome
                    ? "text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-bg-secondary)]"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                {mobileOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 bg-[color:var(--color-surface)]/95 backdrop-blur-xl border-b border-[color:var(--color-border)] shadow-2xl lg:hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => {
                const isActive = isActiveLink(link.path);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.key}
                    to={link.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-body font-semibold transition-colors ${
                      isActive
                        ? "text-primary-600 bg-primary-50 dark:bg-primary-900/20"
                        : "text-[color:var(--color-text-secondary)]"
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                );
              })}
              {/* Assistant Mobile */}
              <button
                onClick={() => {
                  setMobileOpen(false);
                  scrollToChatbot();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-body font-semibold text-[color:var(--color-text-secondary)]"
              >
                <Bot className="w-5 h-5" />
                {t("nav.chatbot")}
              </button>

              {/* Mobile Language Switcher */}
              <div className="border-t border-[color:var(--color-border)] pt-2 mt-2">
                <LanguageSwitcher variant="mobile" />
              </div>

              <div className="border-t border-[color:var(--color-border)] pt-3 mt-3">
                {user ? (
                  <>
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-[color:var(--color-text-secondary)]"
                    >
                      <User className="w-5 h-5" />
                      {t("nav.account")}
                    </Link>
                    {user.role === "PROPRIETAIRE" && (
                      <Link
                        to="/property/create"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-gold-600"
                      >
                        <Crown className="w-5 h-5" />
                        {t("nav.postListing")}
                      </Link>
                    )}
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-semantic-error-500"
                    >
                      {t("auth.logout")}
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2 px-4">
                    <Link to="/login" className="flex-1">
                      <Button variant="secondary" fullWidth size="sm">
                        {t("auth.login.submit")}
                      </Button>
                    </Link>
                    <Link to="/register" className="flex-1">
                      <Button
                        fullWidth
                        size="sm"
                        className="bg-gradient-to-r from-gold-500 to-gold-600 text-slate-950"
                      >
                        {t("register.submit")}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
