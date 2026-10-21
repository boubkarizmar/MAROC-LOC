import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { LoadingProvider } from './context/LoadingContext';
import { ToastProvider } from './components/ui/Toast';
import { Navbar } from './components/Navbar';
import { Footer } from './components/home/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { SkipLink } from './components/ux/AccessibilityUtils';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AIChatInterface } from './components/ai/AIChatInterface';
import { MobileBottomNav } from './components/mobile/MobileBottomNav';
import { SplashScreen } from './components/SplashScreen';
import './i18n/config';

// Lazy-loaded pages for code splitting (~40% bundle reduction on initial load)
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const PropertyDetails = lazy(() => import('./pages/PropertyDetails').then(m => ({ default: m.PropertyDetails })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const CreateProperty = lazy(() => import('./pages/CreateProperty').then(m => ({ default: m.CreateProperty })));
const Admin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const Inbox = lazy(() => import('./pages/Inbox'));
const Favorites = lazy(() => import('./pages/Favorites'));
const OwnerVisits = lazy(() => import('./pages/OwnerVisits').then(m => ({ default: m.OwnerVisits })));
const OwnerAnalytics = lazy(() => import('./pages/OwnerAnalytics').then(m => ({ default: m.OwnerAnalytics })));
const EditProperty = lazy(() => import('./pages/EditProperty').then(m => ({ default: m.EditProperty })));
const CreateAd = lazy(() => import('./pages/CreateAd').then(m => ({ default: m.CreateAd })));
const PaymentCallback = lazy(() => import('./pages/PaymentCallback').then(m => ({ default: m.PaymentCallback })));
const Search = lazy(() => import('./pages/Search').then(m => ({ default: m.Search })));
const Owners = lazy(() => import('./pages/Owners').then(m => ({ default: m.Owners })));
const OwnerProfile = lazy(() => import('./pages/OwnerProfile').then(m => ({ default: m.OwnerProfile })));
const Cities = lazy(() => import('./pages/Cities').then(m => ({ default: m.Cities })));
const Notifications = lazy(() => import('./pages/Notifications').then(m => ({ default: m.Notifications })));
const AdminNotifications = lazy(() => import('./pages/AdminNotifications').then(m => ({ default: m.AdminNotifications })));
const MyTransactions = lazy(() => import('./pages/MyTransactions').then(m => ({ default: m.MyTransactions })));

// Loading fallback for lazy routes — dark background to match splash theme
const PageFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-950">
    <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-gold-400 border-t-transparent" />
  </div>
);

// ─── Cinematic Page Transition ──────────────────────────────────────
// Detects Splash → Home for a premium cinematic effect
const CINEMATIC_PATHS = ['/home', '/login', '/register'];
const isCinematicTransition = (from: string, to: string) => {
  return from === '/' && CINEMATIC_PATHS.includes(to);
};

// Global hash scroll handler — works across all pages
// Handles lazy-loaded routes by polling for the target element
const HashScrollHandler: React.FC = () => {
  const location = useLocation();
  const isFirstRender = useRef(true);
  const lastHash = useRef('');

  useEffect(() => {
    const hash = window.location.hash || location.hash;
    if (!hash) {
      if (!isFirstRender.current) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      isFirstRender.current = false;
      return;
    }

    // Skip if we've already scrolled to this exact hash
    if (lastHash.current === hash) return;
    lastHash.current = hash;

    const id = hash.replace('#', '');
    const behavior = isFirstRender.current ? ('auto' as ScrollBehavior) : 'smooth';
    const delay = isFirstRender.current ? 100 : 150;

    // Poll for element because routes may be lazy-loaded
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max
    const interval = setInterval(() => {
      attempts++;
      const element = document.getElementById(id);
      if (element) {
        clearInterval(interval);
        setTimeout(() => {
          element.scrollIntoView({ behavior, block: 'start' });
        }, delay);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 100);

    isFirstRender.current = false;
    return () => clearInterval(interval);
  }, [location.pathname, location.hash]);

  // Also listen for hashchange events (e.g. clicking navbar links on same page)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash) {
        const id = hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return null;
};

const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [prevPath, setPrevPath] = useState(location.pathname);

  useEffect(() => {
    const timer = setTimeout(() => setPrevPath(location.pathname), 800);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const isCinematic = isCinematicTransition(prevPath, location.pathname);

  // Cinematic: longer duration, blur + zoom + fade
  // Normal: quick fade + slide
  const variants = isCinematic
    ? {
        initial: { opacity: 0, scale: 1.05, filter: 'blur(8px)' },
        animate: {
          opacity: 1,
          scale: 1,
          filter: 'blur(0px)',
          transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
        },
        exit: {
          opacity: 0,
          scale: 0.97,
          filter: 'blur(6px)',
          transition: { duration: 0.6, ease: [0.33, 0, 0.67, 1] },
        },
      }
    : {
        initial: { opacity: 0, y: 12 },
        animate: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
        },
        exit: {
          opacity: 0,
          y: -12,
          transition: { duration: 0.2, ease: [0.33, 0, 0.67, 1] },
        },
      };

  return (
    <motion.div
      key={location.pathname}
      initial={variants.initial}
      animate={variants.animate}
      exit={variants.exit}
    >
      {children}
    </motion.div>
  );
};

// ─── Onboarding Manager ─────────────────────────────────────────────
const OnboardingManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const completed = localStorage.getItem('marocloc_onboarding_complete');
    const hasSeenSplash = localStorage.getItem('marocloc_splash_seen');
    if (!completed && hasSeenSplash && location.pathname === '/home') {
      const timer = setTimeout(() => setShowOnboarding(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  return (
    <>
      {children}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingWizard
            onComplete={() => setShowOnboarding(false)}
            onSkip={() => setShowOnboarding(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

// ─── Session Expired Handler ────────────────────────────────────────
// Écoute l'événement custom émis par axiosConfig et redirige proprement
const SessionExpiredHandler: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const handler = () => {
      logout();
      navigate('/login', { replace: true });
    };
    window.addEventListener('auth:session-expired' as any, handler);
    return () => window.removeEventListener('auth:session-expired' as any, handler);
  }, [navigate, logout]);

  return null;
};

const LogoutHandler: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => {
      navigate('/login', { replace: true });
    };
    window.addEventListener('auth:logout' as any, handler);
    return () => window.removeEventListener('auth:logout' as any, handler);
  }, [navigate]);

  return null;
};

function AppContent() {
  const location = useLocation();
  const isSplash = location.pathname === '/';
  const isAdmin = location.pathname === '/admin';

  // Splash screen is FULL SCREEN — no layout chrome, no navbar, no footer, no chatbot
  if (isSplash) {
    return <SplashScreen />;
  }

  return (
    <OnboardingManager>
      <HashScrollHandler />
      <SessionExpiredHandler />
      <LogoutHandler />
      {!isAdmin && <SkipLink targetId="main-content" />}
      <div className="premium-page">
        <header>
          <Navbar />
        </header>
        <Suspense fallback={<PageFallback />}>
          {isAdmin ? (
            <ErrorBoundary>
              <Routes location={location} key={location.pathname}>
                <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
                <Route path="/admin/notifications" element={<ProtectedRoute requireAdmin><AdminNotifications /></ProtectedRoute>} />
              </Routes>
            </ErrorBoundary>
          ) : (
            <main id="main-content">
              <PageTransition>
                <ErrorBoundary>
                  <Routes location={location} key={location.pathname}>
                    <Route path="/home" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/property/:id" element={<ErrorBoundary><PropertyDetails /></ErrorBoundary>} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/dashboard/visits" element={<ProtectedRoute requireProprietaire><OwnerVisits /></ProtectedRoute>} />
                  <Route path="/dashboard/analytics" element={<ProtectedRoute requireProprietaire><OwnerAnalytics /></ProtectedRoute>} />
                  <Route path="/property/create" element={<ProtectedRoute requireProprietaire><CreateProperty /></ProtectedRoute>} />
                  <Route path="/property/:id/edit" element={<ProtectedRoute requireProprietaire><EditProperty /></ProtectedRoute>} />
                  <Route path="/ads/create" element={<ProtectedRoute requireProprietaire><CreateAd /></ProtectedRoute>} />
                  <Route path="/messages" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
                  <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
                  <Route path="/payment/cmi/callback" element={<PaymentCallback />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/owners" element={<Owners />} />
                  <Route path="/owners/:id" element={<OwnerProfile />} />
                  <Route path="/cities" element={<Cities />} />
                  <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                  <Route path="/my-transactions" element={<ProtectedRoute><MyTransactions /></ProtectedRoute>} />
                  {/* Redirect unknown routes to home */}
                    <Route path="*" element={<Navigate to="/home" replace />} />
                  </Routes>
                </ErrorBoundary>
              </PageTransition>
            </main>
          )}
        </Suspense>
        <Footer />
      </div>
      {!isAdmin && <AIChatInterface />}
      {!isAdmin && <MobileBottomNav />}
    </OnboardingManager>
  );
}

function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <LoadingProvider>
          <ToastProvider>
            <Router future={{ v7_startTransition: true }}>
              <AppContent />
            </Router>
          </ToastProvider>
        </LoadingProvider>
      </WebSocketProvider>
    </AuthProvider>
  );
}

export default App;
