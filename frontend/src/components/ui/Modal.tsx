import React, { useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFocusTrap } from "../ux/AccessibilityUtils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  showCloseButton?: boolean;
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  showCloseButton = true,
}) => {
  const { t } = useTranslation();
  const titleId = title ? "modal-title" : undefined;
  const descId = description ? "modal-desc" : undefined;
  const { containerRef, handleKeyDown } = useFocusTrap(isOpen);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
      return () => window.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  const backdropTransition = prefersReducedMotion ? {} : { duration: 0.2 };
  const modalTransition = prefersReducedMotion
    ? {}
    : { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={backdropTransition}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            ref={containerRef}
            onKeyDown={handleKeyDown}
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 20 }}
            transition={modalTransition}
            className={`
              relative w-full ${sizeClasses[size]}
              bg-[color:var(--color-surface)] rounded-2xl shadow-xl
              border border-[color:var(--color-border)]
              overflow-hidden
            `}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-start justify-between px-6 pt-6 pb-4">
                <div className="flex-1">
                  {title && (
                    <h2 id={titleId} className="text-h4 text-[color:var(--color-text-primary)]">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p id={descId} className="text-body-sm text-[color:var(--color-text-secondary)] mt-1">
                      {description}
                    </p>
                  )}
                </div>
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    aria-label={t("common.close")}
                    className="p-1 rounded-lg hover:bg-[color:var(--color-bg-secondary)] transition-colors"
                  >
                    <X className="w-5 h-5 text-[color:var(--color-text-secondary)]" aria-hidden="true" />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="px-6 pb-6">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="px-6 py-4 border-t border-[color:var(--color-border)] bg-[color:var(--color-bg-secondary)]">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
