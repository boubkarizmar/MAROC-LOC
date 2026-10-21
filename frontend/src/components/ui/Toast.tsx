import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from "lucide-react";

export type ToastVariant = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastContextType {
  addToast: (message: string, variant?: ToastVariant, duration?: number) => void;
  showToast: (message: string, variant?: ToastVariant, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};

const variantConfig: Record<
  ToastVariant,
  { icon: React.ReactNode; styles: string }
> = {
  success: {
    icon: <CheckCircle className="w-5 h-5" />,
    styles: "bg-semantic-success-50 text-semantic-success-600 border-semantic-success-200",
  },
  error: {
    icon: <AlertCircle className="w-5 h-5" />,
    styles: "bg-semantic-error-50 text-semantic-error-600 border-semantic-error-200",
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5" />,
    styles: "bg-semantic-warning-50 text-semantic-warning-600 border-semantic-warning-200",
  },
  info: {
    icon: <Info className="w-5 h-5" />,
    styles: "bg-semantic-info-50 text-semantic-info-600 border-semantic-info-200",
  },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (message: string, variant: ToastVariant = "info", duration = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, variant, duration }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = addToast;

  return (
    <ToastContext.Provider value={{ addToast, showToast, removeToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg
                min-w-[320px] max-w-[480px]
                ${variantConfig[toast.variant].styles}
              `}
            >
              {variantConfig[toast.variant].icon}
              <p className="flex-1 text-body-sm font-medium">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
